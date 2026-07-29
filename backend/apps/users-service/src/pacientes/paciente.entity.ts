import { Column, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { IsDateString, IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { Usuario } from '../usuarios/usuario.entity';

@Entity('pacientes')
export class Paciente {
  @PrimaryGeneratedColumn({ name: 'id_paciente' })
  id: number;

  @OneToOne(() => Usuario, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id_usuario' })
  usuario: Usuario;

  @Column({ name: 'cedula', length: 20, unique: true })
  cedula: string;

  @Column({ name: 'nombres' })
  nombres: string;

  @Column({ name: 'apellidos' })
  apellidos: string;

  @Column({ name: 'fecha_nacimiento', type: 'date' })
  fecha_nacimiento: string;

  @Column({ name: 'telefono', length: 20, nullable: true })
  telefono?: string;

  @Column({ name: 'direccion', type: 'text', nullable: true })
  direccion?: string;

  @Column({ name: 'contacto_emergencia', nullable: true })
  contacto_emergencia?: string;
}

export class CreatePacienteDto {
  @IsInt() id_usuario: number;
  @IsNotEmpty() @IsString() cedula: string;
  @IsNotEmpty() @IsString() nombres: string;
  @IsNotEmpty() @IsString() apellidos: string;
  @IsDateString() fecha_nacimiento: string;
  @IsOptional() @IsString() telefono?: string;
  @IsOptional() @IsString() direccion?: string;
  @IsOptional() @IsString() contacto_emergencia?: string;
}

export class UpdatePacienteDto {
  @IsOptional() @IsString() cedula?: string;
  @IsOptional() @IsString() nombres?: string;
  @IsOptional() @IsString() apellidos?: string;
  @IsOptional() @IsDateString() fecha_nacimiento?: string;
  @IsOptional() @IsString() telefono?: string;
  @IsOptional() @IsString() direccion?: string;
  @IsOptional() @IsString() contacto_emergencia?: string;
}
