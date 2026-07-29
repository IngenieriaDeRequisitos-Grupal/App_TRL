import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { Usuario } from '../usuarios/usuario.entity';

@Entity('auditoria_accesos')
export class AuditoriaAcceso {
  @PrimaryGeneratedColumn({ name: 'id_auditoria' })
  id: number;

  @ManyToOne(() => Usuario, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id_usuario' })
  usuario: Usuario;

  @Column({ name: 'accion_realizada' })
  accion_realizada: string;

  @Column({ name: 'tabla_afectada', nullable: true })
  tabla_afectada?: string;

  @Column({ name: 'direccion_ip', length: 45, nullable: true })
  direccion_ip?: string;

  @CreateDateColumn({ name: 'fecha_hora' })
  fecha_hora: Date;
}

export class CreateAuditoriaDto {
  @IsInt() id_usuario: number;
  @IsNotEmpty() @IsString() accion_realizada: string;
  @IsOptional() @IsString() tabla_afectada?: string;
  @IsOptional() @IsString() direccion_ip?: string;
}
