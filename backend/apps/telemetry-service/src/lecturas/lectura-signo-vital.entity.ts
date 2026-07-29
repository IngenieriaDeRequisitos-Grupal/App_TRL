import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { IsInt, IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { DispositivoIoT } from '../dispositivos/dispositivo-iot.entity';

@Entity('lecturas_signos_vitales')
export class LecturaSignoVital {
  @PrimaryGeneratedColumn({ name: 'id_lectura' })
  id: number;

  @ManyToOne(() => DispositivoIoT, (dispositivo) => dispositivo.lecturas, {
    eager: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'id_dispositivo' })
  dispositivo: DispositivoIoT;

  @Column({ name: 'tipo_medicion' })
  tipo_medicion: string;

  @Column({ name: 'valor', type: 'float' })
  valor: number;

  @Column({ name: 'unidad', length: 20 })
  unidad: string;

  @CreateDateColumn({ name: 'fecha_hora' })
  fecha_hora: Date;
}

export class CreateLecturaSignoVitalDto {
  @IsInt() id_dispositivo: number;
  @IsNotEmpty() @IsString() tipo_medicion: string;
  @IsNumber() valor: number;
  @IsNotEmpty() @IsString() unidad: string;
}
