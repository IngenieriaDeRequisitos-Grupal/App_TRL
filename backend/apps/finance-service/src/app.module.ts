import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FacturasModule } from './facturas/facturas.resource';
import { Factura } from './facturas/factura.entity';
import { PagosModule } from './pagos/pagos.resource';
import { Pago } from './pagos/pago.entity';

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
        database: config.get<string>('DB_NAME') || config.get<string>('FINANCE_DB_NAME'),
        entities: [Factura, Pago],
        synchronize: true,
      }),
    }),
    FacturasModule,
    PagosModule,
  ],
})
export class AppModule {}
