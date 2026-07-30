from functools import wraps

from django.contrib import messages
from django.http import HttpResponse, HttpResponseForbidden
from django.shortcuts import redirect, render

from .api import ApiError, download_api, request_api
from .forms import (
    AccesoUsuarioForm,
    AsignarEvaluadorForm,
    CalificacionForm,
    ConfiguracionTrlForm,
    CreateUserForm,
    EvaluacionTRLForm,
    LoginForm,
    MfaForm,
    ObservacionForm,
    ProyectoForm,
    RegisterForm,
    evaluation_initial,
)


def is_authenticated(request):
    return bool(request.session.get('access_token'))


def current_role(request):
    return request.session.get('user', {}).get('rol')


def home_route(request):
    return 'dashboard' if current_role(request) == 'GESTOR_IDI' else 'listado_proyectos'


def auth_required(view_func):
    @wraps(view_func)
    def wrapper(request, *args, **kwargs):
        if not is_authenticated(request):
            return redirect('login')
        return view_func(request, *args, **kwargs)
    return wrapper


def role_required(*allowed_roles):
    def decorator(view_func):
        @wraps(view_func)
        @auth_required
        def wrapper(request, *args, **kwargs):
            if current_role(request) not in allowed_roles:
                return HttpResponseForbidden('No tiene permisos para esta operación.')
            return view_func(request, *args, **kwargs)
        return wrapper
    return decorator


def token(request):
    return request.session.get('access_token', '')


def handle_api_error(request, error):
    if error.status == 401:
        request.session.flush()
        return redirect('login')
    if error.code == 'LEGAL_ACCEPTANCE_REQUIRED':
        return redirect('consentimiento')
    return None


def login_view(request):
    if is_authenticated(request):
        return redirect(home_route(request))
    error = None
    form = LoginForm(request.POST or None)
    if request.method == 'POST' and form.is_valid():
        try:
            result = request_api('POST', '/auth/login', json=form.cleaned_data)
            request.session['mfa_ticket'] = result['mfa_ticket']
            return redirect('mfa_verify')
        except ApiError as exc:
            error = exc.message
    return render(request, 'auth/login.html', {'form': form, 'error': error})


def register_view(request):
    if is_authenticated(request):
        return redirect(home_route(request))
    error = None
    success_data = None
    form = RegisterForm(request.POST or None)
    if request.method == 'POST' and form.is_valid():
        payload = {
            key: value
            for key, value in form.cleaned_data.items()
            if key != 'confirmar_contrasena'
        }
        try:
            success_data = request_api('POST', '/auth/register', json=payload)
            form = RegisterForm()
        except ApiError as exc:
            error = exc.message
    return render(request, 'auth/register.html', {
        'form': form,
        'error': error,
        'success_data': success_data,
    })


def mfa_verify_view(request):
    ticket = request.session.get('mfa_ticket')
    if not ticket:
        return redirect('login')
    error = None
    form = MfaForm(request.POST or None)
    if request.method == 'POST' and form.is_valid():
        try:
            result = request_api('POST', '/auth/mfa/verify', json={
                'mfa_ticket': ticket,
                'codigo': form.cleaned_data['codigo'],
            })
            request.session.cycle_key()
            request.session['access_token'] = result['access_token']
            request.session.pop('mfa_ticket', None)
            request.session['user'] = request_api('GET', '/auth/me', token=result['access_token'])
            legal = request_api('GET', '/legal/status', token=result['access_token'])
            destination = 'consentimiento' if any(not item['aceptado'] for item in legal) else home_route(request)
            return redirect(destination)
        except ApiError as exc:
            error = exc.message
    return render(request, 'auth/mfa_verify.html', {'form': form, 'error': error})


@auth_required
def consentimiento_view(request):
    error = None
    documents = []
    pending = []
    try:
        documents = request_api('GET', '/legal/status', token=token(request))
        pending = [item for item in documents if not item['aceptado']]
        if request.method == 'POST':
            for document in pending:
                request_api('POST', '/legal/events', token=token(request), json={
                    'tipo': document['tipo'],
                    'decision': 'ACEPTADO',
                    'version_documento': document['version'],
                })
            return redirect(home_route(request))
    except ApiError as exc:
        redirect_response = handle_api_error(request, exc)
        if redirect_response:
            return redirect_response
        error = exc.message
    return render(request, 'legal/consentimiento.html', {
        'documents': documents,
        'pending': pending,
        'error': error,
    })


@auth_required
def logout_view(request):
    try:
        request_api('POST', '/auth/logout', token=token(request))
    except ApiError:
        pass
    request.session.flush()
    return redirect('login')


@role_required('INVESTIGADOR', 'EVALUADOR', 'ADMINISTRADOR')
def listado_proyectos(request):
    error = None
    projects = []
    try:
        project_page = request_api('GET', '/projects?page=1&limit=100', token=token(request))
        projects = project_page.get('data', [])
        evaluations = request_api('GET', '/evaluations', token=token(request))
        evaluations_by_project = {item['proyecto']['id_proyecto']: item for item in evaluations}
        for project in projects:
            project['evaluacion'] = evaluations_by_project.get(project['id_proyecto'])
    except ApiError as exc:
        redirect_response = handle_api_error(request, exc)
        if redirect_response:
            return redirect_response
        error = exc.message
    return render(request, 'projects/listado.html', {'proyectos': projects, 'error_api': error})


@role_required('INVESTIGADOR')
def crear_proyecto(request):
    error = None
    form = ProyectoForm(request.POST or None)
    if request.method == 'POST' and form.is_valid():
        try:
            request_api('POST', '/projects', token=token(request), json=form.cleaned_data)
            messages.success(request, 'Proyecto registrado correctamente.')
            return redirect('listado_proyectos')
        except ApiError as exc:
            redirect_response = handle_api_error(request, exc)
            if redirect_response:
                return redirect_response
            error = exc.message
    return render(request, 'projects/crear.html', {'form': form, 'error_api': error})


def find_evaluation(request, project_id):
    evaluations = request_api('GET', '/evaluations', token=token(request))
    return next((item for item in evaluations if item['proyecto']['id_proyecto'] == str(project_id)), None)


@role_required('INVESTIGADOR')
def evaluar_trl(request, proyecto_id):
    error = None
    evaluation = None
    documents = []
    try:
        evaluation = find_evaluation(request, proyecto_id)
        documents = request_api('GET', f'/evidence/project/{proyecto_id}', token=token(request))
        responses = evaluation.get('respuestas', {}) if evaluation else {}
        form = EvaluacionTRLForm(
            request.POST or None,
            request.FILES or None,
            initial=evaluation_initial(responses),
            require_evidence=not documents,
        )
        if request.method == 'POST' and form.is_valid():
            if not evaluation:
                created = request_api('POST', '/evaluations', token=token(request), json={
                    'id_proyecto': str(proyecto_id),
                })
                evaluation = {
                    'id_solicitud': created['id_solicitud'],
                    'id_cuestionario': created['cuestionario']['id_cuestionario'],
                }
            request_api(
                'PUT',
                f"/evaluations/{evaluation['id_solicitud']}/answers",
                token=token(request),
                json={'respuestas': form.respuestas()},
            )
            uploaded = form.cleaned_data.get('evidencia_pdf')
            if uploaded:
                request_api(
                    'POST',
                    f"/evidence/questionnaires/{evaluation['id_cuestionario']}",
                    token=token(request),
                    files={'file': (uploaded.name, uploaded.file, uploaded.content_type)},
                    timeout=30,
                )
            messages.success(request, 'Nivel, respuestas y evidencia TRL guardados correctamente.')
            return redirect('tabla_evidencias', proyecto_id=proyecto_id)
    except ApiError as exc:
        form = EvaluacionTRLForm(
            request.POST or None,
            request.FILES or None,
            initial=evaluation_initial({}),
            require_evidence=not documents,
        )
        redirect_response = handle_api_error(request, exc)
        if redirect_response:
            return redirect_response
        error = exc.message
    return render(request, 'evaluations/formulario.html', {
        'form': form,
        'proyecto_id': proyecto_id,
        'evaluacion': evaluation,
        'question_groups': form.question_groups(),
        'selected_level': form['nivel_objetivo'].value() or 1,
        'existing_documents': documents,
        'error_api': error,
    })


@role_required('INVESTIGADOR', 'EVALUADOR')
def tabla_evidencias(request, proyecto_id):
    error = None
    evaluation = None
    documents = []
    try:
        evaluation = find_evaluation(request, proyecto_id)
        if request.method == 'POST':
            action = request.POST.get('action')
            if action == 'upload' and current_role(request) == 'INVESTIGADOR':
                uploaded = request.FILES.get('file')
                if not uploaded or not evaluation or not evaluation.get('id_cuestionario'):
                    raise ApiError(400, 'Primero complete el cuestionario y seleccione un PDF.')
                request_api(
                    'POST',
                    f"/evidence/questionnaires/{evaluation['id_cuestionario']}",
                    token=token(request),
                    files={'file': (uploaded.name, uploaded.file, uploaded.content_type)},
                    timeout=30,
                )
                messages.success(request, 'Evidencia PDF cargada correctamente.')
            elif action == 'submit' and current_role(request) == 'INVESTIGADOR' and evaluation:
                request_api('POST', f"/evaluations/{evaluation['id_solicitud']}/submit", token=token(request))
                messages.success(request, 'Solicitud enviada para asignación y evaluación.')
            else:
                return HttpResponseForbidden('Acción no autorizada.')
            return redirect('tabla_evidencias', proyecto_id=proyecto_id)
        documents = request_api('GET', f'/evidence/project/{proyecto_id}', token=token(request))
    except ApiError as exc:
        redirect_response = handle_api_error(request, exc)
        if redirect_response:
            return redirect_response
        error = exc.message
    return render(request, 'evidence/tabla.html', {
        'proyecto_id': proyecto_id,
        'evaluacion': evaluation,
        'documentos': documents,
        'error_api': error,
    })


@role_required('INVESTIGADOR', 'EVALUADOR')
def descargar_evidencia(request, documento_id):
    try:
        response = download_api(f'/evidence/{documento_id}', token(request))
        result = HttpResponse(response.content, content_type=response.headers.get('Content-Type', 'application/pdf'))
        result['Content-Disposition'] = response.headers.get('Content-Disposition', 'attachment; filename="evidencia.pdf"')
        result['Cache-Control'] = 'no-store'
        return result
    except ApiError as exc:
        return HttpResponse(exc.message, status=exc.status)


@role_required('INVESTIGADOR', 'EVALUADOR', 'ADMINISTRADOR')
def solicitudes_view(request):
    error = None
    evaluations = []
    evaluators = []
    role = current_role(request)
    try:
        if role == 'ADMINISTRADOR':
            users_page = request_api('GET', '/usuarios?page=1&limit=100', token=token(request))
            evaluators = [
                item for item in users_page.get('data', [])
                if item.get('rol') == 'EVALUADOR' and item.get('estado') == 'ACTIVO'
            ]
        if request.method == 'POST':
            action = request.POST.get('action')
            evaluation_id = request.POST.get('id_solicitud', '')
            if action == 'assign' and role == 'ADMINISTRADOR':
                form = AsignarEvaluadorForm(request.POST, evaluadores=evaluators)
                if form.is_valid():
                    request_api('PATCH', f'/evaluations/{evaluation_id}/assign', token=token(request), json={
                        'id_evaluador': form.cleaned_data['id_evaluador'],
                    })
                    messages.success(request, 'Evaluador asignado correctamente.')
                else:
                    messages.error(request, 'Seleccione un evaluador activo.')
            elif action == 'observe' and role == 'EVALUADOR':
                form = ObservacionForm(request.POST)
                if form.is_valid():
                    request_api('POST', f'/evaluations/{evaluation_id}/observations', token=token(request), json=form.cleaned_data)
                    messages.success(request, 'Observación enviada al investigador.')
                else:
                    messages.error(request, 'La observación no es válida.')
            elif action == 'observation_state' and role in ('INVESTIGADOR', 'EVALUADOR'):
                state = 'CORREGIDA' if role == 'INVESTIGADOR' else 'CERRADA'
                observation_id = request.POST.get('id_observacion', '')
                request_api('PATCH', f'/evaluations/observations/{observation_id}', token=token(request), json={
                    'estado': state,
                })
                messages.success(request, 'Estado de la observación actualizado.')
            elif action == 'rate' and role == 'EVALUADOR':
                form = CalificacionForm(request.POST)
                if form.is_valid():
                    request_api('POST', f'/evaluations/{evaluation_id}/rating', token=token(request), json=form.cleaned_data)
                    messages.success(request, 'Evaluación final registrada correctamente.')
                else:
                    messages.error(request, 'Revise el nivel aprobado y el dictamen.')
            else:
                return HttpResponseForbidden('Acción no autorizada.')
            return redirect('solicitudes')
        evaluations = request_api('GET', '/evaluations', token=token(request))
    except ApiError as exc:
        redirect_response = handle_api_error(request, exc)
        if redirect_response:
            return redirect_response
        error = exc.message
    return render(request, 'evaluations/solicitudes.html', {
        'solicitudes': evaluations,
        'evaluadores': evaluators,
        'role': role,
        'error_api': error,
    })


@role_required('ADMINISTRADOR')
def logs_auditoria(request):
    error = None
    try:
        events = request_api('GET', '/audit', token=token(request))
    except ApiError as exc:
        redirect_response = handle_api_error(request, exc)
        if redirect_response:
            return redirect_response
        events, error = [], exc.message
    return render(request, 'audit/logs.html', {'eventos': events, 'error_api': error})


@role_required('ADMINISTRADOR')
def create_user_view(request):
    error = None
    success = None
    form = CreateUserForm(request.POST or None)
    if request.method == 'POST' and form.is_valid():
        payload = {key: value for key, value in form.cleaned_data.items() if value not in ('', None)}
        try:
            success = request_api('POST', '/usuarios', token=token(request), json=payload)
            form = CreateUserForm()
        except ApiError as exc:
            redirect_response = handle_api_error(request, exc)
            if redirect_response:
                return redirect_response
            error = exc.message
    return render(request, 'admin/create_user.html', {
        'form': form,
        'error_api': error,
        'success_data': success,
    })


@role_required('ADMINISTRADOR')
def usuarios_view(request):
    error = None
    users = []
    if request.method == 'POST':
        form = AccesoUsuarioForm(request.POST)
        if form.is_valid():
            try:
                request_api(
                    'PATCH',
                    f"/usuarios/{request.POST.get('id_usuario', '')}/access",
                    token=token(request),
                    json=form.cleaned_data,
                )
                messages.success(request, 'Acceso del usuario actualizado; sus sesiones fueron revocadas.')
                return redirect('usuarios')
            except ApiError as exc:
                redirect_response = handle_api_error(request, exc)
                if redirect_response:
                    return redirect_response
                error = exc.message
        else:
            error = 'Los datos de acceso seleccionados no son válidos.'
    try:
        page = request_api('GET', '/usuarios?page=1&limit=100', token=token(request))
        users = page.get('data', [])
    except ApiError as exc:
        redirect_response = handle_api_error(request, exc)
        if redirect_response:
            return redirect_response
        error = exc.message
    return render(request, 'admin/users.html', {
        'usuarios': users,
        'estados': AccesoUsuarioForm.ESTADOS,
        'error_api': error,
    })


@role_required('ADMINISTRADOR')
def configuracion_trl_view(request):
    error = None
    success = False
    form = ConfiguracionTrlForm(request.POST or None)
    if request.method == 'POST' and form.is_valid():
        try:
            request_api('POST', '/management/trl-configurations', token=token(request), json={
                'version': form.cleaned_data['version'],
                'parametros_universidad': form.cleaned_data['parametros_json'],
            })
            success = True
        except ApiError as exc:
            redirect_response = handle_api_error(request, exc)
            if redirect_response:
                return redirect_response
            error = exc.message
    return render(request, 'management/configuracion.html', {
        'form': form,
        'error_api': error,
        'success': success,
    })


@role_required('GESTOR_IDI')
def dashboard_view(request):
    error = None
    dashboard = {}
    try:
        dashboard = request_api('POST', '/management/dashboard', token=token(request))
    except ApiError as exc:
        redirect_response = handle_api_error(request, exc)
        if redirect_response:
            return redirect_response
        error = exc.message
    return render(request, 'management/dashboard.html', {
        'dashboard': dashboard,
        'error_api': error,
    })


@role_required('ADMINISTRADOR')
def descargar_reporte(request, numero):
    try:
        response = download_api(f'/management/reports/{numero}', token(request))
        result = HttpResponse(response.content, content_type='application/pdf')
        result['Content-Disposition'] = response.headers.get('Content-Disposition', f'attachment; filename="{numero}.pdf"')
        result['Cache-Control'] = 'no-store'
        return result
    except ApiError as exc:
        return HttpResponse(exc.message, status=exc.status)
