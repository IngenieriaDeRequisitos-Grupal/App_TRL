import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { IsEnum, IsOptional } from 'class-validator';
import { LecturaSignoVital } from '../lecturas/lectura-signo-vital.entity';

export enum NivelGravedad {
  LEVE = 'LEVE',
  MODERADA = 'MODERADA',
  GRAVE = 'GRAVE',
  CRITICA = 'CRITICA',
}

export enum EstadoAtencion {
  PENDIENTE = 'PENDIENTE',
  ATENDIDA = 'ATENDIDA',
  DESCARTADA = 'DESCARTADA',
}

@Entity('alertas_medicas')
export class AlertaMedica {
  @PrimaryGeneratedColumn({ name: 'id_alerta' })
  id: number;

  // Referencia logica al paciente en users-service (sin FK fisica entre bases de datos)
  @Column({ name: 'id_paciente' })
  id_paciente: number;

  @ManyToOne(() => LecturaSignoVital, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id_lectura' })
  lectura: LecturaSignoVital;

  @Column({ name: 'tipo_alerta' })
  tipo_alerta: string;

  @Column({ name: 'nivel_gravedad', type: 'enum', enum: NivelGravedad })
  nivel_gravedad: NivelGravedad;

  @CreateDateColumn({ name: 'fecha_hora_emision' })
  fecha_hora_emision: Date;

  @Column({ name: 'estado_atencion', type: 'enum', enum: EstadoAtencion, default: EstadoAtencion.PENDIENTE })
  estado_atencion: EstadoAtencion;
}

export class UpdateAlertaMedicaDto {
  @IsOptional() @IsEnum(EstadoAtencion) estado_atencion?: EstadoAtencion;
}
