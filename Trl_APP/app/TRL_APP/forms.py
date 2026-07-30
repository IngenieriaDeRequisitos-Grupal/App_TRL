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


class ProyectoForm(forms.Form):
    titulo_tecnologia = forms.CharField(label='Título de la tecnología', min_length=3, max_length=220, widget=forms.TextInput(attrs={'class': 'form-control'}))
    rama_innovacion = forms.CharField(label='Rama de innovación', min_length=2, max_length=160, widget=forms.TextInput(attrs={'class': 'form-control'}))


class EvaluacionTRLForm(forms.Form):
    for nivel in range(1, 10):
        locals()[f'trl_{nivel}_criterio_a'] = forms.BooleanField(
            required=False,
            label=f'Cumple el criterio institucional del TRL {nivel}',
        )

    def respuestas(self):
        return {key: bool(value) for key, value in self.cleaned_data.items() if key.startswith('trl_')}


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


DEFAULT_TRL_RULES = {
    'reglas': [
        {'level': level, 'required': [f'trl_{level}_criterio_a']}
        for level in range(1, 10)
    ]
}


class ConfiguracionTrlForm(forms.Form):
    version = forms.CharField(label='Versión', initial='1.0', max_length=40, widget=forms.TextInput(attrs={'class': 'form-control'}))
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
