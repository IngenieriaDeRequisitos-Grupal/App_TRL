import 'reflect-metadata';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { AppModule } from './app.module';

/**
 * Servicio hibrido: expone TCP para el API Gateway y ademas se suscribe
 * a la cola de RabbitMQ de telemetry-service para registrar en
 * Logs_Interoperabilidad cada alerta medica notificada a entidades externas.
 */
async function bootstrap() {
  const tcpPort = Number(process.env.INTEGRATION_SERVICE_PORT) || 3005;

  // Aplicacion hibrida sin HTTP: expone TCP (para el gateway) y consume RabbitMQ,
  // ambos conectados sobre la misma instancia via connectMicroservice().
  const app = await NestFactory.create(AppModule);

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.TCP,
    options: { host: '0.0.0.0', port: tcpPort },
  });

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: [process.env.RABBITMQ_URL || 'amqp://localhost:5672'],
      queue: process.env.RABBITMQ_TELEMETRY_QUEUE || 'telemetry_events_queue',
      queueOptions: { durable: true },
    },
  });

  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
  await app.startAllMicroservices();
  // eslint-disable-next-line no-console
  console.log(`[integration-service] TCP:${tcpPort} + consumidor RabbitMQ activos`);
}
bootstrap();
