import { Body, Controller, Inject, Injectable, Module, Post } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { JwtService } from '@nestjs/jwt';
import { firstValueFrom } from 'rxjs';
import { IsEmail, IsString, MinLength } from 'class-validator';
import { USERS_CLIENT } from '../clients.constants';
import { Public } from '../common/decorators/public.decorator';

export class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(1)
  password: string;
}

@Injectable()
export class AuthService {
  constructor(
    @Inject(USERS_CLIENT) private readonly usersClient: ClientProxy,
    private readonly jwtService: JwtService,
  ) {}

  async login(dto: LoginDto) {
    const usuario = await firstValueFrom(this.usersClient.send('usuarios.validateCredentials', dto));
    const payload = { sub: usuario.id, email: usuario.email, rol: usuario.rol?.nombre_rol };
    return {
      access_token: this.jwtService.sign(payload),
      usuario,
    };
  }
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }
}

@Module({
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
