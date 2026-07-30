import { IsEmail, IsString, Length, MaxLength, MinLength } from 'class-validator';

export class LoginDto {
  @IsEmail() @MaxLength(254)
  correo_electronico: string;

  @IsString() @MinLength(1) @MaxLength(128)
  contrasena: string;
}

export class VerifyMfaDto {
  @IsString() @MinLength(20) @MaxLength(2048)
  mfa_ticket: string;

  @IsString() @Length(6, 6)
  codigo: string;
}
