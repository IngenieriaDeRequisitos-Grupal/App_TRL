import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  DecisionConsentimiento,
  TipoConsentimiento,
} from '../../common/domain.enums';
import { CryptoService } from '../../common/security/crypto.service';
import { Consentimiento, Usuario } from '../../database/entities/trl.entities';
import { RegisterLegalDecisionDto, WithdrawOptionalConsentDto } from './consent.dto';
import { PRIVACY_NOTICE_TEXT, TERMS_TEXT } from './legal-texts';

@Injectable()
export class ConsentService {
  constructor(
    private readonly config: ConfigService,
    private readonly crypto: CryptoService,
    @InjectRepository(Consentimiento) private readonly events: Repository<Consentimiento>,
  ) {}

  current() {
    return [
      this.documentMetadata(TipoConsentimiento.TERMINOS_USO),
      this.documentMetadata(TipoConsentimiento.AVISO_PRIVACIDAD),
    ];
  }

  async status(userId: string) {
    const documents = this.current();
    return Promise.all(documents.map(async (document) => ({
      ...document,
      aceptado: await this.events.exists({
        where: {
          usuario: { id_usuario: userId },
          tipo: document.tipo,
          version_documento: document.version,
          decision: DecisionConsentimiento.ACEPTADO,
        },
      }),
    })));
  }

  async register(userId: string, dto: RegisterLegalDecisionDto, ip: string): Promise<Consentimiento> {
    if (dto.tipo === TipoConsentimiento.FINALIDAD_OPCIONAL) {
      throw new BadRequestException('Use el flujo específico de finalidades opcionales');
    }
    if (dto.decision !== DecisionConsentimiento.ACEPTADO) {
      throw new BadRequestException('Los términos y el aviso solo registran aceptación/acuse; no consentimiento opcional');
    }
    const document = this.documentMetadata(dto.tipo);
    if (document.version !== dto.version_documento) throw new BadRequestException('Versión legal desactualizada');
    return this.events.save(
      this.events.create({
        usuario: { id_usuario: userId } as Usuario,
        tipo: dto.tipo,
        finalidad: document.finalidad,
        base_juridica: document.base_juridica,
        version_documento: document.version,
        hash_documento: document.sha256,
        decision: dto.decision,
        ip_hash: this.crypto.hmac(ip),
      }),
    );
  }

  async withdrawOptional(userId: string, dto: WithdrawOptionalConsentDto, ip: string): Promise<Consentimiento> {
    return this.events.save(
      this.events.create({
        usuario: { id_usuario: userId } as Usuario,
        tipo: TipoConsentimiento.FINALIDAD_OPCIONAL,
        finalidad: dto.finalidad.trim(),
        base_juridica: 'CONSENTIMIENTO',
        version_documento: 'N/A',
        hash_documento: this.crypto.sha256(dto.finalidad.trim()),
        decision: DecisionConsentimiento.RETIRADO,
        ip_hash: this.crypto.hmac(ip),
      }),
    );
  }

  private documentMetadata(tipo: TipoConsentimiento) {
    const isTerms = tipo === TipoConsentimiento.TERMINOS_USO;
    const text = isTerms ? TERMS_TEXT : PRIVACY_NOTICE_TEXT;
    return {
      tipo,
      version: this.config.getOrThrow<string>(isTerms ? 'TERMS_VERSION' : 'PRIVACY_NOTICE_VERSION'),
      sha256: this.crypto.sha256(text),
      texto: text,
      finalidad: isTerms ? 'GESTION_CONTRACTUAL_PLATAFORMA' : 'INFORMAR_TRATAMIENTO_DATOS_TRL',
      base_juridica: isTerms ? 'RELACION_CONTRACTUAL' : 'DEBER_DE_INFORMACION',
      obligatorio: true,
    };
  }
}
