import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { IsInt, IsNotEmpty, IsString } from 'class-validator';
import { aes256Transformer } from '@app/common';
import { HistorialClinico } from '../historiales/historial-clinico.entity';
import { RecetaMedica } from '../recetas/receta-medica.entity';
import { OrdenExamen } from '../ordenes/orden-examen.entity';

@Entity('registros_evolucion')
export class RegistroEvolucion {
  @PrimaryGeneratedColumn({ name: 'id_registro' })
  id: number;

  @ManyToOne(() => HistorialClinico, (historial) => historial.registros, {
    eager: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'id_historial' })
  historial: HistorialClinico;

  // Referencia logica al medico en users-service (sin FK fisica entre bases de datos)
  @Column({ name: 'id_medico' })
  id_medico: number;

  @CreateDateColumn({ name: 'fecha_hora' })
  fecha_hora: Date;

  // Cifrado AES-256: dato clinico sensible
  @Column({ name: 'diagnostico_cifrado', type: 'text', transformer: aes256Transformer })
  diagnostico_cifrado: string;

  // Cifrado AES-256: dato clinico sensible
  @Column({ name: 'observaciones_cifradas', type: 'text', nullable: true, transformer: aes256Transformer })
  observaciones_cifradas?: string;

  @OneToMany(() => RecetaMedica, (receta) => receta.registro)
  recetas?: RecetaMedica[];

  @OneToMany(() => OrdenExamen, (orden) => orden.registro)
  ordenes?: OrdenExamen[];
}

export class CreateRegistroEvolucionDto {
  @IsInt() id_historial: number;
  @IsInt() id_medico: number;
  @IsNotEmpty() @IsString() diagnostico_cifrado: string;
  @IsString() observaciones_cifradas?: string;
}
