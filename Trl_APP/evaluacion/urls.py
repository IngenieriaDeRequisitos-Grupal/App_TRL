from django.urls import path
from . import views

urlpatterns = [
    path('', views.plataforma_trl, name='plataforma_trl'),
]