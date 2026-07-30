from django.urls import path, include

urlpatterns = [
    # Conectamos las rutas de nuestra aplicación TRL
    # Al dejar la cadena vacía '', la app cargará directamente en la raíz (ej: localhost:8000/)
    path('', include('TRL_APP.urls')),
]