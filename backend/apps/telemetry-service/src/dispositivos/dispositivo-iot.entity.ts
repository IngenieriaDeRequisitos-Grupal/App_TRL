import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { LecturaSignoVital } from '../lecturas/lectura-signo-vital.entity';

export enum EstadoConexion {
  CONECTADO = 'CONECTADO',
  DESCONECTADO = 'DESCONECTADO',
  ERROR = 'ERROR',
}

@Entity('dispositivos_iot')
export class DispositivoIoT {
  @PrimaryGeneratedColumn({ name: 'id_dispositivo' })
  id: number;

  // Referencia logica al paciente en users-service (sin FK fisica entre bases de datos)
  @Column({ name: 'id_paciente' })
  id_paciente: number;

  @Column({ name: 'tipo_dispositivo' })
  tipo_dispositivo: string;

  @Column({ name: 'modelo', nullable: true })
  modelo?: string;

  @Column({ name: 'numero_serie', unique: true })
  numero_serie: string;

  @Column({ name: 'estado_conexion', type: 'enum', enum: EstadoConexion, default: EstadoConexion.DESCONECTADO })
  estado_conexion: EstadoConexion;

  @OneToMany(() => LecturaSignoVital, (lectura) => lectura.dispositivo)
  lecturas?: LecturaSignoVital[];
}

export class CreateDispositivoIoTDto {
  @IsInt() id_paciente: number;
  @IsNotEmpty() @IsString() tipo_dispositivo: string;
  @IsOptional() @IsString() modelo?: string;
  @IsNotEmpty() @IsString() numero_serie: string;
  @IsOptional() @IsEnum(EstadoConexion) estado_conexion?: EstadoConexion;
}

export class UpdateDispositivoIoTDto {
  @IsOptional() @IsString() modelo?: string;
  @IsOptional() @IsEnum(EstadoConexion) estado_conexion?: EstadoConexion;
}
