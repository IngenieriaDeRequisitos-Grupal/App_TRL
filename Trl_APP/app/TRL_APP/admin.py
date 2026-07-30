from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    # Conectamos las rutas de nuestra aplicación TRL
    path('', include('TRL_APP.urls')),
]