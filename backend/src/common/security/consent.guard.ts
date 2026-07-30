import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Consentimiento } from '../../database/entities/trl.entities';
import { DecisionConsentimiento, TipoConsentimiento } from '../domain.enums';
import {
  CONSENT_NOT_REQUIRED_KEY,
  IS_PUBLIC_KEY,
  RequestPrincipal,
} from './security.decorators';

@Injectable()
export class ConsentGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly config: ConfigService,
    @InjectRepository(Consentimiento) private readonly consentimientos: Repository<Consentimiento>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const skip = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]) || this.reflector.getAllAndOverride<boolean>(CONSENT_NOT_REQUIRED_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (skip) return true;

    const request = context.switchToHttp().getRequest<{ user?: RequestPrincipal }>();
    if (!request.user) return true;
    const termsVersion = this.config.getOrThrow<string>('TERMS_VERSION');
    const privacyVersion = this.config.getOrThrow<string>('PRIVACY_NOTICE_VERSION');
    const accepted = await this.consentimientos
      .createQueryBuilder('c')
      .select('c.tipo', 'tipo')
      .addSelect('c.decision', 'decision')
      .addSelect('c.version_documento', 'version')
      .distinctOn(['c.tipo'])
      .where('c.id_usuario = :userId', { userId: request.user.id_usuario })
      .andWhere('c.tipo IN (:...types)', {
        types: [TipoConsentimiento.TERMINOS_USO, TipoConsentimiento.AVISO_PRIVACIDAD],
      })
      .orderBy('c.tipo', 'ASC')
      .addOrderBy('c.fecha_evento', 'DESC')
      .getRawMany<{ tipo: TipoConsentimiento; decision: DecisionConsentimiento; version: string }>();
    const hasTerms = accepted.some(
      (c) => c.tipo === TipoConsentimiento.TERMINOS_USO && c.decision === DecisionConsentimiento.ACEPTADO && c.version === termsVersion,
    );
    const hasPrivacy = accepted.some(
      (c) => c.tipo === TipoConsentimiento.AVISO_PRIVACIDAD && c.decision === DecisionConsentimiento.ACEPTADO && c.version === privacyVersion,
    );
    if (!hasTerms || !hasPrivacy) {
      throw new ForbiddenException({
        code: 'LEGAL_ACCEPTANCE_REQUIRED',
        message: 'Debe completar la aceptación legal vigente',
      });
    }
    return true;
  }
}
