import {
  ChildEntity,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryColumn,
  PrimaryGeneratedColumn,
  TableInheritance,
  UpdateDateColumn,
} from 'typeorm';
import {
  DecisionConsentimiento,
  EstadoObservacion,
  EstadoProgreso,
  EstadoSolicitud,
  EstadoUsuario,
  NombreRol,
  TipoConsentimiento,
} from '../../common/domain.enums';

@Entity('roles')
export class Rol {
  @PrimaryGeneratedColumn('uuid', { name: 'id_rol' })
  id_rol: string;

  @Index({ unique: true })
  @Column({ name: 'nombre_rol', type: 'enum', enum: NombreRol })
  nombre_rol: NombreRol;

  @Column({ name: 'nivel_privilegio', length: 40 })
  nivel_privilegio: string;

  @OneToMany(() => Usuario, (usuario) => usuario.rol)
  usuarios: Usuario[];
}

@Entity('usuarios')
@TableInheritance({ column: { name: 'tipo_usuario', type: 'varchar', length: 30 } })
export abstract class Usuario {
  @PrimaryGeneratedColumn('uuid', { name: 'id_usuario' })
  id_usuario: string;

  @Column({ name: 'nombre_completo', length: 160 })
  nombre_completo: string;

  // SECURITY: la cédula se almacena cifrada; cedula_hash permite unicidad sin descifrado masivo.
  @Column({ name: 'cedula', type: 'text', select: false })
  cedula: string;

  @Index({ unique: true })
  @Column({ name: 'cedula_hash', length: 64, select: false })
  cedula_hash: string;

  @Index({ unique: true })
  @Column({ name: 'correo_electronico', length: 254 })
  correo_electronico: string;

  @Column({ name: 'hash_contrasena', select: false })
  hash_contrasena: string;

  @Column({ name: 'estado', type: 'enum', enum: EstadoUsuario, default: EstadoUsuario.ACTIVO })
  estado: EstadoUsuario;

  @Column({ name: 'version_sesion', type: 'integer', default: 0 })
  version_sesion: number;

  @Column({ name: 'intentos_login_fallidos', type: 'integer', default: 0, select: false })
  intentos_login_fallidos: number;

  @Column({ name: 'bloqueado_hasta', type: 'timestamptz', nullable: true, select: false })
  bloqueado_hasta: Date | null;

  @ManyToOne(() => Rol, (rol) => rol.usuarios, { eager: true, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'id_rol' })
  rol: Rol;

  @OneToOne(() => Sesion, (sesion) => sesion.usuario)
  sesion: Sesion;

  @CreateDateColumn({ name: 'fecha_creacion' })
  fecha_creacion: Date;

  @UpdateDateColumn({ name: 'fecha_actualizacion' })
  fecha_actualizacion: Date;
}

@ChildEntity(NombreRol.ADMINISTRADOR)
export class Administrador extends Usuario {}

@ChildEntity(NombreRol.INVESTIGADOR)
export class Investigador extends Usuario {
  @OneToMany(() => ProyectoInvencion, (proyecto) => proyecto.investigador)
  proyectos: ProyectoInvencion[];

  @OneToMany(() => Observacion, (observacion) => observacion.investigador)
  observaciones: Observacion[];
}

@ChildEntity(NombreRol.EVALUADOR)
export class Evaluador extends Usuario {
  @Column({ name: 'especialidad_tecnica', length: 120, nullable: true })
  especialidad_tecnica: string | null;

  @Column({ name: 'departamento_evaluador', length: 120, nullable: true })
  departamento: string | null;

  @OneToMany(() => SolicitudEvaluacion, (solicitud) => solicitud.evaluador)
  solicitudes: SolicitudEvaluacion[];
}

@ChildEntity(NombreRol.GESTOR_IDI)
export class GestorIdi extends Usuario {
  @Column({ name: 'departamento_gestor', length: 120, nullable: true })
  departamento: string | null;

  @OneToMany(() => ConfiguracionTrl, (configuracion) => configuracion.gestor)
  configuraciones: ConfiguracionTrl[];
}

@Entity('sesiones')
export class Sesion {
  @PrimaryGeneratedColumn('uuid', { name: 'id_sesion' })
  id_sesion: string;

  // SECURITY: el atributo del diagrama conserva su nombre, pero almacena SHA-256 del JWT, nunca el bearer token.
  @Column({ name: 'token_jwt', length: 64, nullable: true, select: false })
  token_jwt: string | null;

  @Column({ name: 'direccion_ip', length: 64, nullable: true, select: false })
  direccion_ip: string | null;

  @Column({ name: 'fecha_expiracion', type: 'timestamptz', nullable: true })
  fecha_expiracion: Date | null;

  @Column({ name: 'revocada', default: true })
  revocada: boolean;

  @OneToOne(() => Usuario, (usuario) => usuario.sesion, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id_usuario' })
  usuario: Usuario;

  @OneToOne(() => Mfa, (mfa) => mfa.sesion, { cascade: true })
  mfa: Mfa;
}

@Entity('mfa')
export class Mfa {
  @PrimaryGeneratedColumn('uuid', { name: 'id_mfa' })
  id_mfa: string;

  // SECURITY: codigo_totp contiene el secreto TOTP cifrado con AES-256-GCM y nunca se selecciona por defecto.
  @Column({ name: 'codigo_totp', type: 'text', select: false })
  codigo_totp: string;

  @Column({ name: 'fecha_emision', type: 'timestamptz' })
  fecha_emision: Date;

  @Column({ name: 'intentos_fallidos', type: 'integer', default: 0 })
  intentos_fallidos: number;

  @OneToOne(() => Sesion, (sesion) => sesion.mfa, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id_sesion' })
  sesion: Sesion;
}

@Entity('servicios_nube')
export class ServicioNube {
  @PrimaryGeneratedColumn('uuid', { name: 'id_servidor' })
  id_servidor: string;

  @Column({ name: 'direccion_ip', length: 255 })
  direccion_ip: string;

  @Column({ name: 'protocolo_cifrado', length: 40 })
  protocolo_cifrado: string;

  @Column({ name: 'estado_microservicio', length: 40 })
  estado_microservicio: string;

  @OneToMany(() => ProyectoInvencion, (proyecto) => proyecto.servicio_persistencia)
  proyectos: ProyectoInvencion[];
}

@Entity('proyectos_invencion')
export class ProyectoInvencion {
  @PrimaryGeneratedColumn('uuid', { name: 'id_proyecto' })
  id_proyecto: string;

  @Column({ name: 'titulo_tecnologia', length: 220 })
  titulo_tecnologia: string;

  @Column({ name: 'rama_innovacion', length: 160 })
  rama_innovacion: string;

  @CreateDateColumn({ name: 'fecha_creacion' })
  fecha_creacion: Date;

  @Column({ name: 'nivel_trl_actual', type: 'smallint', nullable: true })
  nivel_trl_actual: number | null;

  @ManyToOne(() => Investigador, (investigador) => investigador.proyectos, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'id_investigador' })
  investigador: Investigador;

  @ManyToOne(() => ServicioNube, (servicio) => servicio.proyectos, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'id_servidor' })
  servicio_persistencia: ServicioNube | null;

  @OneToMany(() => SolicitudEvaluacion, (solicitud) => solicitud.proyecto)
  solicitudes: SolicitudEvaluacion[];

  @ManyToMany(() => Reporte, (reporte) => reporte.proyectos)
  reportes: Reporte[];
}

@Entity('solicitudes_evaluacion')
export class SolicitudEvaluacion {
  @PrimaryGeneratedColumn('uuid', { name: 'id_solicitud' })
  id_solicitud: string;

  @CreateDateColumn({ name: 'fecha_envio' })
  fecha_envio: Date;

  @Column({ name: 'estado', type: 'enum', enum: EstadoSolicitud, default: EstadoSolicitud.BORRADOR })
  estado: EstadoSolicitud;

  @ManyToOne(() => ProyectoInvencion, (proyecto) => proyecto.solicitudes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id_proyecto' })
  proyecto: ProyectoInvencion;

  @ManyToOne(() => Evaluador, (evaluador) => evaluador.solicitudes, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'id_evaluador' })
  evaluador: Evaluador | null;

  @OneToOne(() => Cuestionario, (cuestionario) => cuestionario.solicitud)
  cuestionario: Cuestionario;

  @OneToOne(() => NivelTrl, (nivel) => nivel.solicitud)
  nivel: NivelTrl;

  @OneToMany(() => Observacion, (observacion) => observacion.solicitud)
  observaciones: Observacion[];

  @OneToOne(() => CalificacionFinal, (calificacion) => calificacion.solicitud)
  calificacion: CalificacionFinal;
}

@Entity('configuraciones_trl')
export class ConfiguracionTrl {
  @PrimaryGeneratedColumn('uuid', { name: 'id_configuracion' })
  id_configuracion: string;

  @Column({ name: 'parametros_universidad', type: 'jsonb' })
  parametros_universidad: Record<string, unknown>;

  @Column({ name: 'version', length: 40 })
  version: string;

  @Column({ name: 'activa', default: true })
  activa: boolean;

  @ManyToOne(() => GestorIdi, (gestor) => gestor.configuraciones, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'id_gestor' })
  gestor: GestorIdi;

  @CreateDateColumn({ name: 'fecha_creacion' })
  fecha_creacion: Date;

  @OneToMany(() => Cuestionario, (cuestionario) => cuestionario.configuracion)
  cuestionarios: Cuestionario[];
}

@Entity('cuestionarios')
export class Cuestionario {
  @PrimaryGeneratedColumn('uuid', { name: 'id_cuestionario' })
  id_cuestionario: string;

  @Column({ name: 'respuestas_json', type: 'jsonb', default: () => "'{}'::jsonb" })
  respuestas_json: Record<string, unknown>;

  @Column({ name: 'estado_progreso', type: 'enum', enum: EstadoProgreso, default: EstadoProgreso.NO_INICIADO })
  estado_progreso: EstadoProgreso;

  @OneToOne(() => SolicitudEvaluacion, (solicitud) => solicitud.cuestionario, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id_solicitud' })
  solicitud: SolicitudEvaluacion;

  @ManyToOne(() => ConfiguracionTrl, (configuracion) => configuracion.cuestionarios, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'id_configuracion' })
  configuracion: ConfiguracionTrl;

  @OneToMany(() => DocumentoAdjunto, (documento) => documento.cuestionario)
  documentos: DocumentoAdjunto[];
}

@Entity('niveles_trl')
export class NivelTrl {
  @PrimaryGeneratedColumn('uuid', { name: 'id_nivel' })
  id_nivel: string;

  @Column({ name: 'valor_estimado', type: 'smallint' })
  valor_estimado: number;

  @OneToOne(() => SolicitudEvaluacion, (solicitud) => solicitud.nivel, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id_solicitud' })
  solicitud: SolicitudEvaluacion;
}

@Entity('documentos_adjuntos')
export class DocumentoAdjunto {
  @PrimaryGeneratedColumn('uuid', { name: 'id_documento' })
  id_documento: string;

  @Column({ name: 'nombre_archivo', length: 255 })
  nombre_archivo: string;

  @Column({ name: 'url_bucket_protegido', length: 320 })
  url_bucket_protegido: string;

  @Column({ name: 'tipo_formato', length: 80 })
  tipo_formato: string;

  // SECURITY: PostgreSQL BYTEA reemplaza el bucket externo y contiene el PDF cifrado y autenticado.
  @Column({ name: 'contenido_cifrado', type: 'bytea', select: false })
  contenido_cifrado: Buffer;

  @Column({ name: 'sha256', length: 64 })
  sha256: string;

  @Column({ name: 'tamano_bytes', type: 'integer' })
  tamano_bytes: number;

  @CreateDateColumn({ name: 'fecha_carga' })
  fecha_carga: Date;

  @ManyToOne(() => Cuestionario, (cuestionario) => cuestionario.documentos, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id_cuestionario' })
  cuestionario: Cuestionario;
}

@Entity('observaciones')
export class Observacion {
  @PrimaryGeneratedColumn('uuid', { name: 'id_observacion' })
  id_observacion: string;

  @Column({ name: 'descripcion_problema', type: 'text' })
  descripcion_problema: string;

  @CreateDateColumn({ name: 'fecha_creacion' })
  fecha_creacion: Date;

  @Column({ name: 'estado', type: 'enum', enum: EstadoObservacion, default: EstadoObservacion.PENDIENTE })
  estado: EstadoObservacion;

  @ManyToOne(() => SolicitudEvaluacion, (solicitud) => solicitud.observaciones, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id_solicitud' })
  solicitud: SolicitudEvaluacion;

  @ManyToOne(() => Evaluador, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'id_evaluador' })
  evaluador: Evaluador;

  @ManyToOne(() => Investigador, (investigador) => investigador.observaciones, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'id_investigador' })
  investigador: Investigador;
}

@Entity('calificaciones_finales')
export class CalificacionFinal {
  @PrimaryGeneratedColumn('uuid', { name: 'id_calificacion' })
  id_calificacion: string;

  @Column({ name: 'dictamen_auditoria', type: 'text' })
  dictamen_auditoria: string;

  @Column({ name: 'nivel_aprobado', type: 'smallint' })
  nivel_aprobado: number;

  @CreateDateColumn({ name: 'fecha_calificacion' })
  fecha_calificacion: Date;

  @OneToOne(() => SolicitudEvaluacion, (solicitud) => solicitud.calificacion, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id_solicitud' })
  solicitud: SolicitudEvaluacion;

  @ManyToOne(() => Evaluador, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'id_evaluador' })
  evaluador: Evaluador;
}

@Entity('dashboards')
export class Dashboard {
  @PrimaryGeneratedColumn('uuid', { name: 'id_dashboard' })
  id_dashboard: string;

  @Column({ name: 'estadisticas_globales', type: 'jsonb' })
  estadisticas_globales: Record<string, unknown>;

  @Column({ name: 'estados_solicitudes', type: 'text' })
  estados_solicitudes: string;

  @ManyToOne(() => GestorIdi, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'id_gestor' })
  gestor: GestorIdi;

  @CreateDateColumn({ name: 'fecha_generacion' })
  fecha_generacion: Date;
}

@Entity('reportes')
export class Reporte {
  @PrimaryColumn({ name: 'numero_reporte', length: 80 })
  numero_reporte: string;

  @CreateDateColumn({ name: 'fecha_generacion' })
  fecha_generacion: Date;

  @Column({ name: 'contenido_pdf', type: 'bytea', select: false })
  contenido_pdf: Buffer;

  @Column({ name: 'sha256', length: 64 })
  sha256: string;

  @ManyToOne(() => GestorIdi, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'id_gestor' })
  gestor: GestorIdi;

  @ManyToMany(() => ProyectoInvencion, (proyecto) => proyecto.reportes)
  @JoinTable({
    name: 'reportes_proyectos',
    joinColumn: { name: 'numero_reporte', referencedColumnName: 'numero_reporte' },
    inverseJoinColumn: { name: 'id_proyecto', referencedColumnName: 'id_proyecto' },
  })
  proyectos: ProyectoInvencion[];
}

@Entity('consentimientos')
export class Consentimiento {
  @PrimaryGeneratedColumn('uuid', { name: 'id_consentimiento' })
  id_consentimiento: string;

  @ManyToOne(() => Usuario, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id_usuario' })
  usuario: Usuario;

  @Column({ name: 'tipo', type: 'enum', enum: TipoConsentimiento })
  tipo: TipoConsentimiento;

  @Column({ name: 'finalidad', length: 180 })
  finalidad: string;

  @Column({ name: 'base_juridica', length: 100 })
  base_juridica: string;

  @Column({ name: 'version_documento', length: 40 })
  version_documento: string;

  @Column({ name: 'hash_documento', length: 64 })
  hash_documento: string;

  @Column({ name: 'decision', type: 'enum', enum: DecisionConsentimiento })
  decision: DecisionConsentimiento;

  @Column({ name: 'ip_hash', length: 64, select: false })
  ip_hash: string;

  @CreateDateColumn({ name: 'fecha_evento' })
  fecha_evento: Date;
}

@Entity('eventos_auditoria')
export class EventoAuditoria {
  @PrimaryGeneratedColumn('uuid', { name: 'id_evento' })
  id_evento: string;

  @Column({ name: 'id_actor', type: 'uuid', nullable: true })
  id_actor: string | null;

  @Column({ name: 'accion', length: 120 })
  accion: string;

  @Column({ name: 'recurso', length: 160 })
  recurso: string;

  @Column({ name: 'resultado', length: 40 })
  resultado: string;

  @Column({ name: 'correlation_id', length: 80 })
  correlation_id: string;

  @Column({ name: 'ip_hash', length: 64, nullable: true })
  ip_hash: string | null;

  @CreateDateColumn({ name: 'fecha_evento' })
  fecha_evento: Date;
}

export const TRL_ENTITIES = [
  Rol,
  Usuario,
  Administrador,
  Investigador,
  Evaluador,
  GestorIdi,
  Sesion,
  Mfa,
  ServicioNube,
  ProyectoInvencion,
  SolicitudEvaluacion,
  ConfiguracionTrl,
  Cuestionario,
  NivelTrl,
  DocumentoAdjunto,
  Observacion,
  CalificacionFinal,
  Dashboard,
  Reporte,
  Consentimiento,
  EventoAuditoria,
] as const;
