import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { authenticator } from 'otplib';
import { Repository } from 'typeorm';
import { EstadoUsuario } from '../../common/domain.enums';
import { CryptoService } from '../../common/security/crypto.service';
import { Mfa, Sesion, Usuario } from '../../database/entities/trl.entities';
import { LoginDto, VerifyMfaDto } from './auth.dto';

const DUMMY_BCRYPT_HASH = '$2b$12$C6UzMDM.H6dfI/f/IKcEe.5jUQnQvYQF2zHujdM0BjeM9RV6h1wW.';
const MAX_FAILED_ATTEMPTS = 3;
const LOCK_MINUTES = 15;

interface MfaPayload {
  sub: string;
  sid: string;
  sv: number;
  purpose: 'mfa';
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly crypto: CryptoService,
    @InjectRepository(Usuario) private readonly users: Repository<Usuario>,
    @InjectRepository(Sesion) private readonly sessions: Repository<Sesion>,
    @InjectRepository(Mfa) private readonly mfaRepository: Repository<Mfa>,
  ) {
    authenticator.options = { step: 30, window: 1 };
  }

  async login(dto: LoginDto): Promise<{ mfa_ticket: string; expires_in: number }> {
    const email = dto.correo_electronico.trim().toLowerCase();
    const user = await this.users
      .createQueryBuilder('user')
      .addSelect(['user.hash_contrasena', 'user.intentos_login_fallidos', 'user.bloqueado_hasta'])
      .leftJoinAndSelect('user.rol', 'rol')
      .leftJoinAndSelect('user.sesion', 'sesion')
      .leftJoinAndSelect('sesion.mfa', 'mfa')
      .addSelect('mfa.codigo_totp')
      .where('user.correo_electronico = :email', { email })
      .getOne();

    if (!user) {
      await bcrypt.compare(dto.contrasena, DUMMY_BCRYPT_HASH);
      throw new UnauthorizedException('Credenciales inválidas');
    }
    await this.ensureAccountAvailable(user);
    const passwordValid = await bcrypt.compare(
      `${dto.contrasena}${this.config.getOrThrow<string>('PASSWORD_PEPPER')}`,
      user.hash_contrasena,
    );
    if (!passwordValid) {
      await this.registerFailedLogin(user);
      throw new UnauthorizedException('Credenciales inválidas');
    }
    if (!user.sesion?.mfa) throw new UnauthorizedException('MFA no está aprovisionado');
    user.intentos_login_fallidos = 0;
    user.bloqueado_hasta = null;
    await this.users.save(user);
    this.logDevelopmentOtp(user.sesion);

    const ttl = Number(this.config.get('JWT_MFA_TTL_SECONDS') ?? 300);
    const payload: MfaPayload = {
      sub: user.id_usuario,
      sid: user.sesion.id_sesion,
      sv: user.version_sesion,
      purpose: 'mfa',
    };
    return {
      mfa_ticket: await this.jwt.signAsync(payload, this.signOptions(ttl)),
      expires_in: ttl,
    };
  }

  async verifyMfa(dto: VerifyMfaDto, ipAddress: string): Promise<{ access_token: string; token_type: 'Bearer'; expires_in: number }> {
    let payload: MfaPayload;
    try {
      payload = await this.jwt.verifyAsync<MfaPayload>(dto.mfa_ticket, this.verifyOptions());
      if (payload.purpose !== 'mfa') throw new Error('invalid-purpose');
    } catch {
      throw new UnauthorizedException('Desafío MFA inválido o expirado');
    }

    const session = await this.sessions
      .createQueryBuilder('session')
      .leftJoinAndSelect('session.usuario', 'user')
      .leftJoinAndSelect('user.rol', 'rol')
      .leftJoinAndSelect('session.mfa', 'mfa')
      .addSelect('mfa.codigo_totp')
      .where('session.id_sesion = :sid', { sid: payload.sid })
      .getOne();
    if (!session?.mfa || session.usuario.id_usuario !== payload.sub || session.usuario.version_sesion !== payload.sv) {
      throw new UnauthorizedException('Desafío MFA inválido');
    }
    if (session.mfa.intentos_fallidos >= MAX_FAILED_ATTEMPTS) {
      throw new UnauthorizedException('MFA temporalmente bloqueado');
    }
    const secret = this.crypto.decryptText(session.mfa.codigo_totp, `mfa:${session.id_sesion}`);
    if (!authenticator.check(dto.codigo, secret)) {
      session.mfa.intentos_fallidos += 1;
      await this.mfaRepository.save(session.mfa);
      if (session.mfa.intentos_fallidos >= MAX_FAILED_ATTEMPTS) {
        session.usuario.estado = EstadoUsuario.BLOQUEADO;
        session.usuario.bloqueado_hasta = new Date(Date.now() + LOCK_MINUTES * 60_000);
        await this.users.save(session.usuario);
      }
      throw new UnauthorizedException('Código MFA inválido');
    }
    session.mfa.intentos_fallidos = 0;
    await this.mfaRepository.save(session.mfa);

    const ttl = Number(this.config.get('JWT_ACCESS_TTL_SECONDS') ?? 3600);
    const accessToken = await this.jwt.signAsync(
      {
        sub: session.usuario.id_usuario,
        sid: session.id_sesion,
        sv: session.usuario.version_sesion,
        email: session.usuario.correo_electronico,
        role: session.usuario.rol.nombre_rol,
        purpose: 'access',
      },
      this.signOptions(ttl),
    );
    session.token_jwt = this.crypto.sha256(accessToken);
    session.direccion_ip = this.crypto.hmac(ipAddress);
    session.fecha_expiracion = new Date(Date.now() + ttl * 1000);
    session.revocada = false;
    await this.sessions.save(session);
    return { access_token: accessToken, token_type: 'Bearer', expires_in: ttl };
  }

  async logout(sessionId: string): Promise<{ success: true }> {
    await this.sessions.update(
      { id_sesion: sessionId },
      { token_jwt: null, revocada: true, fecha_expiracion: new Date() },
    );
    return { success: true };
  }

  private async ensureAccountAvailable(user: Usuario): Promise<void> {
    if (user.estado === EstadoUsuario.SUSPENDIDO) throw new UnauthorizedException('Cuenta no disponible');
    if (user.estado === EstadoUsuario.BLOQUEADO) {
      if (!user.bloqueado_hasta || user.bloqueado_hasta > new Date()) {
        throw new UnauthorizedException('Cuenta temporalmente bloqueada');
      }
      user.estado = EstadoUsuario.ACTIVO;
      user.bloqueado_hasta = null;
      user.intentos_login_fallidos = 0;
      await this.users.save(user);
    }
  }

  private async registerFailedLogin(user: Usuario): Promise<void> {
    user.intentos_login_fallidos += 1;
    if (user.intentos_login_fallidos >= MAX_FAILED_ATTEMPTS) {
      user.estado = EstadoUsuario.BLOQUEADO;
      user.bloqueado_hasta = new Date(Date.now() + LOCK_MINUTES * 60_000);
    }
    await this.users.save(user);
  }

  private logDevelopmentOtp(session: Sesion): void {
    const enabled = String(this.config.get('MFA_CONSOLE_OUTPUT') ?? 'false').toLowerCase() === 'true';
    if (!enabled || this.config.get('NODE_ENV') === 'production' || !session.mfa?.codigo_totp) return;
    try {
      const secret = this.crypto.decryptText(session.mfa.codigo_totp, `mfa:${session.id_sesion}`);
      const code = authenticator.generate(secret);
      const remainingSeconds = 30 - (Math.floor(Date.now() / 1000) % 30);
      // SECURITY: salida de conveniencia limitada a desarrollo; jamás habilitar MFA_CONSOLE_OUTPUT en producción.
      this.logger.warn(`[DEV MFA] codigo=${code} expira_en=${remainingSeconds}s`);
    } catch {
      this.logger.warn('[DEV MFA] no fue posible generar el código temporal');
    }
  }

  private signOptions(expiresIn: number) {
    return {
      secret: this.config.getOrThrow<string>('JWT_SECRET'),
      algorithm: 'HS256' as const,
      issuer: this.config.getOrThrow<string>('JWT_ISSUER'),
      audience: this.config.getOrThrow<string>('JWT_AUDIENCE'),
      expiresIn,
    };
  }

  private verifyOptions() {
    return {
      secret: this.config.getOrThrow<string>('JWT_SECRET'),
      algorithms: ['HS256' as const],
      issuer: this.config.getOrThrow<string>('JWT_ISSUER'),
      audience: this.config.getOrThrow<string>('JWT_AUDIENCE'),
    };
  }
}
