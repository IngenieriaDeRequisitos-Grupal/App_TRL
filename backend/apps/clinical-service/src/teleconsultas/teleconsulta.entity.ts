import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { IsInt, IsNotEmpty, IsOptional, IsString, IsUrl } from 'class-validator';
import { aes256Transformer } from '@app/common';

@Entity('teleconsultas')
export class Teleconsulta {
  @PrimaryGeneratedColumn({ name: 'id_teleconsulta' })
  id: number;

  // Referencias logicas a requests-service y users-service (sin FK fisica)
  @Column({ name: 'id_solicitud' })
  id_solicitud: number;

  @Column({ name: 'id_medico' })
  id_medico: number;

  @Column({ name: 'fecha_hora_inicio', type: 'timestamp', nullable: true })
  fecha_hora_inicio?: Date;

  @Column({ name: 'fecha_hora_fin', type: 'timestamp', nullable: true })
  fecha_hora_fin?: Date;

  @Column({ name: 'url_conexion_segura', nullable: true })
  url_conexion_segura?: string;

  // Cifrado AES-256: puede contener informacion clinica sensible del paciente
  @Column({ name: 'notas_internas', type: 'text', nullable: true, transformer: aes256Transformer })
  notas_internas?: string;
}

export class CreateTeleconsultaDto {
  @IsInt() id_solicitud: number;
  @IsInt() id_medico: number;
  @IsOptional() @IsUrl({ require_tld: false }) url_conexion_segura?: string;
  @IsOptional() @IsString() notas_internas?: string;
}

export class UpdateTeleconsultaDto {
  @IsOptional() @IsString() notas_internas?: string;
}

export class FinalizarTeleconsultaDto {
  @IsNotEmpty()
  id: number;
}
