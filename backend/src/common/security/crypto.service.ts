import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes } from 'crypto';

const VERSION = 1;
const IV_LENGTH = 12;
const TAG_LENGTH = 16;

@Injectable()
export class CryptoService {
  private readonly encryptionKey: Buffer;
  private readonly auditKey: string;

  constructor(private readonly config: ConfigService) {
    // WARNING: la rotación en línea requiere un identificador de clave y un keyring; cambiar la clave actual inutiliza datos ya cifrados.
    this.encryptionKey = Buffer.from(this.config.getOrThrow<string>('FIELD_ENCRYPTION_KEY_BASE64'), 'base64');
    this.auditKey = this.config.getOrThrow<string>('AUDIT_HMAC_KEY');
  }

  encryptText(value: string, context: string): string {
    return this.encryptBuffer(Buffer.from(value, 'utf8'), context).toString('base64');
  }

  decryptText(value: string, context: string): string {
    return this.decryptBuffer(Buffer.from(value, 'base64'), context).toString('utf8');
  }

  encryptBuffer(value: Buffer, context: string): Buffer {
    const iv = randomBytes(IV_LENGTH);
    const cipher = createCipheriv('aes-256-gcm', this.encryptionKey, iv);
    cipher.setAAD(Buffer.from(context, 'utf8'));
    const ciphertext = Buffer.concat([cipher.update(value), cipher.final()]);
    return Buffer.concat([Buffer.from([VERSION]), iv, cipher.getAuthTag(), ciphertext]);
  }

  decryptBuffer(value: Buffer, context: string): Buffer {
    if (value.length < 1 + IV_LENGTH + TAG_LENGTH || value[0] !== VERSION) {
      throw new Error('Formato de dato cifrado inválido');
    }
    const iv = value.subarray(1, 1 + IV_LENGTH);
    const tag = value.subarray(1 + IV_LENGTH, 1 + IV_LENGTH + TAG_LENGTH);
    const ciphertext = value.subarray(1 + IV_LENGTH + TAG_LENGTH);
    const decipher = createDecipheriv('aes-256-gcm', this.encryptionKey, iv);
    decipher.setAAD(Buffer.from(context, 'utf8'));
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  }

  sha256(value: string | Buffer): string {
    return createHash('sha256').update(value).digest('hex');
  }

  hmac(value: string): string {
    return createHmac('sha256', this.auditKey).update(value).digest('hex');
  }
}
