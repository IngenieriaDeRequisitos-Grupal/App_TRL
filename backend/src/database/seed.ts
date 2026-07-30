import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { UsersService } from '../modules/users/users.service';

async function seed(): Promise<void> {
  const app = await NestFactory.createApplicationContext(AppModule, { logger: ['error', 'warn'] });
  try {
    const users = app.get(UsersService);
    const admin = await users.bootstrapAdmin({
      nombre_completo: process.env.SEED_ADMIN_NAME ?? '',
      cedula: process.env.SEED_ADMIN_CEDULA ?? '',
      correo_electronico: process.env.SEED_ADMIN_EMAIL ?? '',
      contrasena: process.env.SEED_ADMIN_PASSWORD ?? '',
    });
    // SECURITY: salida única para enrolar el autenticador; no se persiste el secreto MFA en claro.
    process.stdout.write(`${JSON.stringify({
      id_usuario: admin.id_usuario,
      correo_electronico: admin.correo_electronico,
      mfa_secret: admin.mfa_secret,
      mfa_provisioning_uri: admin.mfa_provisioning_uri,
    })}\n`);
  } finally {
    await app.close();
  }
}

void seed();
