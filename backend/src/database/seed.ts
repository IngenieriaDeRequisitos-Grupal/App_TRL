import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { UsersService } from '../modules/users/users.service';

async function seed(): Promise<void> {
  const app = await NestFactory.createApplicationContext(AppModule, { logger: ['error', 'warn'] });
  try {
    const users = app.get(UsersService);
    await users.bootstrapAdmin({
      nombre_completo: process.env.SEED_ADMIN_NAME ?? '',
      cedula: process.env.SEED_ADMIN_CEDULA ?? '',
      correo_electronico: process.env.SEED_ADMIN_EMAIL ?? '',
      contrasena: process.env.SEED_ADMIN_PASSWORD ?? '',
    });
  } finally {
    await app.close();
  }
}

void seed();
