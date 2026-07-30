import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { bodyParser: true });
  const config = app.get(ConfigService);
  const origins = String(config.get('CORS_ORIGINS') ?? '').split(',').map((value) => value.trim()).filter(Boolean);
  app.setGlobalPrefix(config.get<string>('API_PREFIX') ?? 'api');
  app.use(helmet({ contentSecurityPolicy: false }));
  app.enableCors({ origin: origins, methods: ['GET', 'POST', 'PUT', 'PATCH'], credentials: false, maxAge: 600 });
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    forbidUnknownValues: true,
    transform: true,
    transformOptions: { enableImplicitConversion: false },
  }));
  app.enableShutdownHooks();
  await app.listen(Number(config.get('PORT') ?? 3000), '0.0.0.0');
}

void bootstrap();
