import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { AsignacionRecurso } from '../asignaciones/asignacion-recurso.entity';

export enum NivelPrioridad {
  BAJA = 'BAJA',
  MEDIA = 'MEDIA',
  ALTA = 'ALTA',
  CRITICA = 'CRITICA',
}

export enum EstadoSolicitud {
  PENDIENTE = 'PENDIENTE',
  ASIGNADA = 'ASIGNADA',
  EN_ATENCION = 'EN_ATENCION',
  FINALIZADA = 'FINALIZADA',
  CANCELADA = 'CANCELADA',
}

@Entity('solicitudes_atencion')
export class SolicitudAtencion {
  @PrimaryGeneratedColumn({ name: 'id_solicitud' })
  id: number;

  // Referencia logica al microservicio users-service (sin FK fisica entre bases de datos)
  @Column({ name: 'id_paciente' })
  id_paciente: number;

  @CreateDateColumn({ name: 'fecha_hora_solicitud' })
  fecha_hora_solicitud: Date;

  @Column({ name: 'sintomas_descritos', type: 'text' })
  sintomas_descritos: string;

  @Column({ name: 'nivel_prioridad', type: 'enum', enum: NivelPrioridad, default: NivelPrioridad.MEDIA })
  nivel_prioridad: NivelPrioridad;

  @Column({ name: 'estado', type: 'enum', enum: EstadoSolicitud, default: EstadoSolicitud.PENDIENTE })
  estado: EstadoSolicitud;

  @OneToMany(() => AsignacionRecurso, (asignacion) => asignacion.solicitud)
  asignaciones?: AsignacionRecurso[];
}

export class CreateSolicitudAtencionDto {
  @IsInt() id_paciente: number;
  @IsNotEmpty() @IsString() sintomas_descritos: string;
  @IsOptional() @IsEnum(NivelPrioridad) nivel_prioridad?: NivelPrioridad;
}

export class UpdateSolicitudAtencionDto {
  @IsOptional() @IsString() sintomas_descritos?: string;
  @IsOptional() @IsEnum(NivelPrioridad) nivel_prioridad?: NivelPrioridad;
  @IsOptional() @IsEnum(EstadoSolicitud) estado?: EstadoSolicitud;
}
