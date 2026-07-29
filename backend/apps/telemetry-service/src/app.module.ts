import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DispositivosModule } from './dispositivos/dispositivos.resource';
import { DispositivoIoT } from './dispositivos/dispositivo-iot.entity';
import { LecturasModule } from './lecturas/lecturas.resource';
import { LecturaSignoVital } from './lecturas/lectura-signo-vital.entity';
import { AlertasModule } from './alertas/alertas.resource';
import { AlertaMedica } from './alertas/alerta-medica.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('DB_HOST'),
        port: Number(config.get('DB_PORT')),
        username: config.get<string>('DB_USERNAME'),
        password: config.get<string>('DB_PASSWORD'),
        database: config.get<string>('DB_NAME') || config.get<string>('TELEMETRY_DB_NAME'),
        entities: [DispositivoIoT, LecturaSignoVital, AlertaMedica],
        synchronize: true,
      }),
    }),
    DispositivosModule,
    LecturasModule,
    AlertasModule,
  ],
})
export class AppModule {}
