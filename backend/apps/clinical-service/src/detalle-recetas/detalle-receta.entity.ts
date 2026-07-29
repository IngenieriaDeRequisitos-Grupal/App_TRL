import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { IsInt, IsNotEmpty, IsString } from 'class-validator';
import { aes256Transformer } from '@app/common';
import { RecetaMedica } from '../recetas/receta-medica.entity';

@Entity('detalle_recetas')
export class DetalleReceta {
  @PrimaryGeneratedColumn({ name: 'id_detalle' })
  id: number;

  @ManyToOne(() => RecetaMedica, (receta) => receta.detalles, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id_receta' })
  receta: RecetaMedica;

  // Cifrado AES-256: detalle de receta considerado dato clinico sensible
  @Column({ name: 'nombre_medicamento', type: 'text', transformer: aes256Transformer })
  nombre_medicamento: string;

  // Cifrado AES-256: detalle de receta considerado dato clinico sensible
  @Column({ name: 'dosis', type: 'text', transformer: aes256Transformer })
  dosis: string;

  // Cifrado AES-256: detalle de receta considerado dato clinico sensible
  @Column({ name: 'frecuencia', type: 'text', transformer: aes256Transformer })
  frecuencia: string;

  // Cifrado AES-256: detalle de receta considerado dato clinico sensible
  @Column({ name: 'duracion_tratamiento', type: 'text', nullable: true, transformer: aes256Transformer })
  duracion_tratamiento?: string;
}

export class CreateDetalleRecetaDto {
  @IsInt() id_receta: number;
  @IsNotEmpty() @IsString() nombre_medicamento: string;
  @IsNotEmpty() @IsString() dosis: string;
  @IsNotEmpty() @IsString() frecuencia: string;
  @IsString() duracion_tratamiento?: string;
}
