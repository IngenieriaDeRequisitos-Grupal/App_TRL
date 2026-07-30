# App_TRL

Aplicación de evaluación de madurez tecnológica TRL de la UTPL.

- `backend/`: API REST desarrollada con NestJS, TypeScript, TypeORM y PostgreSQL.
- `Trl_APP/`: interfaz web basada en templates HTML5 y CSS3, conectada a la API REST.
- [ARRANQUE_COMPLETO.md](ARRANQUE_COMPLETO.md): instalación y ejecución local paso a paso.

## Estructura del proyecto

```text
App_TRL/
├── backend/                         # Backend NestJS y PostgreSQL
│   ├── src/
│   │   ├── common/
│   │   │   ├── http/                # Filtros y manejo seguro de errores
│   │   │   └── security/            # JWT, roles, consentimiento y cifrado
│   │   ├── config/                  # Variables y configuración del entorno
│   │   ├── database/
│   │   │   ├── entities/            # Modelos TypeORM
│   │   │   ├── migrations/          # Migraciones PostgreSQL
│   │   │   └── seed.ts              # Datos iniciales
│   │   ├── modules/
│   │   │   ├── auth/                # Autenticación y MFA
│   │   │   ├── users/               # Usuarios y roles
│   │   │   ├── projects/            # Invenciones y proyectos
│   │   │   ├── evaluations/         # Evaluaciones TRL
│   │   │   ├── evidence/            # Evidencias PDF cifradas
│   │   │   ├── consent/             # Términos y privacidad
│   │   │   ├── management/          # Dashboard y métricas
│   │   │   └── audit/               # Auditoría de operaciones
│   │   ├── app.module.ts
│   │   └── main.ts
│   ├── docker/                       # Inicialización de PostgreSQL
│   ├── Dockerfile
│   ├── docker-compose.yml
│   └── package.json
├── Trl_APP/                          # Capa web de templates
│   ├── app/
│   │   ├── TRL_APP/
│   │   │   ├── templates/            # Vistas HTML por módulo
│   │   │   │   ├── auth/
│   │   │   │   ├── projects/
│   │   │   │   ├── evaluations/
│   │   │   │   ├── evidence/
│   │   │   │   ├── management/
│   │   │   │   └── legal/
│   │   │   ├── static/
│   │   │   │   ├── css/              # Estilos de la plataforma
│   │   │   │   └── img/              # Logo y recursos visuales
│   │   │   ├── api.py                 # Comunicación con la API REST
│   │   │   ├── forms.py               # Formularios y validaciones
│   │   │   ├── urls.py                # Rutas de la interfaz
│   │   │   └── views.py               # Control de las vistas
│   │   └── manage.py
│   └── requirements.txt
├── ARRANQUE_COMPLETO.md               # Comandos de instalación y ejecución
├── handover_tecnico.md                # Documentación técnica de seguridad
└── README.md
```

## Tecnologías principales

- Backend: NestJS, TypeScript y TypeORM.
- Persistencia: PostgreSQL 16.
- Interfaz: templates HTML5, CSS3 y renderizado del lado del servidor.
- Seguridad: JWT, MFA TOTP, RBAC, AES-256-GCM, bcrypt y auditoría.
- Infraestructura local: Docker y Docker Compose.
