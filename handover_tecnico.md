# Handover técnico — Seguridad y PostgreSQL del backend TRL

Fecha de corte: 29 de julio de 2026  
Backend: NestJS 11.1 / TypeORM 0.3 / PostgreSQL 16  
Estado: compilación, pruebas unitarias e integración local PostgreSQL aprobadas; dependencias de producción sin vulnerabilidades conocidas por `npm audit`.

## 1. Alcance ejecutado

- Se eliminó completamente el backend anterior ajeno a TRL y todo el contenido de `_work/`.
- Se eliminó Firebase y cualquier dependencia de almacenamiento externo. PostgreSQL es la única persistencia.
- Se reconstruyó el modelo con las 18 clases del diagrama Word: `Usuario`, `Investigador`, `Evaluador`, `Gestor_IDi`, `Sesion`, `MFA`, `Rol`, `Proyecto_Invencion`, `Solicitud_Evaluacion`, `Cuestionario`, `Nivel_TRL`, `Documento_Adjunto`, `Observacion`, `Calificacion_Final`, `Configuracion_TRL`, `Dashboard`, `Reportes` y `Servicio_Nube`.
- `Servicio_Nube` conserva el nombre exigido por el diagrama, pero representa el adaptador interno de persistencia PostgreSQL. `url_bucket_protegido` se conserva por compatibilidad y contiene una URI lógica `postgresql://...`; no apunta a Firebase ni a un bucket.
- Se añadieron únicamente dos entidades técnicas transversales: `Consentimiento` y `EventoAuditoria`. No sustituyen ni cambian las entidades de negocio.

## 2. Controles de seguridad implementados

### Identidad y sesión

- Contraseñas con `bcrypt` y coste 12, más `PASSWORD_PEPPER` independiente del hash almacenado.
- Comparación contra hash ficticio cuando el correo no existe para reducir enumeración por tiempo.
- Bloqueo temporal tras 3 intentos fallidos de contraseña o MFA durante 15 minutos.
- MFA TOTP obligatorio, ventana máxima de ±1 período y secreto cifrado; el secreto solo se devuelve durante el aprovisionamiento.
- En desarrollo, `MFA_CONSOLE_OUTPUT=true` imprime el TOTP vigente de 6 dígitos después de validar la contraseña; cambia cada 30 segundos y la salida está bloqueada cuando `NODE_ENV=production`.
- JWT `HS256` con algoritmo permitido explícitamente, `issuer`, `audience`, propósito (`mfa` o `access`), expiración corta y validación contra sesión PostgreSQL.
- PostgreSQL solo almacena SHA-256 del JWT activo. Cerrar sesión, suspender usuario o cambiar rol revoca la sesión e incrementa su versión.
- Límites específicos de 5 solicitudes/minuto para login y MFA, además del límite global de 100 solicitudes/minuto.

### Autorización

- RBAC centralizado: `ADMINISTRADOR`, `INVESTIGADOR`, `EVALUADOR` y `GESTOR_IDI`.
- El investigador solo modifica sus proyectos, solicitudes y evidencias.
- El evaluador solo accede a solicitudes asignadas y no puede autoevaluar un proyecto propio.
- El gestor administra matriz TRL, asignaciones, dashboards y reportes.
- El administrador gestiona identidad, pero no descarga evidencias por defecto; se aplica mínimo privilegio sobre contenido técnico.
- Las transiciones sensibles se verifican en servidor: envío, asignación, observación, cierre y calificación.

### Validación, inyección y errores

- DTO con validación estricta, listas blancas, rechazo de propiedades no declaradas, UUID validados y paginación acotada.
- TypeORM usa parámetros enlazados; no se concatena input de usuario en consultas SQL.
- La configuración TRL es `JSONB`, pero se valida como una matriz de exactamente 9 niveles secuenciales antes de activarla.
- El nivel TRL usa compuerta estricta: no se concede un nivel superior si falta un criterio anterior.
- Filtro global de excepciones: las respuestas no contienen stack trace, SQL, rutas internas ni secretos; incluyen `correlationId`.
- Helmet, CORS con allowlist y contenedores sin privilegios Linux (`cap_drop: ALL`, `no-new-privileges`, filesystem de solo lectura).

### Cifrado y protección de datos

| Dato | Protección aplicada |
|---|---|
| Contraseña | bcrypt, coste 12, salt propio y pepper externo |
| Cédula | AES-256-GCM con IV aleatorio, tag de autenticidad y AAD; índice separado HMAC-SHA-256 |
| Secreto TOTP | AES-256-GCM con AAD ligado al identificador de sesión |
| Evidencia PDF | AES-256-GCM antes de guardarse en PostgreSQL `BYTEA`; SHA-256 adicional para verificación de integridad |
| JWT | Solo hash SHA-256 en base de datos; el token completo se entrega al cliente |
| IP de sesión/auditoría | HMAC-SHA-256 para evitar conservar la IP en claro |
| Reportes PDF | PostgreSQL `BYTEA` y SHA-256 de integridad |

El sobre de cifrado es `versión || IV de 12 bytes || tag GCM de 16 bytes || ciphertext`. El AAD impide mover un ciphertext válido entre contextos (por ejemplo, de una cédula a un documento).

### Evidencias PDF

- Carga en memoria limitada a un archivo y al tamaño `MAX_EVIDENCE_BYTES`.
- Comprobación de MIME, firma `%PDF-`, nombre normalizado y rechazo de acciones activas `/JavaScript`, `/JS`, `/Launch` y `/EmbeddedFile`.
- Cifrado antes de persistir y descifrado solo después de autorizar propietario, evaluador asignado o gestor.
- Descarga con `Cache-Control: no-store` y nombre seguro en `Content-Disposition`.

### Auditoría

- Se registra actor, acción HTTP, recurso, resultado, fecha, `correlationId` e IP seudonimizada.
- Nunca se registra el body, contraseña, TOTP, JWT, cédula o contenido de evidencias.
- Los eventos de consentimiento son append-only a nivel de servicio: tipo, finalidad, base jurídica, versión, hash del texto, decisión, fecha e IP seudonimizada.

## 3. Consentimiento y LOPDP de Ecuador

- Los términos de uso y el aviso de privacidad son eventos distintos. Aceptar términos no se reutiliza como consentimiento genérico para todo tratamiento.
- El aviso de privacidad se registra como acuse del deber de información; cada finalidad opcional debe tener consentimiento independiente.
- Los endpoints de negocio se bloquean hasta que existan eventos de aceptación para las versiones vigentes de términos y aviso de privacidad.
- Un cambio de `TERMS_VERSION` o `PRIVACY_NOTICE_VERSION` obliga a presentar y registrar la nueva versión.
- El retiro de una finalidad opcional crea un nuevo evento y conserva evidencia histórica de la decisión.
- La aplicación conserva finalidad y base jurídica por evento para evitar consentimiento agrupado o ambiguo.

Esto implementa controles técnicos de trazabilidad y privacidad desde el diseño, pero no constituye por sí solo certificación de cumplimiento. La LOPDP define el consentimiento como libre, específico, informado e inequívoco y exige medidas de seguridad adecuadas; la SPDP también indica que el consentimiento debe obtenerse mediante acción afirmativa cuando corresponda. Referencias oficiales: [Registro Oficial — LOPDP](https://www.registroficial.gob.ec/267223-2/) y [Política de protección de datos de la SPDP](https://spdp.gob.ec/politica-de-proteccion-datos/).

Antes de producción, Jurídico y el Delegado de Protección de Datos deben determinar por finalidad la base de legitimación correcta, aprobar el aviso con el contenido exigible, definir conservación, destinatarios, transferencias, canal de derechos y procedimiento de incidentes. No debe pedirse consentimiento cuando corresponda otra base legal; en ese caso se mantiene el deber de informar.

## 4. Ajustes exclusivos para PostgreSQL

- `DATABASE_URL` es obligatoria y el motor configurado es exclusivamente `postgres`.
- `synchronize=false`; el esquema se crea mediante la migración versionada `1722211200000-InitialTrlPostgres`.
- La migración crea enums, claves foráneas, unicidad, checks TRL 1–9, índices de búsqueda y el índice parcial que permite una sola configuración activa.
- Cédulas y secretos se marcan `select: false`; blobs cifrados y PDF de reportes tampoco se seleccionan por defecto.
- Las operaciones que modifican varias entidades usan transacciones: alta de usuario/MFA, creación de solicitud/cuestionario, respuestas/nivel y calificación/proyecto.
- Docker mantiene PostgreSQL en una red interna y no publica el puerto 5432.
- `trl_owner` administra la instancia; `trl_app` es una cuenta separada para la API y recibe solo conexión y creación/uso del esquema requerido por migraciones.
- La extensión `pgcrypto` aporta `gen_random_uuid()`; no se usa para cifrar datos de aplicación ni se almacenan claves en PostgreSQL.
- Backups deben cifrarse fuera de línea y probar restauración. Un backup contiene blobs ya cifrados, pero también metadatos que siguen siendo información protegida.

## 5. `WARNING` críticos pendientes

1. **Textos y proceso legal** — `src/modules/consent/legal-texts.ts`: los textos incluidos son marcadores mínimos. Deben reemplazarse por versiones aprobadas por Jurídico/DPD y acompañarse de un flujo operativo para acceso, rectificación, actualización, eliminación, oposición, portabilidad y suspensión. Publicar los marcadores implicaría riesgo de incumplimiento del deber de información.
2. **Antimalware de evidencias** — `src/modules/evidence/evidence.service.ts`: el filtro PDF bloquea contenido activo conocido, pero no sustituye un sandbox/antimalware. La mitigación completa exige cuarentena, escaneo aislado, estados de procesamiento y política de rechazo; se dejó fuera para no cambiar el flujo síncrono actual.
3. **Disponibilidad de auditoría** — `src/modules/audit/audit.interceptor.ts`: la escritura es no bloqueante para no derribar la API si falla PostgreSQL. Una caída puede producir huecos de auditoría. La solución recomendada es outbox transaccional más colector inmutable/WORM; hacerla fail-closed cambiaría disponibilidad y resultados actuales.
4. **Rotación de claves** — `src/common/security/crypto.service.ts`: el sobre identifica versión de formato, no `keyId`. Reemplazar directamente `FIELD_ENCRYPTION_KEY_BASE64` impediría descifrar datos históricos. Antes de rotar se requiere keyring/KMS, `keyId`, lectura con claves anteriores y migración gradual.
5. **Matriz institucional TRL** — la estructura y el algoritmo de compuerta están implementados, pero los criterios oficiales exactos no estaban definidos de forma ejecutable en los documentos. El gestor debe cargar una matriz aprobada; inventar criterios en código alteraría el resultado de negocio.
6. **Validación en infraestructura de staging** — la migración fue ejecutada correctamente sobre PostgreSQL 16 local. Aún debe repetirse en staging con backup/restauración. En servicios gestionados se debe confirmar que `trl_app` pueda crear la extensión confiable `pgcrypto` o preinstalarla con la cuenta propietaria.
7. **Código MFA en consola** — se habilitó únicamente para desarrollo por solicitud del equipo. Los logs pasan a contener un factor temporal durante su ventana de validez; deben protegerse y `MFA_CONSOLE_OUTPUT` debe permanecer en `false` fuera del equipo local.

## 6. Verificación realizada

- `tsc -p tsconfig.build.json --noEmit`: aprobado.
- `npm test -- --runInBand`: 2 suites, 4 pruebas, 4 aprobadas.
- `npm run build`: aprobado con NestJS 11.1.28.
- `npm audit --omit=dev --audit-level=high`: 0 vulnerabilidades.
- `docker compose config --quiet`: aprobado.
- Migración real PostgreSQL 16: 1 migración aplicada y 19 tablas verificadas.
- Endpoint `GET /api/health`: aprobado desde el host.
- Prueba end-to-end: contraseña, MFA TOTP, emisión/validación JWT, aceptación legal vigente, RBAC y consulta PostgreSQL aprobados.
- Búsqueda residual: no existen módulos médicos, clínicos o de telemetría; `_work/` no existe; Firebase no está integrado.

La verificación no sustituye un pentest dinámico ni una prueba del flujo completo de proyectos/evidencias en staging. Esos controles son obligatorios antes de liberar a producción.
