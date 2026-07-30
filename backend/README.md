# Backend TRL

API NestJS/TypeORM para la evaluación de madurez tecnológica. La única persistencia es PostgreSQL 16; no existe integración con Firebase ni almacenamiento externo.

## Puesta en marcha

1. Copiar `.env.example` a `.env` y reemplazar todos los secretos.
2. Definir contraseñas distintas en `POSTGRES_ADMIN_PASSWORD` y `POSTGRES_APP_PASSWORD`.
3. Ejecutar `docker compose up --build`.
4. Ejecutar una sola vez `docker compose exec -e SEED_ADMIN_NAME=... -e SEED_ADMIN_CEDULA=... -e SEED_ADMIN_EMAIL=... -e SEED_ADMIN_PASSWORD=... api npm run seed`, guardar el secreto MFA mostrado y retirar esas variables después.

Las migraciones se aplican al iniciar. `synchronize` está deshabilitado.

En desarrollo puede habilitarse `MFA_CONSOLE_OUTPUT=true`. Después de un login válido, la consola de la API muestra un código TOTP de 6 dígitos que cambia cada 30 segundos. La aplicación impide esta salida cuando `NODE_ENV=production`.

Si se cambia `POSTGRES_APP_PASSWORD` después de crear el volumen, ejecutar `powershell -ExecutionPolicy Bypass -File .\scripts\sync-db-password.ps1`. El script actualiza el rol sin eliminar datos y recrea la API.

## Contrato de configuración TRL

El gestor I+D+i publica una matriz versionada con nueve reglas secuenciales:

```json
{
  "reglas": [
    { "level": 1, "required": ["trl_1_criterio_a"] },
    { "level": 2, "required": ["trl_2_criterio_a"] },
    { "level": 3, "required": ["trl_3_criterio_a"] },
    { "level": 4, "required": ["trl_4_criterio_a"] },
    { "level": 5, "required": ["trl_5_criterio_a"] },
    { "level": 6, "required": ["trl_6_criterio_a"] },
    { "level": 7, "required": ["trl_7_criterio_a"] },
    { "level": 8, "required": ["trl_8_criterio_a"] },
    { "level": 9, "required": ["trl_9_criterio_a"] }
  ]
}
```

Cada nivel es una compuerta: no se concede un nivel superior si falta un criterio de un nivel anterior. Los identificadores institucionales definitivos deben ser aprobados por el propietario funcional.

## Verificación local

```bash
npm ci
npm run build
npm test
```
