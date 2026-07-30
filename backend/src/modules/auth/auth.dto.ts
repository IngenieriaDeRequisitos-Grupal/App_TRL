import { IsEmail, IsString, Length, Matches, MaxLength, MinLength } from 'class-validator';

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

export class RegisterInvestigatorDto {
  @IsString() @MinLength(3) @MaxLength(160)
  nombre_completo: string;

  @IsString() @Matches(/^\d{8,20}$/)
  cedula: string;

  @IsEmail() @MaxLength(254)
  correo_electronico: string;

  @IsString()
  @MinLength(12)
  @MaxLength(128)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/, {
    message: 'La contraseña debe incluir mayúscula, minúscula, número y símbolo',
  })
  contrasena: string;
}
