# Arranque completo de App TRL

Esta guía usa PowerShell en Windows. Cada integrante debe ejecutar la aplicación con su propia copia de `backend/.env` y `Trl_APP/.env`; esos archivos contienen secretos y no se suben a GitHub.

## Requisitos

- Docker Desktop abierto.
- Python 3.12 instalado y disponible mediante `py` o `python`.
- Git.

Node.js no es obligatorio para ejecutar el backend porque Docker instala sus dependencias dentro de la imagen.

## Primera instalación del backend

Desde la raíz del repositorio:

```powershell
cd backend
Copy-Item .env.example .env
notepad .env
```

En `.env`, cambie todos los valores `replace-with-...`. Estas tres variables deben coincidir exactamente:

```env
POSTGRES_APP_PASSWORD=UNA_CLAVE_SEGURA_SIN_ESPACIOS
DATABASE_URL=postgresql://trl_app:UNA_CLAVE_SEGURA_SIN_ESPACIOS@postgres:5432/trl_db
MFA_CONSOLE_OUTPUT=true
```

Use letras, números, punto, guion, guion bajo o `~` en `POSTGRES_APP_PASSWORD` para que la URL no requiera codificación. Genere `FIELD_ENCRYPTION_KEY_BASE64` con:

```powershell
$bytes = New-Object byte[] 32
[System.Security.Cryptography.RandomNumberGenerator]::Fill($bytes)
[Convert]::ToBase64String($bytes)
```

Levante PostgreSQL y la API:

```powershell
docker compose up --build -d
docker compose ps
Invoke-RestMethod http://127.0.0.1:3000/api/health
```

El resultado correcto de la última orden es `status: ok`. Las migraciones se ejecutan automáticamente al arrancar la API.

Si aparece `password authentication failed for user "trl_app"` porque ya existía un volumen con otra contraseña, ejecute:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\sync-db-password.ps1
```

No use `docker compose down -v`, porque `-v` elimina toda la base de datos.

### Administrador inicial (solo la primera vez)

Cuando la base de datos todavía no tiene usuarios:

```powershell
docker compose exec `
  -e SEED_ADMIN_NAME="Administrador TRL" `
  -e SEED_ADMIN_CEDULA="1100000000" `
  -e SEED_ADMIN_EMAIL="admin@trl.local" `
  -e SEED_ADMIN_PASSWORD="CAMBIAR-POR-UNA-CONTRASENA-SEGURA" `
  api npm run seed
```

Guarde el `mfa_secret` que aparece una sola vez. Para desarrollo, el código temporal también se muestra al iniciar sesión en:

```powershell
docker compose logs -f api
```

Busque una línea como `[DEV MFA] codigo=123456 expira_en=24s`. El código cambia cada 30 segundos; use el más reciente. En producción, configure `MFA_CONSOLE_OUTPUT=false`.

## Primera instalación del frontend

Abra otra terminal en la raíz del repositorio:

```powershell
cd Trl_APP
py -3.12 -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
Copy-Item .env.example .env
notepad .env
```

Si su equipo no reconoce `py`, use `python -m venv .venv`. El `.env` local debe contener:

```env
DJANGO_DEBUG=true
DJANGO_ALLOWED_HOSTS=127.0.0.1,localhost
DJANGO_COOKIE_SECURE=false
NESTJS_API_URL=http://127.0.0.1:3000/api
```

Reemplace `DJANGO_SECRET_KEY` por una cadena aleatoria larga y diferente en cada equipo.

Compruebe e inicie Django:

```powershell
.\.venv\Scripts\python.exe app\manage.py check
.\.venv\Scripts\python.exe app\manage.py runserver 127.0.0.1:8000
```

Abra <http://127.0.0.1:8000/>. No abra el frontend directamente como archivo HTML: debe entrar por el servidor Django.

## Preparar los cuatro roles

Cada instalación de PostgreSQL es independiente. Las cuentas creadas en una computadora no aparecen automáticamente en la de otro integrante.

1. Inicie sesión con el administrador creado mediante `npm run seed`.
2. Abra `http://127.0.0.1:8000/admin/crear-usuario/`.
3. Cree al menos un `INVESTIGADOR`, un `EVALUADOR` y un `GESTOR_IDI`.
4. Guarde el secreto MFA mostrado una sola vez para cada cuenta.
5. Entre como gestor y abra `Configuración TRL`; active una matriz antes de que el investigador cree su primera solicitud.

Las funciones visibles por rol son:

- `ADMINISTRADOR`: usuarios, estados de acceso, asignación de evaluadores y auditoría.
- `INVESTIGADOR`: proyectos, cuestionario, evidencias, envío y corrección de observaciones.
- `EVALUADOR`: solicitudes asignadas, evidencias, observaciones y calificación final.
- `GESTOR_IDI`: asignaciones, dashboard, configuración TRL, reportes PDF y auditoría.

En desarrollo, si `MFA_CONSOLE_OUTPUT=true`, cualquier usuario puede copiar su código temporal desde `docker compose logs -f api` después de introducir correctamente correo y contraseña.

## Arranque diario

Terminal 1, backend:

```powershell
cd "RUTA\A\App_TRL\backend"
docker compose up -d
docker compose logs -f api
```

Terminal 2, frontend:

```powershell
cd "RUTA\A\App_TRL\Trl_APP"
.\.venv\Scripts\python.exe app\manage.py runserver 127.0.0.1:8000
```

Luego abra <http://127.0.0.1:8000/>.

## Cuando lleguen cambios de GitHub

```powershell
git pull
cd backend
docker compose up --build -d
cd ..\Trl_APP
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
```

Después arranque Django con el comando de la sección anterior.

## Verificación rápida

Backend:

```powershell
cd backend
docker compose ps
Invoke-RestMethod http://127.0.0.1:3000/api/health
```

Frontend:

```powershell
cd Trl_APP
.\.venv\Scripts\python.exe app\manage.py check
.\.venv\Scripts\python.exe app\manage.py test TRL_APP.tests
```

## Detener

Detenga Django con `Ctrl+C`. Luego:

```powershell
cd backend
docker compose down
```

Esto detiene los contenedores y conserva los datos de PostgreSQL.

## Acceso desde otro equipo de la misma red (opcional)

En el equipo que sirve la aplicación, agregue su IP local a `DJANGO_ALLOWED_HOSTS` y ejecute:

```powershell
.\.venv\Scripts\python.exe app\manage.py runserver 0.0.0.0:8000
```

Autorice el puerto 8000 solo en la red privada de Windows. Desde el otro equipo abra `http://IP_DEL_SERVIDOR:8000/`. NestJS y PostgreSQL permanecen sin exposición directa porque Django se comunica con ellos localmente.
