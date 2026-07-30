import { Type } from 'class-transformer';
import {
  IsEmail,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { EstadoUsuario, NombreRol } from '../../common/domain.enums';

export class CreateUsuarioDto {
  @IsString() @MinLength(3) @MaxLength(160)
  nombre_completo: string;

  @IsString() @Matches(/^\d{8,20}$/)
  cedula: string;

  @IsEmail() @MaxLength(254)
  correo_electronico: string;

  @IsString() @MinLength(12) @MaxLength(128)
  contrasena: string;

  @IsEnum(NombreRol)
  rol: NombreRol;

  @ValidateIf((dto: CreateUsuarioDto) => dto.rol === NombreRol.EVALUADOR)
  @IsString() @MinLength(2) @MaxLength(120)
  especialidad_tecnica?: string;

  @ValidateIf((dto: CreateUsuarioDto) => [NombreRol.EVALUADOR, NombreRol.GESTOR_IDI].includes(dto.rol))
  @IsString() @MinLength(2) @MaxLength(120)
  departamento?: string;
}

export class UpdateUsuarioAccessDto {
  @IsOptional() @IsEnum(NombreRol)
  rol?: NombreRol;

  @IsOptional() @IsEnum(EstadoUsuario)
  estado?: EstadoUsuario;
}

export class ListQueryDto {
  @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  page = 1;

  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100)
  limit = 25;
}
