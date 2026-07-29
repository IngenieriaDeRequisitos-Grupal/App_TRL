import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { IsEmail, IsEnum, IsInt, IsOptional, IsString, MinLength } from 'class-validator';
import { Rol } from '../roles/rol.entity';

export enum EstadoCuenta {
  ACTIVA = 'ACTIVA',
  INACTIVA = 'INACTIVA',
  SUSPENDIDA = 'SUSPENDIDA',
}

@Entity('usuarios')
export class Usuario {
  @PrimaryGeneratedColumn({ name: 'id_usuario' })
  id: number;

  @ManyToOne(() => Rol, (rol) => rol.usuarios, { eager: true, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'id_rol' })
  rol: Rol;

  @Column({ name: 'email', unique: true })
  email: string;

  @Column({ name: 'password_hash' })
  password_hash: string;

  @Column({ name: 'estado_cuenta', type: 'enum', enum: EstadoCuenta, default: EstadoCuenta.ACTIVA })
  estado_cuenta: EstadoCuenta;

  @CreateDateColumn({ name: 'fecha_registro' })
  fecha_registro: Date;
}

export class CreateUsuarioDto {
  @IsInt()
  id_rol: number;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsOptional()
  @IsEnum(EstadoCuenta)
  estado_cuenta?: EstadoCuenta;
}

export class UpdateUsuarioDto {
  @IsOptional() @IsInt() id_rol?: number;
  @IsOptional() @IsEmail() email?: string;
  @IsOptional() @IsString() @MinLength(8) password?: string;
  @IsOptional() @IsEnum(EstadoCuenta) estado_cuenta?: EstadoCuenta;
}

export class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(1)
  password: string;
}
