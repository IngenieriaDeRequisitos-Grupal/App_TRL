# Backend - Sistema de Atencion Medica Remota

Monorepo NestJS con arquitectura de microservicios (API Gateway + 6 microservicios),
comunicacion por TCP y RabbitMQ, PostgreSQL (una base de datos por servicio) y
cifrado AES-256 a nivel de ORM para los datos clinicos sensibles.

## Arquitectura

```
                                  ┌──────────────────┐
                     HTTP/REST    │                  │
   Cliente (web/app) ───────────▶│   API Gateway     │  (JWT, valida y enruta)
                                  │   (puerto 3000)   │
                                  └────────┬──────────┘
                                           │ TCP (@nestjs/microservices)
        ┌───────────────┬──────────────────┼──────────────────┬───────────────┬───────────────┐
        ▼               ▼                  ▼                  ▼               ▼               ▼
 users-service   requests-service   telemetry-service   clinical-service  integration-service  finance-service
   :3001              :3002              :3003               :3004            :3005              :3006
     │                  │              │      │                  │             ▲   │                │
     ▼                  ▼              ▼      │ RabbitMQ         ▼             │   ▼                ▼
  users_db        requests_db   telemetry_db  └────────────▶ clinical_db  RabbitMQ  integration_db  finance_db
                                  (emite eventos                          (consume eventos
                                   lectura.creada /                        alerta.generada)
                                   alerta.generada)
```

- **Comunicacion sincrona (Gateway -> microservicio):** TCP, mediante `@nestjs/microservices` (`ClientProxy.send` + `@MessagePattern`).
- **Comunicacion asincrona (evento -> evento):** RabbitMQ. `telemetry-service` emite `lectura.creada` y `alerta.generada`
  cada vez que una lectura de un dispositivo IoT supera un umbral clinico; `integration-service` consume esos eventos
  (`@EventPattern`) y registra la notificacion en `Logs_Interoperabilidad`, simulando el aviso a una entidad externa.
- **Base de datos por servicio:** una sola instancia de PostgreSQL con 6 bases de datos independientes
  (`users_db`, `requests_db`, `telemetry_db`, `clinical_db`, `integration_db`, `finance_db`), creadas automaticamente
  por `docker/postgres/init-multiple-dbs.sh`. Las referencias entre servicios (p. ej. `id_paciente` en `requests-service`)
  se guardan como columnas simples, **sin FK fisica entre bases de datos** (regla de independencia de microservicios).

## Estructura del monorepo

```
backend/
├── apps/
│   ├── gateway/              API REST publica (HTTP), JWT, enruta a los microservicios via TCP
│   ├── users-service/        Roles, Usuarios, Medicos, Pacientes, Centros_Medicos, Auditoria, Consentimientos
│   ├── requests-service/     Solicitudes_Atencion, Asignaciones_Recursos
│   ├── telemetry-service/    Dispositivos_IoT, Lecturas_Signos_Vitales, Alertas_Medicas (+ RabbitMQ)
│   ├── clinical-service/     Teleconsultas, Historiales_Clinicos, Registros_Evolucion, Recetas_Medicas,
│   │                         Detalle_Recetas, Ordenes_Examenes  (campos cifrados con AES-256)
│   ├── integration-service/  Entidades_Externas, Logs_Interoperabilidad (+ consumidor RabbitMQ)
│   └── finance-service/      Facturas, Pagos
├── libs/
│   └── common/                Codigo compartido: transformer AES-256-GCM, BaseCrudService generico, constantes
├── docker/postgres/init-multiple-dbs.sh
├── docker-compose.yml
├── Dockerfile                 (multi-stage, parametrizado con ARG APP_NAME, reutilizado por los 7 servicios)
├── .env.example
└── nest-cli.json               (monorepo de Nest con 7 "projects" + 1 libreria)
```

Cada recurso (`<entidad>.entity.ts` + `<entidad>s.resource.ts`) sigue el mismo patron:
entidad TypeORM + DTOs de validacion (`class-validator`) en el primer archivo, y
`Service` + `Controller` (con `@MessagePattern`) + `Module` en el segundo, extendiendo
`BaseCrudService` (`libs/common/src/base/base-crud.service.ts`) para las operaciones CRUD estandar.

## Cifrado AES-256 de datos clinicos sensibles

`libs/common/src/crypto/aes-encryption.transformer.ts` implementa `Aes256EncryptionTransformer`,
un `ValueTransformer` de TypeORM que cifra con **AES-256-GCM** al escribir (`to`) y descifra al leer (`from`),
de forma completamente transparente para el resto del codigo (nunca se ve el texto plano fuera de la entidad).

```ts
@Column({ type: 'text', nullable: true, transformer: aes256Transformer })
alergias?: string;
```

La clave maestra se deriva de `ENCRYPTION_KEY` (variable de entorno) con `scrypt`, y cada valor cifrado
almacena `IV (12 bytes) || AUTH_TAG (16 bytes) || CIPHERTEXT` en base64, con un IV aleatorio distinto en cada escritura.

Campos cifrados aplicados (en `clinical-service`):

| Entidad | Campos cifrados |
|---|---|
| `HistorialClinico` | `antecedentes_familiares`, `alergias`, `condiciones_cronicas` |
| `RegistroEvolucion` | `diagnostico_cifrado`, `observaciones_cifradas` |
| `DetalleReceta` | `nombre_medicamento`, `dosis`, `frecuencia`, `duracion_tratamiento` |
| `OrdenExamen` | `indicaciones` |
| `Teleconsulta` | `notas_internas` (cifrado adicional, no exigido explicitamente pero es dato clinico sensible) |

## Requisitos

- Docker y Docker Compose (para levantar todo el sistema)
- Node.js 20+ y npm (solo si se quiere ejecutar/depurar servicios individualmente fuera de Docker)

## Puesta en marcha con Docker (recomendado)

```bash
cd backend
cp .env.example .env
# Editar .env: sobre todo JWT_SECRET y ENCRYPTION_KEY con valores propios y seguros

docker compose up --build
```

Esto levanta PostgreSQL (con las 6 bases de datos), RabbitMQ (panel en http://localhost:15672)
y los 7 servicios Nest. El Gateway queda expuesto en `http://localhost:3000`.

Prueba rapida:

```bash
# 1. Crear un rol
curl -X POST http://localhost:3000/roles -H "Content-Type: application/json" \
  -d '{"nombre_rol":"PACIENTE","descripcion":"Rol paciente"}'

# 2. Crear un usuario (usa el id_rol devuelto arriba)
curl -X POST http://localhost:3000/usuarios -H "Content-Type: application/json" \
  -d '{"id_rol":1,"email":"paciente@demo.com","password":"Segura123"}'

# 3. Login -> devuelve JWT
curl -X POST http://localhost:3000/auth/login -H "Content-Type: application/json" \
  -d '{"email":"paciente@demo.com","password":"Segura123"}'

# 4. Usar el token en el resto de endpoints protegidos
curl http://localhost:3000/pacientes -H "Authorization: Bearer <access_token>"
```

## Ejecucion local sin Docker (desarrollo)

Requiere PostgreSQL y RabbitMQ corriendo localmente (o accesibles) y las variables de `.env" cargadas.

```bash
npm install
npm run start:users:dev       # cada microservicio en su propia terminal
npm run start:requests:dev
npm run start:telemetry:dev
npm run start:clinical:dev
npm run start:integration:dev
npm run start:finance:dev
npm run start:gateway:dev
```

## Autenticacion

- `POST /auth/login` es publico (`@Public()`); el resto de rutas del Gateway estan protegidas
  por un `JwtAuthGuard` global (`apps/gateway/src/common/guards/jwt-auth.guard.ts`).
- El JWT se firma en el Gateway tras validar credenciales contra `users-service`
  (`usuarios.validateCredentials`, que compara con `bcrypt` contra `password_hash`).

## Decisiones y limitaciones a tener en cuenta antes de produccion

- **`synchronize: true` en TypeORM:** valido para levantar el esquema rapido en desarrollo/demo.
  Para produccion real, reemplazar por migraciones (`typeorm migration:generate` / `migration:run`) y desactivar `synchronize`.
- **Autorizacion por rol:** el Gateway valida el JWT (autenticacion) pero no implementa aun
  guards de autorizacion por rol/permiso sobre cada endpoint (p. ej. que solo un `MEDICO` cree `Registros_Evolucion`).
  La tabla `Roles` y el rol embebido en el JWT ya estan disponibles para construir ese guard.
- **Validacion cruzada entre servicios:** por diseño de microservicios, un servicio no valida contra la base de datos
  de otro (p. ej. `requests-service` no verifica que `id_paciente` exista realmente en `users-service`). Si se requiere
  consistencia fuerte, agregar una llamada TCP de verificacion antes de crear el recurso.
- **Secretos:** `.env` esta en `.gitignore`; usar `.env.example` como plantilla y nunca commitear
  `JWT_SECRET` / `ENCRYPTION_KEY` reales. En produccion, inyectar estas variables desde un vault/secret manager.

## Inicializar el repositorio Git y subir el proyecto

```bash
cd backend
git init                       # si el backend va a vivir en su propio repo
git add .
git commit -m "Backend inicial: microservicios NestJS + Docker + cifrado AES-256"
git branch -M main
git remote add origin <URL_DE_TU_REPOSITORIO>
git push -u origin main
```

> Si prefieres mantener este backend dentro del repositorio raiz del proyecto (junto a la documentacion),
> simplemente omite `git init` aqui y haz `git add backend/` desde la raiz del repo ya existente.
