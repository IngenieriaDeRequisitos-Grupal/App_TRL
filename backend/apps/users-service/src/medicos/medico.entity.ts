import { Column, Entity, JoinColumn, ManyToOne, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { IsBoolean, IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { Usuario } from '../usuarios/usuario.entity';
import { CentroMedico } from '../centros-medicos/centro-medico.entity';

@Entity('medicos')
export class Medico {
  @PrimaryGeneratedColumn({ name: 'id_medico' })
  id: number;

  @OneToOne(() => Usuario, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id_usuario' })
  usuario: Usuario;

  @ManyToOne(() => CentroMedico, (centro) => centro.medicos, {
    eager: true,
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'id_centro' })
  centro?: CentroMedico;

  @Column({ name: 'nombres' })
  nombres: string;

  @Column({ name: 'apellidos' })
  apellidos: string;

  @Column({ name: 'especialidad' })
  especialidad: string;

  @Column({ name: 'licencia_medica', unique: true })
  licencia_medica: string;

  @Column({ name: 'disponibilidad_actual', type: 'boolean', default: true })
  disponibilidad_actual: boolean;
}

export class CreateMedicoDto {
  @IsInt() id_usuario: number;
  @IsOptional() @IsInt() id_centro?: number;
  @IsNotEmpty() @IsString() nombres: string;
  @IsNotEmpty() @IsString() apellidos: string;
  @IsNotEmpty() @IsString() especialidad: string;
  @IsNotEmpty() @IsString() licencia_medica: string;
  @IsOptional() @IsBoolean() disponibilidad_actual?: boolean;
}

export class UpdateMedicoDto {
  @IsOptional() @IsInt() id_centro?: number;
  @IsOptional() @IsString() nombres?: string;
  @IsOptional() @IsString() apellidos?: string;
  @IsOptional() @IsString() especialidad?: string;
  @IsOptional() @IsString() licencia_medica?: string;
  @IsOptional() @IsBoolean() disponibilidad_actual?: boolean;
}
