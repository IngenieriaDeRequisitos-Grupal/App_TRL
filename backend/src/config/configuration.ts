type Environment = Record<string, string | undefined>;

function requireValue(env: Environment, key: string, minLength = 1): string {
  const value = env[key]?.trim();
  if (!value || value.length < minLength) {
    throw new Error(`${key} es obligatorio y debe tener al menos ${minLength} caracteres`);
  }
  return value;
}

function positiveInteger(env: Environment, key: string, fallback: number): number {
  const value = env[key] ? Number(env[key]) : fallback;
  if (!Number.isSafeInteger(value) || value <= 0) {
    throw new Error(`${key} debe ser un entero positivo`);
  }
  return value;
}

export function validateEnvironment(env: Environment): Environment {
  requireValue(env, 'DATABASE_URL');
  requireValue(env, 'JWT_SECRET', 32);
  requireValue(env, 'JWT_ISSUER', 3);
  requireValue(env, 'JWT_AUDIENCE', 3);
  requireValue(env, 'PASSWORD_PEPPER', 24);
  requireValue(env, 'AUDIT_HMAC_KEY', 24);
  requireValue(env, 'TERMS_VERSION');
  requireValue(env, 'PRIVACY_NOTICE_VERSION');

  const encryptionKey = Buffer.from(requireValue(env, 'FIELD_ENCRYPTION_KEY_BASE64'), 'base64');
  if (encryptionKey.length !== 32) {
    throw new Error('FIELD_ENCRYPTION_KEY_BASE64 debe representar exactamente 32 bytes');
  }

  positiveInteger(env, 'JWT_ACCESS_TTL_SECONDS', 3600);
  positiveInteger(env, 'JWT_MFA_TTL_SECONDS', 300);
  positiveInteger(env, 'MAX_EVIDENCE_BYTES', 10 * 1024 * 1024);
  positiveInteger(env, 'PORT', 3000);
  return env;
}
