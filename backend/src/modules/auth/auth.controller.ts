import { Body, Controller, Post, Req } from '@nestjs/common';
import { Request } from 'express';
import { Throttle } from '@nestjs/throttler';
import {
  ConsentNotRequired,
  CurrentUser,
  Public,
  RequestPrincipal,
} from '../../common/security/security.decorators';
import { LoginDto, VerifyMfaDto } from './auth.dto';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto);
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('mfa/verify')
  verifyMfa(@Body() dto: VerifyMfaDto, @Req() request: Request) {
    return this.auth.verifyMfa(dto, request.ip || request.socket.remoteAddress || 'unknown');
  }

  @ConsentNotRequired()
  @Post('logout')
  logout(@CurrentUser() user: RequestPrincipal) {
    return this.auth.logout(user.id_sesion);
  }
}
