# README - Frontend (Plataforma TRL)

## 1. Descripción General

El frontend de este proyecto es una **Aplicación de Página Única (SPA)**, construida íntegramente con **JavaScript puro (vanilla JS)**, sin el uso de frameworks externos como React o Vue.

Toda la lógica de la aplicación reside en el archivo `evaluacion/static/js/app.js`. Este archivo es responsable de:

1.  **Gestionar el estado:** Controlar qué pantalla se muestra, quién es el usuario, qué datos se han introducido, etc.
2.  **Renderizar la interfaz:** Generar dinámicamente el código HTML de cada pantalla y mostrarlo al usuario.
3.  **Manejar la navegación:** Permitir que el usuario se mueva entre diferentes pantallas sin recargar la página.

## 2. Arquitectura y Conceptos Clave

El código en `app.js` sigue varios patrones de diseño para mantenerse organizado y escalable.

### Gestión de Estado Centralizada

Todo el estado y los datos de la aplicación se almacenan en un único objeto global llamado `app`. Esto evita tener variables sueltas y facilita la depuración.

```javascript
const app = {
  // state: Datos que cambian durante el uso de la app (pantalla actual, sesión, etc.)
  state: {
    navStack: [],
    currentScreen: 'login',
    session: { authenticated: false, role: null, name: null },
    // ... otros estados dinámicos
  },
  // data: Datos que son estáticos o simulan una base de datos (proyectos, criterios, etc.)
  data: {
    PROJECTS: [ /* ... */ ],
    CRITERIA_SPEC: { /* ... */ },
    // ... otros datos estáticos
  }
};
```

**Explicación:**
-   `INSTALLED_APPS`: Es una lista que le dice a Django qué aplicaciones están activas. Hemos añadido `'evaluacion'` para que Django reconozca nuestra app y pueda encontrar sus plantillas, vistas y archivos estáticos.
-   `STATIC_URL`: Define el prefijo de la URL para los archivos estáticos. Esto es fundamental para que la plantilla `index.html` pueda cargar correctamente los archivos CSS y JS.

### `Trl_APP/urls.py` y `evaluacion/urls.py`

Estos archivos definen las rutas (URLs) de la aplicación y las asocian con una función de vista (el código que se ejecuta cuando se visita una ruta).

**Archivo de URLs del Proyecto (`Trl_APP/urls.py`)**
*(Este archivo dirige el tráfico de la URL raíz a la aplicación `evaluacion`)*

```python
from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    # Cualquier URL que no sea /admin/ será manejada por
    # el archivo urls.py de nuestra app 'evaluacion'.
    path('', include('evaluacion.urls')),
]
```

**Archivo de URLs de la App (`evaluacion/urls.py`)**
*(Este archivo mapea la ruta raíz a nuestra única vista)*

```python
from django.urls import path
from . import views

urlpatterns = [
    # Cuando un usuario visita la raíz del sitio (ej. http://127.0.0.1:8000/),
    # se ejecutará la función 'plataforma_trl' del archivo views.py.
    path('', views.plataforma_trl, name='plataforma_trl'),
]
```

**Explicación:**
-   El sistema de URLs de Django es modular. El archivo principal del proyecto (`Trl_APP/urls.py`) incluye las URLs de la aplicación `evaluacion`.
-   En `evaluacion/urls.py`, definimos que la ruta vacía (`''`) se corresponde con la vista `plataforma_trl`. Esto convierte a nuestra vista en la página de inicio por defecto.

### `evaluacion/views.py`

Este archivo contiene la lógica que se ejecuta cuando se visita una URL. En nuestro caso, es muy simple.

```python
from django.shortcuts import render

def plataforma_trl(request):
    """
    Renderiza la plantilla base de la SPA.
    Toda la lógica de navegación es manejada por app.js.
    """
    # La función 'render' toma el objeto de la solicitud (request)
    # y el nombre de una plantilla HTML.
    # Devuelve una respuesta HTTP con el contenido de esa plantilla renderizada.
    return render(request, 'index.html')
```

**Explicación:**
-   `plataforma_trl(request)`: Esta es nuestra única función de vista. Recibe un objeto `request` que contiene información sobre la petición del usuario.
-   `render(request, 'index.html')`: Esta es la función clave. Django busca un archivo llamado `index.html` dentro de los directorios de plantillas (en este caso, `evaluacion/templates/`), lo procesa y lo envía como respuesta al navegador.

### `evaluacion/templates/index.html`

Esta es la única plantilla HTML que el backend sirve. Es el "contenedor" de nuestra aplicación JavaScript.

```html
{% load static %}
<!DOCTYPE html>
<html lang="es">
<head>
    <!-- ... -->
    <!-- Enlace a tu archivo CSS modular -->
    <link rel="stylesheet" href="{% static 'css/styles.css' %}">
</head>
<body>
    <!-- ... (cuerpo de la página) ... -->

    <!-- Enlace a tu archivo JS modular -->
    <script src="{% static 'js/app.js' %}"></script>
</body>
</html>
```

**Explicación de las etiquetas de Django:**
-   `{% load static %}`: Esta etiqueta, colocada al principio del archivo, carga el motor de plantillas de Django con las funcionalidades para manejar archivos estáticos. Es obligatoria para poder usar la etiqueta `{% static %}`.
-   `{% static 'css/styles.css' %}`: Esta es la etiqueta más importante para los archivos estáticos. En lugar de escribir la ruta manualmente (ej. `/static/css/styles.css`), usamos esta etiqueta. Django automáticamente reemplazará `{% static 'css/styles.css' %}` por la ruta correcta (`/static/css/styles.css`), respetando la configuración de `STATIC_URL` en `settings.py`. Esto hace que el código sea más robusto y fácil de mantener si en el futuro se cambia la configuración de los archivos estáticos.