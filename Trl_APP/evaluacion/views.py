from django.shortcuts import render


def plataforma_trl(request):
    """
    Renderiza la plantilla base de la SPA.
    Toda la lógica de navegación es manejada por app.js.
    """
    return render(request, 'index.html')