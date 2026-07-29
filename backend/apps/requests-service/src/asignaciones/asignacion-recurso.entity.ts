import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { IsInt, IsOptional, Min } from 'class-validator';
import { SolicitudAtencion } from '../solicitudes/solicitud-atencion.entity';

@Entity('asignaciones_recursos')
export class AsignacionRecurso {
  @PrimaryGeneratedColumn({ name: 'id_asignacion' })
  id: number;

  @ManyToOne(() => SolicitudAtencion, (solicitud) => solicitud.asignaciones, {
    eager: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'id_solicitud' })
  solicitud: SolicitudAtencion;

  // Referencia logica al medico en users-service (sin FK fisica entre bases de datos)
  @Column({ name: 'id_medico' })
  id_medico: number;

  @CreateDateColumn({ name: 'fecha_hora_asignacion' })
  fecha_hora_asignacion: Date;

  @Column({ name: 'tiempo_respuesta_minutos', type: 'int', nullable: true })
  tiempo_respuesta_minutos?: number;
}

export class CreateAsignacionRecursoDto {
  @IsInt() id_solicitud: number;
  @IsInt() id_medico: number;
  @IsOptional() @IsInt() @Min(0) tiempo_respuesta_minutos?: number;
}

export class UpdateAsignacionRecursoDto {
  @IsOptional() @IsInt() @Min(0) tiempo_respuesta_minutos?: number;
}
