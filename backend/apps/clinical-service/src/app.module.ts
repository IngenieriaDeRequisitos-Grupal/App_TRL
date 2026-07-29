import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TeleconsultasModule } from './teleconsultas/teleconsultas.resource';
import { Teleconsulta } from './teleconsultas/teleconsulta.entity';
import { HistorialesModule } from './historiales/historiales.resource';
import { HistorialClinico } from './historiales/historial-clinico.entity';
import { RegistrosModule } from './registros/registros.resource';
import { RegistroEvolucion } from './registros/registro-evolucion.entity';
import { RecetasModule } from './recetas/recetas.resource';
import { RecetaMedica } from './recetas/receta-medica.entity';
import { DetalleRecetasModule } from './detalle-recetas/detalle-recetas.resource';
import { DetalleReceta } from './detalle-recetas/detalle-receta.entity';
import { OrdenesModule } from './ordenes/ordenes.resource';
import { OrdenExamen } from './ordenes/orden-examen.entity';

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
        database: config.get<string>('DB_NAME') || config.get<string>('CLINICAL_DB_NAME'),
        entities: [Teleconsulta, HistorialClinico, RegistroEvolucion, RecetaMedica, DetalleReceta, OrdenExamen],
        synchronize: true,
      }),
    }),
    TeleconsultasModule,
    HistorialesModule,
    RegistrosModule,
    RecetasModule,
    DetalleRecetasModule,
    OrdenesModule,
  ],
})
export class AppModule {}
