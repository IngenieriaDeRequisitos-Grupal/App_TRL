from django.urls import path
from . import views

urlpatterns = [
    # ==========================================
    # Módulo Auth & Users
    # ==========================================
    # La ruta vacía '' hace que el Login sea la primera pantalla al entrar a localhost:8000/
    path('', views.login_view, name='login'),
    path('mfa/verify/', views.mfa_verify_view, name='mfa_verify'),
    path('logout/', views.logout_view, name='logout'),

    # ==========================================
    # Módulo Projects & Evaluations
    # ==========================================
    path('proyectos/', views.listado_proyectos, name='listado_proyectos'),
    path('proyectos/crear/', views.crear_proyecto, name='crear_proyecto'),
    # El <int:proyecto_id> captura el número en la URL (ej. /proyecto/1/evaluar/) y se lo pasa a la vista
    path('proyecto/<int:proyecto_id>/evaluar/', views.evaluar_trl, name='evaluar_trl'),

    # ==========================================
    # Módulo Evidence & Consent
    # ==========================================
    path('proyecto/<int:proyecto_id>/evidencias/', views.tabla_evidencias, name='tabla_evidencias'),

    # ==========================================
    # Módulo Audit & Management
    # ==========================================
    path('auditoria/', views.logs_auditoria, name='logs_auditoria'),
    path('admin/crear-usuario/', views.create_user_view, name='create_user'),
]