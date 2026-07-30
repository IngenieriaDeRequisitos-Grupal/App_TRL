import json

from django import forms


class LoginForm(forms.Form):
    correo_electronico = forms.EmailField(
        label='Correo electrónico',
        widget=forms.EmailInput(attrs={'class': 'form-control', 'autocomplete': 'username'}),
    )
    contrasena = forms.CharField(
        label='Contraseña',
        min_length=12,
        widget=forms.PasswordInput(attrs={'class': 'form-control', 'autocomplete': 'current-password'}),
    )


class MfaForm(forms.Form):
    codigo = forms.CharField(
        label='Código MFA',
        min_length=6,
        max_length=6,
        widget=forms.TextInput(attrs={
            'class': 'form-control',
            'inputmode': 'numeric',
            'pattern': '[0-9]{6}',
            'autocomplete': 'one-time-code',
        }),
    )


class RegisterForm(forms.Form):
    nombre_completo = forms.CharField(label='Nombre completo', min_length=3, max_length=160)
    cedula = forms.RegexField(r'^\d{8,20}$', label='Cédula')
    correo_electronico = forms.EmailField(label='Correo electrónico')
    contrasena = forms.CharField(
        label='Contraseña',
        min_length=12,
        max_length=128,
        widget=forms.PasswordInput(attrs={'autocomplete': 'new-password'}),
    )
    confirmar_contrasena = forms.CharField(
        label='Confirmar contraseña',
        widget=forms.PasswordInput(attrs={'autocomplete': 'new-password'}),
    )

    def clean(self):
        cleaned = super().clean()
        password = cleaned.get('contrasena', '')
        if password and not (
            any(char.islower() for char in password)
            and any(char.isupper() for char in password)
            and any(char.isdigit() for char in password)
            and any(not char.isalnum() for char in password)
        ):
            self.add_error('contrasena', 'Incluya mayúscula, minúscula, número y símbolo.')
        if password != cleaned.get('confirmar_contrasena'):
            self.add_error('confirmar_contrasena', 'Las contraseñas no coinciden.')
        return cleaned


class ProyectoForm(forms.Form):
    titulo_tecnologia = forms.CharField(label='Título de la tecnología', min_length=3, max_length=220, widget=forms.TextInput(attrs={'class': 'form-control'}))
    rama_innovacion = forms.CharField(label='Rama de innovación', min_length=2, max_length=160, widget=forms.TextInput(attrs={'class': 'form-control'}))


TRL_DESCRIPTIONS = {
    1: 'Investigación básica y fundamentos científicos documentados.',
    2: 'Concepto tecnológico formulado y aplicación potencial identificada.',
    3: 'Prueba de concepto experimental documentada.',
    4: 'Prototipo validado en un entorno de laboratorio.',
    5: 'Prototipo validado en un entorno relevante o simulado.',
    6: 'Prototipo demostrado en un entorno operacional.',
    7: 'Sistema demostrado en un entorno real cercano a producción.',
    8: 'Sistema completo, calificado y aceptado.',
    9: 'Sistema probado con éxito en producción y listo para escalar.',
}


TRL_CRITERIA = {
    1: [
        ('gen_01_a', 'Principios científicos observados y documentados', 'Adjunte un informe o publicación que sustente los principios básicos.'),
        ('gen_01_b', 'Hipótesis de aplicación tecnológica definida', 'Describa formalmente la idea y su posible aplicación.'),
        ('gen_01_c', 'Revisión bibliográfica realizada', 'Documente el estado del arte y las referencias consultadas.'),
    ],
    2: [
        ('gen_02_a', 'Concepto tecnológico formulado', 'Explique el concepto y su diferencia frente al estado del arte.'),
        ('gen_02_b', 'Aplicación potencial identificada', 'Identifique al menos un caso de uso concreto.'),
        ('gen_02_c', 'Equipo técnico conformado', 'Detalle integrantes, capacidades y responsabilidades.'),
    ],
    3: [
        ('gen_03_a', 'Prueba de concepto experimental realizada', 'Demuestre en laboratorio que el principio técnico funciona.'),
        ('gen_03_b', 'Resultados preliminares documentados', 'Incluya datos, resultados parciales y condiciones de la prueba.'),
        ('gen_03_c', 'Riesgos técnicos identificados', 'Incluya una matriz de riesgos y limitaciones conocidas.'),
    ],
    4: [
        ('gen_04_a', 'Prototipo funcional en laboratorio', 'Demuestre la función principal mediante un informe verificable.'),
        ('gen_04_b', 'Arquitectura o diseño técnico documentado', 'Incluya componentes, módulos y flujo de la solución.'),
        ('gen_04_c', 'Plan de pruebas definido', 'Documente casos de prueba y criterios de éxito medibles.'),
        ('gen_04_d', 'Iteraciones de desarrollo registradas', 'Incluya bitácora, versiones o historial de cambios.'),
    ],
    5: [
        ('gen_05_a', 'Validación en entorno relevante o simulado', 'Presente pruebas bajo condiciones representativas del uso real.'),
        ('gen_05_b', 'Métricas de desempeño medidas', 'Incluya indicadores, objetivos y resultados obtenidos.'),
        ('gen_05_c', 'Manual técnico o de usuario disponible', 'La documentación debe permitir reproducir o utilizar la solución.'),
        ('gen_05_d', 'Retroalimentación de usuarios piloto', 'Documente sesiones, participantes y hallazgos principales.'),
    ],
    6: [
        ('gen_06_a', 'Demostración en entorno real', 'Evidencie funcionamiento bajo condiciones reales de operación.'),
        ('gen_06_b', 'Desempeño en campo documentado', 'Incluya datos medidos durante la demostración.'),
        ('gen_06_c', 'Escalabilidad documentada', 'Analice recursos, arquitectura y restricciones para escalar.'),
        ('gen_06_d', 'Viabilidad económica inicial evaluada', 'Incluya costos estimados de producción o despliegue.'),
    ],
    7: [
        ('gen_07_a', 'Prototipo en entorno operacional real', 'Documente la operación bajo condiciones de uso final.'),
        ('gen_07_b', 'Pruebas de estrés y límite realizadas', 'Incluya resultados bajo alta carga o condiciones extremas.'),
        ('gen_07_c', 'Plan de mantenimiento definido', 'Describa correcciones, actualizaciones y responsables.'),
        ('gen_07_d', 'Validación de un usuario final', 'Incluya carta, acta o convenio de una organización usuaria.'),
    ],
    8: [
        ('gen_08_a', 'Sistema completo y calificado', 'Evidencie la integración y verificación de todos los componentes.'),
        ('gen_08_b', 'Pruebas de aceptación superadas', 'Incluya criterios y acta de aceptación del usuario final.'),
        ('gen_08_c', 'Documentación de producción completa', 'Incluya manuales, esquemas y guías de despliegue.'),
        ('gen_08_d', 'Cumplimiento normativo verificado', 'Documente regulaciones, normas y controles aplicables.'),
    ],
    9: [
        ('gen_09_a', 'Sistema desplegado en producción', 'Evidencie operación real con usuarios finales activos.'),
        ('gen_09_b', 'Métricas de operación en producción', 'Incluya usuarios, disponibilidad, rendimiento e incidencias.'),
        ('gen_09_c', 'Soporte y mantenimiento activos', 'Incluya bitácora de soporte y actualizaciones realizadas.'),
        ('gen_09_d', 'Impacto o transferencia tecnológica evaluados', 'Documente impacto, licenciamiento o transferencia iniciada.'),
    ],
}


class EvaluacionTRLForm(forms.Form):
    RESPUESTAS = [('cumple', 'Cumple'), ('no_cumple', 'No cumple')]
    nivel_objetivo = forms.TypedChoiceField(
        label='Nivel TRL que desea evaluar',
        choices=[(level, f'TRL {level}') for level in range(1, 10)],
        coerce=int,
        widget=forms.Select(attrs={'class': 'form-control', 'data-trl-selector': 'true'}),
    )
    evidencia_pdf = forms.FileField(
        label='Evidencia documental consolidada',
        required=False,
        widget=forms.ClearableFileInput(attrs={'accept': 'application/pdf', 'class': 'file-input'}),
    )

    for level, criteria in TRL_CRITERIA.items():
        for key, label, _hint in criteria:
            locals()[key] = forms.ChoiceField(
                label=label,
                choices=RESPUESTAS,
                required=False,
                widget=forms.RadioSelect,
            )

    def __init__(self, *args, require_evidence=True, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['evidencia_pdf'].required = require_evidence
        self.require_evidence = require_evidence

    def clean(self):
        cleaned = super().clean()
        target = cleaned.get('nivel_objetivo')
        if target:
            for level in range(1, target + 1):
                for key, _label, _hint in TRL_CRITERIA[level]:
                    if not cleaned.get(key):
                        self.add_error(key, 'Responda este criterio para evaluar el nivel seleccionado.')
        document = cleaned.get('evidencia_pdf')
        if document:
            if document.size > 10 * 1024 * 1024 or document.content_type != 'application/pdf':
                self.add_error('evidencia_pdf', 'Seleccione un PDF de hasta 10 MB.')
            else:
                signature = document.read(5)
                document.seek(0)
                if signature != b'%PDF-':
                    self.add_error('evidencia_pdf', 'El archivo no contiene una firma PDF válida.')
        return cleaned

    def respuestas(self):
        target = self.cleaned_data['nivel_objetivo']
        answers = {'_nivel_objetivo': target}
        for level in range(1, target + 1):
            for key, _label, _hint in TRL_CRITERIA[level]:
                answers[key] = self.cleaned_data[key] == 'cumple'
        return answers

    def question_groups(self):
        return [
            {
                'level': level,
                'description': TRL_DESCRIPTIONS[level],
                'questions': [
                    {'key': key, 'hint': hint, 'field': self[key]}
                    for key, _label, hint in TRL_CRITERIA[level]
                ],
            }
            for level in range(1, 10)
        ]


def evaluation_initial(responses):
    responses = responses or {}
    target = responses.get('_nivel_objetivo')
    if not isinstance(target, int) or not 1 <= target <= 9:
        populated_levels = [
            level for level, criteria in TRL_CRITERIA.items()
            if any(key in responses for key, _label, _hint in criteria)
        ]
        target = max(populated_levels, default=1)
    initial = {'nivel_objetivo': target}
    for criteria in TRL_CRITERIA.values():
        for key, _label, _hint in criteria:
            if key in responses:
                initial[key] = 'cumple' if responses[key] is True else 'no_cumple'
    return initial


class CreateUserForm(forms.Form):
    ROLES = [
        ('INVESTIGADOR', 'Investigador'),
        ('EVALUADOR', 'Evaluador'),
        ('GESTOR_IDI', 'Gestor de I+D+i'),
        ('ADMINISTRADOR', 'Administrador'),
    ]
    nombre_completo = forms.CharField(label='Nombre completo', min_length=3, max_length=160, widget=forms.TextInput(attrs={'class': 'form-control'}))
    correo_electronico = forms.EmailField(label='Correo electrónico', widget=forms.EmailInput(attrs={'class': 'form-control'}))
    cedula = forms.RegexField(r'^\d{8,20}$', label='Cédula', widget=forms.TextInput(attrs={'class': 'form-control'}))
    contrasena = forms.CharField(label='Contraseña inicial', min_length=12, max_length=128, widget=forms.PasswordInput(attrs={'class': 'form-control'}))
    rol = forms.ChoiceField(label='Rol', choices=ROLES, widget=forms.Select(attrs={'class': 'form-control'}))
    especialidad_tecnica = forms.CharField(label='Especialidad técnica', required=False, max_length=120, widget=forms.TextInput(attrs={'class': 'form-control'}))
    departamento = forms.CharField(label='Departamento', required=False, max_length=120, widget=forms.TextInput(attrs={'class': 'form-control'}))

    def clean(self):
        cleaned = super().clean()
        role = cleaned.get('rol')
        if role == 'EVALUADOR' and not cleaned.get('especialidad_tecnica'):
            self.add_error('especialidad_tecnica', 'La especialidad es obligatoria para un evaluador.')
        if role in ('EVALUADOR', 'GESTOR_IDI') and not cleaned.get('departamento'):
            self.add_error('departamento', 'El departamento es obligatorio para este rol.')
        return cleaned


DEFAULT_TRL_RULES = {
    'reglas': [
        {'level': level, 'required': [key for key, _label, _hint in TRL_CRITERIA[level]]}
        for level in TRL_CRITERIA
    ]
}


class ConfiguracionTrlForm(forms.Form):
    version = forms.CharField(label='Versión', initial='2.0-prototipo', max_length=40, widget=forms.TextInput(attrs={'class': 'form-control'}))
    parametros_json = forms.CharField(
        label='Matriz TRL en JSON',
        initial=json.dumps(DEFAULT_TRL_RULES, ensure_ascii=False, indent=2),
        widget=forms.Textarea(attrs={'class': 'form-control', 'rows': 20}),
    )

    def clean_parametros_json(self):
        try:
            value = json.loads(self.cleaned_data['parametros_json'])
        except json.JSONDecodeError as exc:
            raise forms.ValidationError('El contenido no es JSON válido.') from exc
        if not isinstance(value, dict):
            raise forms.ValidationError('La configuración debe ser un objeto JSON.')
        return value


class AsignarEvaluadorForm(forms.Form):
    id_evaluador = forms.ChoiceField(label='Evaluador', choices=(), widget=forms.Select(attrs={'class': 'form-control'}))

    def __init__(self, *args, evaluadores=None, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['id_evaluador'].choices = [
            (item['id_usuario'], f"{item['nombre_completo']} ({item['correo_electronico']})")
            for item in (evaluadores or [])
            if item.get('rol') == 'EVALUADOR' and item.get('estado') == 'ACTIVO'
        ]


class ObservacionForm(forms.Form):
    descripcion_problema = forms.CharField(
        label='Observación técnica',
        min_length=3,
        max_length=4000,
        widget=forms.Textarea(attrs={'class': 'form-control', 'rows': 4}),
    )


class CalificacionForm(forms.Form):
    nivel_aprobado = forms.IntegerField(
        label='Nivel TRL aprobado',
        min_value=1,
        max_value=9,
        widget=forms.NumberInput(attrs={'class': 'form-control'}),
    )
    dictamen_auditoria = forms.CharField(
        label='Dictamen de auditoría',
        min_length=3,
        max_length=4000,
        widget=forms.Textarea(attrs={'class': 'form-control', 'rows': 4}),
    )


class AccesoUsuarioForm(forms.Form):
    ESTADOS = [('ACTIVO', 'Activo'), ('SUSPENDIDO', 'Suspendido'), ('BLOQUEADO', 'Bloqueado')]
    estado = forms.ChoiceField(label='Estado', choices=ESTADOS, widget=forms.Select(attrs={'class': 'form-control'}))


class ReporteForm(forms.Form):
    project_ids = forms.MultipleChoiceField(
        label='Proyectos incluidos',
        choices=(),
        widget=forms.CheckboxSelectMultiple,
    )

    def __init__(self, *args, proyectos=None, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['project_ids'].choices = [
            (item['id_proyecto'], item['titulo_tecnologia']) for item in (proyectos or [])
        ]
