import requests
from django.shortcuts import render, redirect
from django.urls import reverse
from .forms import CreateUserForm, EvaluacionTRLForm, LoginForm, MfaForm, ProyectoForm

NESTJS_API_URL = "http://localhost:3000/api"

# ==============================================================================
# HELPERS Y DECORADORES DE AUTENTICACIÓN
# ==============================================================================

def is_authenticated(request):
    """Verifica si hay un token de acceso en la sesión."""
    return 'access_token' in request.session

def auth_required(view_func):
    """Decorador para proteger vistas que requieren autenticación."""
    def wrapper(request, *args, **kwargs):
        if not is_authenticated(request):
            return redirect('login')
        return view_func(request, *args, **kwargs)
    return wrapper

def get_auth_headers(request):
    """Construye los encabezados de autorización para las peticiones a la API."""
    token = request.session.get('access_token')
    return {'Authorization': f'Bearer {token}'} if token else {}

# ==============================================================================
# VISTAS DE AUTENTICACIÓN (AUTH)
# ==============================================================================

def login_view(request):
    if is_authenticated(request):
        return redirect('listado_proyectos')

    error = None
    if request.method == 'POST':
        form = LoginForm(request.POST)
        if form.is_valid():
            payload = form.cleaned_data
            try:
                response = requests.post(f"{NESTJS_API_URL}/auth/login", json=payload, timeout=5)
                if response.status_code == 201:
                    # El backend devolvió un ticket MFA, redirigimos al usuario para que ingrese el código.
                    mfa_ticket = response.json().get('mfa_ticket')
                    return redirect(f"{reverse('mfa_verify')}?ticket={mfa_ticket}")
                else:
                    error = response.json().get('message', 'Credenciales inválidas.')
            except requests.exceptions.RequestException:
                error = "Error de conexión con el servidor de autenticación."
    else:
        form = LoginForm()

    return render(request, 'auth/login.html', {'form': form, 'error': error})

def mfa_verify_view(request):
    error = None
    ticket = request.GET.get('ticket')

    if not ticket:
        return redirect('login')

    if request.method == 'POST':
        form = MfaForm(request.POST)
        if form.is_valid():
            payload = form.cleaned_data
            try:
                response = requests.post(f"{NESTJS_API_URL}/auth/mfa/verify", json=payload, timeout=5)
                if response.status_code == 201:
                    # ¡Autenticación exitosa! Guardamos el token en la sesión.
                    request.session['access_token'] = response.json().get('access_token')
                    return redirect('listado_proyectos')
                else:
                    error = response.json().get('message', 'Código MFA inválido o el ticket ha expirado.')
            except requests.exceptions.RequestException:
                error = "Error de conexión con el servidor de autenticación."
    else:
        form = MfaForm(initial={'mfa_ticket': ticket})

    return render(request, 'auth/mfa_verify.html', {'form': form, 'error': error})

@auth_required
def logout_view(request):
    """Limpia la sesión local y (opcionalmente) notifica al backend."""
    if 'access_token' in request.session:
        # Opcional: llamar al endpoint de logout del backend si existe para invalidar el token en el servidor.
        # requests.post(f"{NESTJS_API_URL}/auth/logout", headers=get_auth_headers(request))
        del request.session['access_token']
    return redirect('login')

# ==============================================================================
# VISTAS DE PROYECTOS Y EVALUACIONES
# ==============================================================================

@auth_required
def listado_proyectos(request):
    try:
        # Ahora la petición incluye el token de autenticación
        response = requests.get(f"{NESTJS_API_URL}/projects", headers=get_auth_headers(request))
        proyectos = response.json() if response.status_code == 200 else []
    except requests.exceptions.RequestException:
        proyectos = []
    
    return render(request, 'projects/listado.html', {'proyectos': proyectos})

@auth_required
def crear_proyecto(request):
    error_api = None
    if request.method == 'POST':
        form = ProyectoForm(request.POST)
        if form.is_valid():
            try:
                response = requests.post(
                    f"{NESTJS_API_URL}/projects",
                    json=form.cleaned_data,
                    headers=get_auth_headers(request)
                )
                if response.status_code == 201:
                    return redirect('listado_proyectos')
                else:
                    error_api = response.json().get('message', 'Error al crear el proyecto.')
            except requests.exceptions.RequestException:
                error_api = "Error de conexión con el servidor."
    else:
        form = ProyectoForm()
    return render(request, 'projects/crear.html', {'form': form, 'error_api': error_api})

@auth_required
def evaluar_trl(request, proyecto_id):
    error_api = None
    if request.method == 'POST':
        form = EvaluacionTRLForm(request.POST)
        if form.is_valid():
            payload = form.cleaned_data
            try:
                response = requests.post(
                    f"{NESTJS_API_URL}/evaluations/{proyecto_id}",
                    json=payload,
                    headers=get_auth_headers(request) # <- Se añade la autenticación
                )
                if response.status_code in [200, 201]:
                    return redirect('listado_proyectos')
                else:
                    error_api = response.json().get('message', 'Error en el servidor.')
            except requests.exceptions.RequestException:
                error_api = "Error de conexión con NestJS."
    else:
        form = EvaluacionTRLForm()
    return render(request, 'evaluations/formulario.html', {
        'form': form,
        'proyecto_id': proyecto_id,
        'error_api': error_api
    })

@auth_required
def tabla_evidencias(request, proyecto_id):
    # Simulando la vista de evidencias
    return render(request, 'evidence/tabla.html', {'proyecto_id': proyecto_id})

@auth_required
def logs_auditoria(request):
    # Simulando la vista de logs
    return render(request, 'audit/logs.html')

@auth_required
def create_user_view(request):
    """
    Vista para que un administrador cree nuevos usuarios.
    El backend se encarga de verificar que el usuario tenga el rol 'ADMINISTRADOR'.
    """
    error_api = None
    success_data = None

    if request.method == 'POST':
        form = CreateUserForm(request.POST)
        if form.is_valid():
            try:
                response = requests.post(
                    f"{NESTJS_API_URL}/users",  # Endpoint de creación de usuarios en el backend
                    json=form.cleaned_data,
                    headers=get_auth_headers(request),
                    timeout=10
                )

                if response.status_code == 201:
                    # ¡Éxito! El backend devuelve los datos del usuario y el secreto MFA.
                    success_data = response.json()
                    # Limpiamos el formulario para la siguiente creación.
                    form = CreateUserForm()
                else:
                    # Mostramos el error que devuelve la API (ej: usuario ya existe).
                    error_api = response.json().get('message', 'Ocurrió un error al crear el usuario.')

            except requests.exceptions.RequestException:
                error_api = "Error de conexión con el servidor. Verifique que el backend esté funcionando."
    else:
        form = CreateUserForm()

    return render(request, 'admin/create_user.html', {
        'form': form,
        'error_api': error_api,
        'success_data': success_data
    })