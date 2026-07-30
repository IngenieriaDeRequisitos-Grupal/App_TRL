import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Request } from 'express';
import { Repository } from 'typeorm';
import { EstadoUsuario, NombreRol } from '../domain.enums';
import { Sesion } from '../../database/entities/trl.entities';
import { CryptoService } from './crypto.service';
import { IS_PUBLIC_KEY, RequestPrincipal } from './security.decorators';

interface AccessPayload {
  sub: string;
  sid: string;
  sv: number;
  email: string;
  role: NombreRol;
  purpose: 'access';
}

@Injectable()
export class JwtSessionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly crypto: CryptoService,
    @InjectRepository(Sesion) private readonly sessions: Repository<Sesion>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<Request & { user?: RequestPrincipal }>();
    const token = this.extractBearer(request);
    try {
      const payload = await this.jwt.verifyAsync<AccessPayload>(token, {
        secret: this.config.getOrThrow<string>('JWT_SECRET'),
        algorithms: ['HS256'],
        issuer: this.config.getOrThrow<string>('JWT_ISSUER'),
        audience: this.config.getOrThrow<string>('JWT_AUDIENCE'),
      });
      if (payload.purpose !== 'access') throw new UnauthorizedException();

      const session = await this.sessions
        .createQueryBuilder('session')
        .addSelect('session.token_jwt')
        .leftJoinAndSelect('session.usuario', 'usuario')
        .leftJoinAndSelect('usuario.rol', 'rol')
        .where('session.id_sesion = :sid', { sid: payload.sid })
        .getOne();
      if (
        !session ||
        !session.token_jwt ||
        session.revocada ||
        !session.fecha_expiracion ||
        session.fecha_expiracion <= new Date() ||
        session.usuario.id_usuario !== payload.sub ||
        session.usuario.estado !== EstadoUsuario.ACTIVO ||
        session.usuario.version_sesion !== payload.sv ||
        session.token_jwt !== this.crypto.sha256(token)
      ) {
        throw new UnauthorizedException();
      }

      request.user = {
        id_usuario: session.usuario.id_usuario,
        id_sesion: session.id_sesion,
        correo_electronico: session.usuario.correo_electronico,
        rol: session.usuario.rol.nombre_rol,
        version_sesion: session.usuario.version_sesion,
      };
      return true;
    } catch {
      throw new UnauthorizedException('Sesión inválida o expirada');
    }
  }

  private extractBearer(request: Request): string {
    const [scheme, token] = request.headers.authorization?.split(' ') ?? [];
    if (scheme !== 'Bearer' || !token) throw new UnauthorizedException('Token requerido');
    return token;
  }
}
