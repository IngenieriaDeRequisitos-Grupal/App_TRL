import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';
import { Medico } from '../medicos/medico.entity';

@Entity('centros_medicos')
export class CentroMedico {
  @PrimaryGeneratedColumn({ name: 'id_centro' })
  id: number;

  @Column({ name: 'nombre' })
  nombre: string;

  @Column({ name: 'direccion', type: 'text', nullable: true })
  direccion?: string;

  @Column({ name: 'telefono', length: 20, nullable: true })
  telefono?: string;

  @Column({ name: 'capacidad_atencion', type: 'int', default: 0 })
  capacidad_atencion: number;

  @OneToMany(() => Medico, (medico) => medico.centro)
  medicos?: Medico[];
}

export class CreateCentroMedicoDto {
  @IsNotEmpty() @IsString() nombre: string;
  @IsOptional() @IsString() direccion?: string;
  @IsOptional() @IsString() telefono?: string;
  @IsOptional() @IsInt() @Min(0) capacidad_atencion?: number;
}

export class UpdateCentroMedicoDto {
  @IsOptional() @IsString() nombre?: string;
  @IsOptional() @IsString() direccion?: string;
  @IsOptional() @IsString() telefono?: string;
  @IsOptional() @IsInt() @Min(0) capacidad_atencion?: number;
}
