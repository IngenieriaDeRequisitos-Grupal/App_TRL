from django import forms

class LoginForm(forms.Form):
    correo_electronico = forms.EmailField(
        label="Correo Electrónico",
        required=True,
        widget=forms.EmailInput(attrs={'class': 'form-control', 'placeholder': 'usuario@utpl.edu.ec'})
    )
    contrasena = forms.CharField(
        label="Contraseña",
        required=True,
        widget=forms.PasswordInput(attrs={'class': 'form-control'})
    )

class MfaForm(forms.Form):
    mfa_ticket = forms.CharField(widget=forms.HiddenInput())
    codigo = forms.CharField(
        label="Código de Autenticación",
        required=True,
        widget=forms.TextInput(attrs={
            'class': 'form-control',
            'placeholder': 'Ingrese el código de 6 dígitos',
            'autocomplete': 'one-time-code'
        })
    )

class EvaluacionTRLForm(forms.Form):
    NIVELES = [
        ('', 'Seleccione un nivel...'),
        ('1', 'TRL 1: Principios básicos observados y reportados'),
        ('2', 'TRL 2: Concepto tecnológico y/o aplicación formulada'),
        ('3', 'TRL 3: Prueba de concepto analítica y experimental crítica'),
        ('4', 'TRL 4: Validación de componente en entorno de laboratorio'),
        # ... hasta TRL 9
    ]

    nivel_alcanzado = forms.ChoiceField(
        choices=NIVELES,
        required=True,
        label="Nivel de Madurez (1-9)",
        widget=forms.Select(attrs={
            'id': 'nivel_alcanzado',
            'class': 'form-control'  # ← Clase CSS de tu archivo
        })
    )

    justificacion = forms.CharField(
        required=True,
        label="Justificación Técnica",
        widget=forms.Textarea(attrs={
            'id': 'justificacion',
            'rows': 4,
            'class': 'form-control', # ← Clase CSS de tu archivo
            'placeholder': 'Describa la evidencia técnica que respalda este nivel...'
        })
    )

class ProyectoForm(forms.Form):
    titulo_tecnologia = forms.CharField(
        label="Título de la Tecnología o Invención",
        required=True,
        max_length=220,
        widget=forms.TextInput(attrs={'class': 'form-control'})
    )
    rama_innovacion = forms.CharField(
        label="Rama de Innovación",
        required=True,
        max_length=160,
        widget=forms.TextInput(attrs={'class': 'form-control'})
    )

class CreateUserForm(forms.Form):
    ROLES = [
        ('', 'Seleccione un rol...'),
        ('INVESTIGADOR', 'Investigador'),
        ('EVALUADOR', 'Evaluador'),
        ('GESTOR_IDI', 'Gestor de I+D+i'),
        ('ADMINISTRADOR', 'Administrador'),
    ]

    nombre_completo = forms.CharField(label="Nombre Completo", required=True, widget=forms.TextInput(attrs={'class': 'form-control'}))
    correo_electronico = forms.EmailField(label="Correo Electrónico Institucional", required=True, widget=forms.EmailInput(attrs={'class': 'form-control'}))
    cedula = forms.CharField(label="Cédula", required=True, widget=forms.TextInput(attrs={'class': 'form-control'}))
    contrasena = forms.CharField(label="Contraseña Inicial", required=True, widget=forms.PasswordInput(attrs={'class': 'form-control'}))
    rol = forms.ChoiceField(label="Rol del Usuario", choices=ROLES, required=True, widget=forms.Select(attrs={'class': 'form-control'}))
    
    # Campos opcionales que el backend usará según el rol
    especialidad_tecnica = forms.CharField(
        label="Especialidad Técnica (solo para Evaluador)", required=False, 
        widget=forms.TextInput(attrs={'class': 'form-control'})
    )
    departamento = forms.CharField(
        label="Departamento (para Evaluador o Gestor)", required=False, 
        widget=forms.TextInput(attrs={'class': 'form-control'})
    )