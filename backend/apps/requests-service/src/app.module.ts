import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SolicitudesModule } from './solicitudes/solicitudes.resource';
import { SolicitudAtencion } from './solicitudes/solicitud-atencion.entity';
import { AsignacionesModule } from './asignaciones/asignaciones.resource';
import { AsignacionRecurso } from './asignaciones/asignacion-recurso.entity';

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
        database: config.get<string>('DB_NAME') || config.get<string>('REQUESTS_DB_NAME'),
        entities: [SolicitudAtencion, AsignacionRecurso],
        synchronize: true,
      }),
    }),
    SolicitudesModule,
    AsignacionesModule,
  ],
})
export class AppModule {}
