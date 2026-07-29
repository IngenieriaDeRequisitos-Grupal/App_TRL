import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { IsInt, IsNotEmpty, IsString } from 'class-validator';
import { EntidadExterna } from '../entidades/entidad-externa.entity';

@Entity('logs_interoperabilidad')
export class LogInteroperabilidad {
  @PrimaryGeneratedColumn({ name: 'id_log' })
  id: number;

  @ManyToOne(() => EntidadExterna, (entidad) => entidad.logs, {
    eager: true,
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'id_entidad' })
  entidad?: EntidadExterna;

  @Column({ name: 'tipo_transaccion' })
  tipo_transaccion: string;

  @CreateDateColumn({ name: 'fecha_hora' })
  fecha_hora: Date;

  @Column({ name: 'estado_respuesta_api' })
  estado_respuesta_api: string;
}

export class CreateLogInteroperabilidadDto {
  @IsInt() id_entidad: number;
  @IsNotEmpty() @IsString() tipo_transaccion: string;
  @IsNotEmpty() @IsString() estado_respuesta_api: string;
}
