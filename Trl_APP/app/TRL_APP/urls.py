from django.urls import path

from . import views

urlpatterns = [
    path('', views.login_view, name='login'),
    path('mfa/verify/', views.mfa_verify_view, name='mfa_verify'),
    path('consentimiento/', views.consentimiento_view, name='consentimiento'),
    path('logout/', views.logout_view, name='logout'),
    path('proyectos/', views.listado_proyectos, name='listado_proyectos'),
    path('proyectos/crear/', views.crear_proyecto, name='crear_proyecto'),
    path('proyecto/<uuid:proyecto_id>/evaluar/', views.evaluar_trl, name='evaluar_trl'),
    path('proyecto/<uuid:proyecto_id>/evidencias/', views.tabla_evidencias, name='tabla_evidencias'),
    path('evidencia/<uuid:documento_id>/descargar/', views.descargar_evidencia, name='descargar_evidencia'),
    path('auditoria/', views.logs_auditoria, name='logs_auditoria'),
    path('admin/crear-usuario/', views.create_user_view, name='create_user'),
    path('gestion/configuracion-trl/', views.configuracion_trl_view, name='configuracion_trl'),
]
