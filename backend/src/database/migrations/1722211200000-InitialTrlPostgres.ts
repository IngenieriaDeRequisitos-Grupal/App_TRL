import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialTrlPostgres1722211200000 implements MigrationInterface {
  name = 'InitialTrlPostgres1722211200000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('CREATE EXTENSION IF NOT EXISTS pgcrypto');
    await queryRunner.query(`CREATE TYPE rol_nombre_enum AS ENUM ('ADMINISTRADOR','INVESTIGADOR','EVALUADOR','GESTOR_IDI')`);
    await queryRunner.query(`CREATE TYPE usuario_estado_enum AS ENUM ('ACTIVO','SUSPENDIDO','BLOQUEADO')`);
    await queryRunner.query(`CREATE TYPE solicitud_estado_enum AS ENUM ('BORRADOR','ENVIADA','ASIGNADA','EN_EVALUACION','OBSERVADA','EVALUADA')`);
    await queryRunner.query(`CREATE TYPE progreso_estado_enum AS ENUM ('NO_INICIADO','EN_PROGRESO','COMPLETADO')`);
    await queryRunner.query(`CREATE TYPE observacion_estado_enum AS ENUM ('PENDIENTE','CORREGIDA','CERRADA')`);
    await queryRunner.query(`CREATE TYPE consentimiento_tipo_enum AS ENUM ('TERMINOS_USO','AVISO_PRIVACIDAD','FINALIDAD_OPCIONAL')`);
    await queryRunner.query(`CREATE TYPE consentimiento_decision_enum AS ENUM ('ACEPTADO','RECHAZADO','RETIRADO')`);

    await queryRunner.query(`CREATE TABLE roles (
      id_rol uuid PRIMARY KEY DEFAULT gen_random_uuid(), nombre_rol rol_nombre_enum NOT NULL UNIQUE,
      nivel_privilegio varchar(40) NOT NULL
    )`);
    await queryRunner.query(`CREATE TABLE usuarios (
      id_usuario uuid PRIMARY KEY DEFAULT gen_random_uuid(), tipo_usuario varchar(30) NOT NULL,
      nombre_completo varchar(160) NOT NULL, cedula text NOT NULL, cedula_hash varchar(64) NOT NULL UNIQUE,
      correo_electronico varchar(254) NOT NULL UNIQUE, hash_contrasena varchar NOT NULL,
      estado usuario_estado_enum NOT NULL DEFAULT 'ACTIVO', version_sesion integer NOT NULL DEFAULT 0,
      intentos_login_fallidos integer NOT NULL DEFAULT 0, bloqueado_hasta timestamptz,
      id_rol uuid NOT NULL REFERENCES roles(id_rol) ON DELETE RESTRICT,
      especialidad_tecnica varchar(120), departamento_evaluador varchar(120), departamento_gestor varchar(120),
      fecha_creacion timestamptz NOT NULL DEFAULT now(), fecha_actualizacion timestamptz NOT NULL DEFAULT now(),
      CONSTRAINT ck_usuarios_intentos CHECK (intentos_login_fallidos >= 0)
    )`);
    await queryRunner.query(`CREATE TABLE sesiones (
      id_sesion uuid PRIMARY KEY DEFAULT gen_random_uuid(), token_jwt varchar(64), direccion_ip varchar(64),
      fecha_expiracion timestamptz, revocada boolean NOT NULL DEFAULT true,
      id_usuario uuid NOT NULL UNIQUE REFERENCES usuarios(id_usuario) ON DELETE CASCADE
    )`);
    await queryRunner.query(`CREATE TABLE mfa (
      id_mfa uuid PRIMARY KEY DEFAULT gen_random_uuid(), codigo_totp text NOT NULL,
      fecha_emision timestamptz NOT NULL, intentos_fallidos integer NOT NULL DEFAULT 0,
      id_sesion uuid NOT NULL UNIQUE REFERENCES sesiones(id_sesion) ON DELETE CASCADE,
      CONSTRAINT ck_mfa_intentos CHECK (intentos_fallidos >= 0)
    )`);
    await queryRunner.query(`CREATE TABLE servicios_nube (
      id_servidor uuid PRIMARY KEY DEFAULT gen_random_uuid(), direccion_ip varchar(255) NOT NULL,
      protocolo_cifrado varchar(40) NOT NULL, estado_microservicio varchar(40) NOT NULL
    )`);
    await queryRunner.query(`CREATE TABLE proyectos_invencion (
      id_proyecto uuid PRIMARY KEY DEFAULT gen_random_uuid(), titulo_tecnologia varchar(220) NOT NULL,
      rama_innovacion varchar(160) NOT NULL, fecha_creacion timestamptz NOT NULL DEFAULT now(),
      nivel_trl_actual smallint, id_investigador uuid NOT NULL REFERENCES usuarios(id_usuario) ON DELETE RESTRICT,
      id_servidor uuid REFERENCES servicios_nube(id_servidor) ON DELETE SET NULL,
      CONSTRAINT ck_proyecto_trl CHECK (nivel_trl_actual IS NULL OR nivel_trl_actual BETWEEN 1 AND 9)
    )`);
    await queryRunner.query(`CREATE TABLE configuraciones_trl (
      id_configuracion uuid PRIMARY KEY DEFAULT gen_random_uuid(), parametros_universidad jsonb NOT NULL,
      version varchar(40) NOT NULL, activa boolean NOT NULL DEFAULT true,
      id_gestor uuid NOT NULL REFERENCES usuarios(id_usuario) ON DELETE RESTRICT,
      fecha_creacion timestamptz NOT NULL DEFAULT now()
    )`);
    await queryRunner.query(`CREATE UNIQUE INDEX ux_configuracion_activa ON configuraciones_trl (activa) WHERE activa = true`);
    await queryRunner.query(`CREATE TABLE solicitudes_evaluacion (
      id_solicitud uuid PRIMARY KEY DEFAULT gen_random_uuid(), fecha_envio timestamptz NOT NULL DEFAULT now(),
      estado solicitud_estado_enum NOT NULL DEFAULT 'BORRADOR',
      id_proyecto uuid NOT NULL REFERENCES proyectos_invencion(id_proyecto) ON DELETE CASCADE,
      id_evaluador uuid REFERENCES usuarios(id_usuario) ON DELETE SET NULL
    )`);
    await queryRunner.query(`CREATE TABLE cuestionarios (
      id_cuestionario uuid PRIMARY KEY DEFAULT gen_random_uuid(), respuestas_json jsonb NOT NULL DEFAULT '{}'::jsonb,
      estado_progreso progreso_estado_enum NOT NULL DEFAULT 'NO_INICIADO',
      id_solicitud uuid NOT NULL UNIQUE REFERENCES solicitudes_evaluacion(id_solicitud) ON DELETE CASCADE,
      id_configuracion uuid NOT NULL REFERENCES configuraciones_trl(id_configuracion) ON DELETE RESTRICT
    )`);
    await queryRunner.query(`CREATE TABLE niveles_trl (
      id_nivel uuid PRIMARY KEY DEFAULT gen_random_uuid(), valor_estimado smallint NOT NULL,
      id_solicitud uuid NOT NULL UNIQUE REFERENCES solicitudes_evaluacion(id_solicitud) ON DELETE CASCADE,
      CONSTRAINT ck_nivel_estimado CHECK (valor_estimado BETWEEN 0 AND 9)
    )`);
    await queryRunner.query(`CREATE TABLE documentos_adjuntos (
      id_documento uuid PRIMARY KEY DEFAULT gen_random_uuid(), nombre_archivo varchar(255) NOT NULL,
      url_bucket_protegido varchar(320) NOT NULL, tipo_formato varchar(80) NOT NULL,
      contenido_cifrado bytea NOT NULL, sha256 varchar(64) NOT NULL, tamano_bytes integer NOT NULL,
      fecha_carga timestamptz NOT NULL DEFAULT now(),
      id_cuestionario uuid NOT NULL REFERENCES cuestionarios(id_cuestionario) ON DELETE CASCADE,
      CONSTRAINT ck_documento_tamano CHECK (tamano_bytes > 0)
    )`);
    await queryRunner.query(`CREATE TABLE observaciones (
      id_observacion uuid PRIMARY KEY DEFAULT gen_random_uuid(), descripcion_problema text NOT NULL,
      fecha_creacion timestamptz NOT NULL DEFAULT now(), estado observacion_estado_enum NOT NULL DEFAULT 'PENDIENTE',
      id_solicitud uuid NOT NULL REFERENCES solicitudes_evaluacion(id_solicitud) ON DELETE CASCADE,
      id_evaluador uuid NOT NULL REFERENCES usuarios(id_usuario) ON DELETE RESTRICT,
      id_investigador uuid NOT NULL REFERENCES usuarios(id_usuario) ON DELETE RESTRICT
    )`);
    await queryRunner.query(`CREATE TABLE calificaciones_finales (
      id_calificacion uuid PRIMARY KEY DEFAULT gen_random_uuid(), dictamen_auditoria text NOT NULL,
      nivel_aprobado smallint NOT NULL, fecha_calificacion timestamptz NOT NULL DEFAULT now(),
      id_solicitud uuid NOT NULL UNIQUE REFERENCES solicitudes_evaluacion(id_solicitud) ON DELETE CASCADE,
      id_evaluador uuid NOT NULL REFERENCES usuarios(id_usuario) ON DELETE RESTRICT,
      CONSTRAINT ck_calificacion_trl CHECK (nivel_aprobado BETWEEN 1 AND 9)
    )`);
    await queryRunner.query(`CREATE TABLE dashboards (
      id_dashboard uuid PRIMARY KEY DEFAULT gen_random_uuid(), estadisticas_globales jsonb NOT NULL,
      estados_solicitudes text NOT NULL, id_gestor uuid NOT NULL REFERENCES usuarios(id_usuario) ON DELETE RESTRICT,
      fecha_generacion timestamptz NOT NULL DEFAULT now()
    )`);
    await queryRunner.query(`CREATE TABLE reportes (
      numero_reporte varchar(80) PRIMARY KEY, fecha_generacion timestamptz NOT NULL DEFAULT now(),
      contenido_pdf bytea NOT NULL, sha256 varchar(64) NOT NULL,
      id_gestor uuid NOT NULL REFERENCES usuarios(id_usuario) ON DELETE RESTRICT
    )`);
    await queryRunner.query(`CREATE TABLE reportes_proyectos (
      numero_reporte varchar(80) NOT NULL REFERENCES reportes(numero_reporte) ON DELETE CASCADE,
      id_proyecto uuid NOT NULL REFERENCES proyectos_invencion(id_proyecto) ON DELETE CASCADE,
      PRIMARY KEY (numero_reporte, id_proyecto)
    )`);
    await queryRunner.query(`CREATE TABLE consentimientos (
      id_consentimiento uuid PRIMARY KEY DEFAULT gen_random_uuid(), id_usuario uuid NOT NULL REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
      tipo consentimiento_tipo_enum NOT NULL, finalidad varchar(180) NOT NULL, base_juridica varchar(100) NOT NULL,
      version_documento varchar(40) NOT NULL, hash_documento varchar(64) NOT NULL,
      decision consentimiento_decision_enum NOT NULL, ip_hash varchar(64) NOT NULL,
      fecha_evento timestamptz NOT NULL DEFAULT now()
    )`);
    await queryRunner.query(`CREATE TABLE eventos_auditoria (
      id_evento uuid PRIMARY KEY DEFAULT gen_random_uuid(), id_actor uuid, accion varchar(120) NOT NULL,
      recurso varchar(160) NOT NULL, resultado varchar(40) NOT NULL, correlation_id varchar(80) NOT NULL,
      ip_hash varchar(64), fecha_evento timestamptz NOT NULL DEFAULT now()
    )`);
    await queryRunner.query(`CREATE INDEX ix_solicitud_proyecto ON solicitudes_evaluacion(id_proyecto)`);
    await queryRunner.query(`CREATE INDEX ix_solicitud_evaluador ON solicitudes_evaluacion(id_evaluador)`);
    await queryRunner.query(`CREATE INDEX ix_consentimiento_usuario_fecha ON consentimientos(id_usuario, fecha_evento DESC)`);
    await queryRunner.query(`CREATE INDEX ix_auditoria_actor_fecha ON eventos_auditoria(id_actor, fecha_evento DESC)`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    for (const table of ['eventos_auditoria','consentimientos','reportes_proyectos','reportes','dashboards','calificaciones_finales','observaciones','documentos_adjuntos','niveles_trl','cuestionarios','solicitudes_evaluacion','configuraciones_trl','proyectos_invencion','servicios_nube','mfa','sesiones','usuarios','roles']) {
      await queryRunner.query(`DROP TABLE IF EXISTS ${table} CASCADE`);
    }
    for (const type of ['consentimiento_decision_enum','consentimiento_tipo_enum','observacion_estado_enum','progreso_estado_enum','solicitud_estado_enum','usuario_estado_enum','rol_nombre_enum']) {
      await queryRunner.query(`DROP TYPE IF EXISTS ${type}`);
    }
  }
}
