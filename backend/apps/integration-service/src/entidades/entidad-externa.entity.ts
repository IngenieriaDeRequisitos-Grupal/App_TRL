import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { LogInteroperabilidad } from '../logs/log-interoperabilidad.entity';

@Entity('entidades_externas')
export class EntidadExterna {
  @PrimaryGeneratedColumn({ name: 'id_entidad' })
  id: number;

  @Column({ name: 'nombre_entidad' })
  nombre_entidad: string;

  @Column({ name: 'tipo_entidad' })
  tipo_entidad: string;

  // Referencia a la credencial almacenada en un vault externo (nunca el secreto en claro)
  @Column({ name: 'api_key_referencia', nullable: true })
  api_key_referencia?: string;

  @OneToMany(() => LogInteroperabilidad, (log) => log.entidad)
  logs?: LogInteroperabilidad[];
}

export class CreateEntidadExternaDto {
  @IsNotEmpty() @IsString() nombre_entidad: string;
  @IsNotEmpty() @IsString() tipo_entidad: string;
  @IsOptional() @IsString() api_key_referencia?: string;
}

export class UpdateEntidadExternaDto {
  @IsOptional() @IsString() nombre_entidad?: string;
  @IsOptional() @IsString() tipo_entidad?: string;
  @IsOptional() @IsString() api_key_referencia?: string;
}
