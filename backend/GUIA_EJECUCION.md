# Guía esencial de ejecución — Backend TRL

Todos los comandos de esta guía se ejecutan en **PowerShell**.

## 1. Entrar al backend

```powershell
cd "C:\Users\ASUS FLOW\Desktop\App_TRL\backend"
```

Verificar que Docker Desktop esté abierto:

```powershell
docker version
```

## 2. Configuración inicial

Comprobar si ya existe `.env`:

```powershell
Test-Path .env
```

Si devuelve `False`, crearlo desde el ejemplo:

```powershell
Copy-Item .env.example .env
notepad .env
```

Reemplazar en `.env` todos los valores `replace-with-...`. Las variables mínimas son:

```env
POSTGRES_ADMIN_PASSWORD=CONTRASENA_ADMIN_POSTGRES
POSTGRES_APP_PASSWORD=CONTRASENA_APP_POSTGRES
DATABASE_URL=postgresql://trl_app:CONTRASENA_APP_POSTGRES@postgres:5432/trl_db

JWT_SECRET=SECRETO_ALEATORIO_DE_AL_MENOS_32_CARACTERES
PASSWORD_PEPPER=SECRETO_ALEATORIO_DE_AL_MENOS_24_CARACTERES
FIELD_ENCRYPTION_KEY_BASE64=CLAVE_ALEATORIA_DE_32_BYTES_EN_BASE64
AUDIT_HMAC_KEY=SECRETO_ALEATORIO_DE_AL_MENOS_24_CARACTERES

MFA_CONSOLE_OUTPUT=true
```

`POSTGRES_APP_PASSWORD` debe coincidir exactamente con la contraseña incluida en `DATABASE_URL`.

Para generar una clave válida de 32 bytes en Base64:

```powershell
$bytes = New-Object byte[] 32
[System.Security.Cryptography.RandomNumberGenerator]::Fill($bytes)
[Convert]::ToBase64String($bytes)
```

Copiar el resultado en `FIELD_ENCRYPTION_KEY_BASE64`.

> `MFA_CONSOLE_OUTPUT=true` es solo para desarrollo. En producción debe ser `false`.

## 3. Crear PostgreSQL y ejecutar migraciones

```powershell
docker compose up --build -d
```

Comprobar los contenedores:

```powershell
docker compose ps
```

El resultado correcto debe mostrar:

```text
backend-postgres-1   healthy
backend-api-1        Up
```

Comprobar la API:

```powershell
Invoke-RestMethod http://127.0.0.1:3000/api/health
```

Resultado esperado:

```text
status
------
ok
```

Verificar la migración:

```powershell
docker compose exec postgres psql -U trl_owner -d trl_db -c "SELECT * FROM migrations;"
```

Listar las tablas:

```powershell
docker compose exec postgres psql -U trl_owner -d trl_db -c "\dt"
```

## 4. Crear el administrador inicial

Este comando se ejecuta **una sola vez**, cuando todavía no existen usuarios:

```powershell
docker compose exec `
  -e SEED_ADMIN_NAME="Administrador TRL" `
  -e SEED_ADMIN_CEDULA="1100000000" `
  -e SEED_ADMIN_EMAIL="admin@trl.local" `
  -e SEED_ADMIN_PASSWORD="CAMBIAR-POR-UNA-CONTRASENA-SEGURA" `
  api npm run seed
```

La consola mostrará una respuesta similar a:

```json
{
  "id_usuario": "...",
  "correo_electronico": "admin@trl.local",
  "mfa_secret": "SECRETO_MFA",
  "mfa_provisioning_uri": "otpauth://..."
}
```

Guardar `mfa_secret` o importar `mfa_provisioning_uri` en una aplicación autenticadora. El secreto no vuelve a mostrarse en consultas posteriores.

Si el administrador ya existe, no volver a ejecutar el seed.

## 5. Ver el código MFA en consola

Abrir una primera terminal en el backend:

```powershell
docker compose logs -f api
```

Dejar esa terminal abierta. Después de un login correcto aparecerá:

```text
[DEV MFA] codigo=123456 expira_en=24s
```

El código cambia cada 30 segundos. Copiar únicamente un código que todavía no haya expirado.

## 6. Probar login y MFA

Abrir una segunda terminal:

```powershell
cd "C:\Users\ASUS FLOW\Desktop\App_TRL\backend"
```

Enviar correo y contraseña:

```powershell
$loginBody = @{
  correo_electronico = "admin@trl.local"
  contrasena = "TU_CONTRASENA_ADMIN"
} | ConvertTo-Json

$login = Invoke-RestMethod `
  -Method Post `
  -Uri "http://127.0.0.1:3000/api/auth/login" `
  -ContentType "application/json" `
  -Body $loginBody
```

Mirar la primera terminal, copiar el código mostrado y verificarlo:

```powershell
$codigoMfa = Read-Host "Código MFA mostrado en la consola"

$mfaBody = @{
  mfa_ticket = $login.mfa_ticket
  codigo = $codigoMfa
} | ConvertTo-Json

$sesion = Invoke-RestMethod `
  -Method Post `
  -Uri "http://127.0.0.1:3000/api/auth/mfa/verify" `
  -ContentType "application/json" `
  -Body $mfaBody

$token = $sesion.access_token
$headers = @{ Authorization = "Bearer $token" }
```

Comprobar el token consultando los documentos legales:

```powershell
Invoke-RestMethod `
  -Method Get `
  -Uri "http://127.0.0.1:3000/api/legal/current" `
  -Headers $headers
```

## 7. Comandos diarios

Iniciar servicios existentes:

```powershell
docker compose up -d
```

Reconstruir después de cambiar código:

```powershell
docker compose up --build -d api
```

Ver estado:

```powershell
docker compose ps
```

Ver logs de la API:

```powershell
docker compose logs -f api
```

Ver logs de PostgreSQL:

```powershell
docker compose logs -f postgres
```

Detener sin borrar la base de datos:

```powershell
docker compose down
```

> No utilizar `docker compose down -v`: la opción `-v` elimina el volumen y toda la base de datos.

## 8. Verificación antes de subir cambios

```powershell
npm.cmd install
npm.cmd test -- --runInBand
npm.cmd run build
npm.cmd audit --omit=dev --audit-level=high
```

Resultados esperados:

```text
Test Suites: 2 passed
Tests:       4 passed
found 0 vulnerabilities
```

## 9. Diagnóstico rápido

Si la API no responde:

```powershell
docker compose ps -a
docker compose logs --tail=150 api
```

Si PostgreSQL no está saludable:

```powershell
docker compose logs --tail=150 postgres
```

Si aparece `password authentication failed for user "trl_app"`, no borres el volumen. Sincroniza la contraseña actual de `.env` con el rol PostgreSQL:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\sync-db-password.ps1
```

Resultado esperado:

```text
OK: contraseña de trl_app sincronizada y API conectada a PostgreSQL.
```

Si el puerto 3000 está ocupado:

```powershell
Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
```

Si se modificó `.env`, recrear la API:

```powershell
docker compose up -d --force-recreate api
```

Comprobación final:

```powershell
docker compose ps
Invoke-RestMethod http://127.0.0.1:3000/api/health
```
