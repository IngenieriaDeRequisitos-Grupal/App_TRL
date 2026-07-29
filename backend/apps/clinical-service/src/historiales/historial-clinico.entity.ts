import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { IsInt, IsOptional, IsString } from 'class-validator';
import { aes256Transformer } from '@app/common';
import { RegistroEvolucion } from '../registros/registro-evolucion.entity';

@Entity('historiales_clinicos')
export class HistorialClinico {
  @PrimaryGeneratedColumn({ name: 'id_historial' })
  id: number;

  // Referencia logica al paciente en users-service (sin FK fisica entre bases de datos)
  @Column({ name: 'id_paciente', unique: true })
  id_paciente: number;

  // Cifrado AES-256: dato clinico sensible
  @Column({ name: 'antecedentes_familiares', type: 'text', nullable: true, transformer: aes256Transformer })
  antecedentes_familiares?: string;

  // Cifrado AES-256: dato clinico sensible
  @Column({ name: 'alergias', type: 'text', nullable: true, transformer: aes256Transformer })
  alergias?: string;

  @Column({ name: 'tipo_sangre', length: 5, nullable: true })
  tipo_sangre?: string;

  // Cifrado AES-256: dato clinico sensible
  @Column({ name: 'condiciones_cronicas', type: 'text', nullable: true, transformer: aes256Transformer })
  condiciones_cronicas?: string;

  @OneToMany(() => RegistroEvolucion, (registro) => registro.historial)
  registros?: RegistroEvolucion[];
}

export class CreateHistorialClinicoDto {
  @IsInt() id_paciente: number;
  @IsOptional() @IsString() antecedentes_familiares?: string;
  @IsOptional() @IsString() alergias?: string;
  @IsOptional() @IsString() tipo_sangre?: string;
  @IsOptional() @IsString() condiciones_cronicas?: string;
}

export class UpdateHistorialClinicoDto {
  @IsOptional() @IsString() antecedentes_familiares?: string;
  @IsOptional() @IsString() alergias?: string;
  @IsOptional() @IsString() tipo_sangre?: string;
  @IsOptional() @IsString() condiciones_cronicas?: string;
}
