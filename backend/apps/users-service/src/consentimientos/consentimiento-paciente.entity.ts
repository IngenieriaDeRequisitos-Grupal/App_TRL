import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { IsInt, IsNotEmpty, IsString } from 'class-validator';
import { Paciente } from '../pacientes/paciente.entity';

@Entity('consentimientos_pacientes')
export class ConsentimientoPaciente {
  @PrimaryGeneratedColumn({ name: 'id_consentimiento' })
  id: number;

  @ManyToOne(() => Paciente, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id_paciente' })
  paciente: Paciente;

  @Column({ name: 'tipo_consentimiento' })
  tipo_consentimiento: string;

  @CreateDateColumn({ name: 'fecha_aceptacion' })
  fecha_aceptacion: Date;

  @Column({ name: 'version_terminos', length: 20 })
  version_terminos: string;
}

export class CreateConsentimientoDto {
  @IsInt() id_paciente: number;
  @IsNotEmpty() @IsString() tipo_consentimiento: string;
  @IsNotEmpty() @IsString() version_terminos: string;
}
