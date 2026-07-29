import { ValueTransformer } from 'typeorm';
import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;
const SALT = 'medapp-clinical-data-aes256';

let cachedKey: Buffer | null = null;

function getEncryptionKey(): Buffer {
  if (cachedKey) return cachedKey;
  const secret = process.env.ENCRYPTION_KEY;
  if (!secret || secret.length < 16) {
    throw new Error(
      'ENCRYPTION_KEY no esta definida o es demasiado corta. Configure una clave maestra segura.',
    );
  }
  cachedKey = scryptSync(secret, SALT, 32);
  return cachedKey;
}

/**
 * ValueTransformer de TypeORM que cifra/descifra automaticamente con AES-256-GCM.
 * Se aplica declarativamente en @Column({ transformer: aes256Transformer }).
 * Formato almacenado (base64): IV(12) || AUTH_TAG(16) || CIPHERTEXT
 */
export class Aes256EncryptionTransformer implements ValueTransformer {
  to(value?: string | null): string | null | undefined {
    if (value === null || value === undefined || value === '') return value as any;
    const key = getEncryptionKey();
    const iv = randomBytes(IV_LENGTH);
    const cipher = createCipheriv(ALGORITHM, key, iv);
    const encrypted = Buffer.concat([cipher.update(String(value), 'utf8'), cipher.final()]);
    const authTag = cipher.getAuthTag();
    return Buffer.concat([iv, authTag, encrypted]).toString('base64');
  }

  from(value?: string | null): string | null | undefined {
    if (value === null || value === undefined || value === '') return value as any;
    const key = getEncryptionKey();
    const raw = Buffer.from(value, 'base64');
    const iv = raw.subarray(0, IV_LENGTH);
    const authTag = raw.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
    const ciphertext = raw.subarray(IV_LENGTH + AUTH_TAG_LENGTH);
    const decipher = createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
    return decrypted.toString('utf8');
  }
}

export const aes256Transformer = new Aes256EncryptionTransformer();
