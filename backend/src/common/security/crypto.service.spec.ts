import { ConfigService } from '@nestjs/config';
import { CryptoService } from './crypto.service';

describe('CryptoService', () => {
  const config = new ConfigService({
    FIELD_ENCRYPTION_KEY_BASE64: Buffer.alloc(32, 7).toString('base64'),
    AUDIT_HMAC_KEY: 'audit-key-with-more-than-24-characters',
  });
  const service = new CryptoService(config);

  it('encrypts with randomness and authenticates context', () => {
    const first = service.encryptText('1104680135', 'usuario:cedula:v1');
    const second = service.encryptText('1104680135', 'usuario:cedula:v1');
    expect(first).not.toBe(second);
    expect(service.decryptText(first, 'usuario:cedula:v1')).toBe('1104680135');
    expect(() => service.decryptText(first, 'otro-contexto')).toThrow();
  });

  it('detects ciphertext tampering', () => {
    const encrypted = service.encryptBuffer(Buffer.from('PDF'), 'documento:test');
    const last = encrypted.length - 1;
    encrypted[last] = (encrypted[last] ?? 0) ^ 1;
    expect(() => service.decryptBuffer(encrypted, 'documento:test')).toThrow();
  });
});
