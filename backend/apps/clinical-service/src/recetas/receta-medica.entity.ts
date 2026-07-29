import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { IsEnum, IsInt, IsOptional } from 'class-validator';
import { RegistroEvolucion } from '../registros/registro-evolucion.entity';
import { DetalleReceta } from '../detalle-recetas/detalle-receta.entity';

export enum EstadoValidezReceta {
  VALIDA = 'VALIDA',
  USADA = 'USADA',
  ANULADA = 'ANULADA',
  EXPIRADA = 'EXPIRADA',
}

@Entity('recetas_medicas')
export class RecetaMedica {
  @PrimaryGeneratedColumn({ name: 'id_receta' })
  id: number;

  @ManyToOne(() => RegistroEvolucion, (registro) => registro.recetas, {
    eager: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'id_registro' })
  registro: RegistroEvolucion;

  // Referencia logica al medico en users-service (sin FK fisica entre bases de datos)
  @Column({ name: 'id_medico' })
  id_medico: number;

  @CreateDateColumn({ name: 'fecha_emision' })
  fecha_emision: Date;

  @Column({ name: 'codigo_qr_criptografico', unique: true })
  codigo_qr_criptografico: string;

  @Column({
    name: 'estado_validez',
    type: 'enum',
    enum: EstadoValidezReceta,
    default: EstadoValidezReceta.VALIDA,
  })
  estado_validez: EstadoValidezReceta;

  @OneToMany(() => DetalleReceta, (detalle) => detalle.receta, { cascade: true })
  detalles?: DetalleReceta[];
}

export class CreateRecetaMedicaDto {
  @IsInt() id_registro: number;
  @IsInt() id_medico: number;
}

export class UpdateRecetaMedicaDto {
  @IsOptional() @IsEnum(EstadoValidezReceta) estado_validez?: EstadoValidezReceta;
}
