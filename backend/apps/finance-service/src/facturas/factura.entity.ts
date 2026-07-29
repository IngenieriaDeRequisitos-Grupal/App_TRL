import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { IsEnum, IsInt, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { Pago } from '../pagos/pago.entity';

export enum EstadoPago {
  PENDIENTE = 'PENDIENTE',
  PAGADA = 'PAGADA',
  ANULADA = 'ANULADA',
  VENCIDA = 'VENCIDA',
}

@Entity('facturas')
export class Factura {
  @PrimaryGeneratedColumn({ name: 'id_factura' })
  id: number;

  // Referencias logicas a users-service y clinical-service (sin FK fisica entre bases de datos)
  @Column({ name: 'id_paciente' })
  id_paciente: number;

  @Column({ name: 'id_teleconsulta' })
  id_teleconsulta: number;

  @CreateDateColumn({ name: 'fecha_emision' })
  fecha_emision: Date;

  @Column({ name: 'subtotal', type: 'decimal', precision: 10, scale: 2 })
  subtotal: number;

  @Column({ name: 'impuestos', type: 'decimal', precision: 10, scale: 2, default: 0 })
  impuestos: number;

  @Column({ name: 'total', type: 'decimal', precision: 10, scale: 2 })
  total: number;

  @Column({ name: 'clave_acceso_sri', length: 49, nullable: true, unique: true })
  clave_acceso_sri?: string;

  @Column({ name: 'estado_pago', type: 'enum', enum: EstadoPago, default: EstadoPago.PENDIENTE })
  estado_pago: EstadoPago;

  @OneToMany(() => Pago, (pago) => pago.factura)
  pagos?: Pago[];
}

export class CreateFacturaDto {
  @IsInt() id_paciente: number;
  @IsInt() id_teleconsulta: number;
  @IsNumber() @Min(0) subtotal: number;
  @IsOptional() @IsNumber() @Min(0) impuestos?: number;
  @IsNumber() @Min(0) total: number;
  @IsOptional() @IsString() clave_acceso_sri?: string;
}

export class UpdateFacturaDto {
  @IsOptional() @IsEnum(EstadoPago) estado_pago?: EstadoPago;
}
