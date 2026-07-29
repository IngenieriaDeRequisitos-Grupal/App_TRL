import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { Usuario } from '../usuarios/usuario.entity';

@Entity('roles')
export class Rol {
  @PrimaryGeneratedColumn({ name: 'id_rol' })
  id: number;

  @Column({ name: 'nombre_rol', length: 50, unique: true })
  nombre_rol: string;

  @Column({ name: 'descripcion', type: 'text', nullable: true })
  descripcion?: string;

  @OneToMany(() => Usuario, (usuario) => usuario.rol)
  usuarios?: Usuario[];
}

export class CreateRolDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(50)
  nombre_rol: string;

  @IsOptional()
  @IsString()
  descripcion?: string;
}

export class UpdateRolDto {
  @IsOptional() @IsString() @MaxLength(50) nombre_rol?: string;
  @IsOptional() @IsString() descripcion?: string;
}
