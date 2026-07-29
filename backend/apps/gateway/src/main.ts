import 'reflect-metadata';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MicroserviceExceptionFilter } from './common/filters/microservice-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
  app.useGlobalFilters(new MicroserviceExceptionFilter());

  const port = Number(process.env.GATEWAY_PORT) || 3000;
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`[gateway] API REST escuchando en http://localhost:${port}`);
}
bootstrap();
