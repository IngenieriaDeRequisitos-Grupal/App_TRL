import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { IsInt, IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';
import { Factura } from '../facturas/factura.entity';

@Entity('pagos')
export class Pago {
  @PrimaryGeneratedColumn({ name: 'id_pago' })
  id: number;

  @ManyToOne(() => Factura, (factura) => factura.pagos, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id_factura' })
  factura: Factura;

  @Column({ name: 'metodo_pago' })
  metodo_pago: string;

  @Column({ name: 'referencia_pasarela', nullable: true })
  referencia_pasarela?: string;

  @CreateDateColumn({ name: 'fecha_pago' })
  fecha_pago: Date;

  @Column({ name: 'monto_pagado', type: 'decimal', precision: 10, scale: 2 })
  monto_pagado: number;
}

export class CreatePagoDto {
  @IsInt() id_factura: number;
  @IsNotEmpty() @IsString() metodo_pago: string;
  @IsString() referencia_pasarela?: string;
  @IsNumber() @Min(0.01) monto_pagado: number;
}
