import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EntidadesModule } from './entidades/entidades.resource';
import { EntidadExterna } from './entidades/entidad-externa.entity';
import { LogsModule } from './logs/logs.resource';
import { LogInteroperabilidad } from './logs/log-interoperabilidad.entity';

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
        database: config.get<string>('DB_NAME') || config.get<string>('INTEGRATION_DB_NAME'),
        entities: [EntidadExterna, LogInteroperabilidad],
        synchronize: true,
      }),
    }),
    EntidadesModule,
    LogsModule,
  ],
})
export class AppModule {}
