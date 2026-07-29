import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { IsInt, IsNotEmpty, IsString } from 'class-validator';
import { aes256Transformer } from '@app/common';
import { RegistroEvolucion } from '../registros/registro-evolucion.entity';

@Entity('ordenes_examenes')
export class OrdenExamen {
  @PrimaryGeneratedColumn({ name: 'id_orden' })
  id: number;

  @ManyToOne(() => RegistroEvolucion, (registro) => registro.ordenes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id_registro' })
  registro: RegistroEvolucion;

  @Column({ name: 'tipo_examen' })
  tipo_examen: string;

  // Cifrado AES-256: puede contener informacion clinica sensible del paciente
  @Column({ name: 'indicaciones', type: 'text', nullable: true, transformer: aes256Transformer })
  indicaciones?: string;

  @CreateDateColumn({ name: 'fecha_emision' })
  fecha_emision: Date;
}

export class CreateOrdenExamenDto {
  @IsInt() id_registro: number;
  @IsNotEmpty() @IsString() tipo_examen: string;
  @IsString() indicaciones?: string;
}
