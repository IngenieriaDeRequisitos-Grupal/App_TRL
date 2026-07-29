import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import {
  CLINICAL_CLIENT,
  FINANCE_CLIENT,
  INTEGRATION_CLIENT,
  REQUESTS_CLIENT,
  TELEMETRY_CLIENT,
  USERS_CLIENT,
} from './clients.constants';
import { JwtStrategy } from './common/strategies/jwt.strategy';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { AuthModule } from './auth/auth.module';
import { UsersGatewayModule } from './users/users-gateway.module';
import { RequestsGatewayModule } from './requests/requests-gateway.module';
import { TelemetryGatewayModule } from './telemetry/telemetry-gateway.module';
import { ClinicalGatewayModule } from './clinical/clinical-gateway.module';
import { IntegrationGatewayModule } from './integration/integration-gateway.module';
import { FinanceGatewayModule } from './finance/finance-gateway.module';

function tcpClient(name: string, hostEnv: string, portEnv: string, defaultPort: number) {
  return {
    name,
    imports: [ConfigModule],
    inject: [ConfigService],
    useFactory: (config: ConfigService) => ({
      transport: Transport.TCP as const,
      options: {
        host: config.get<string>(hostEnv),
        port: Number(config.get(portEnv)) || defaultPort,
      },
    }),
  };
}

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: config.get<string>('JWT_EXPIRES_IN') || '8h' },
      }),
    }),
    ClientsModule.registerAsync([
      tcpClient(USERS_CLIENT, 'USERS_SERVICE_HOST', 'USERS_SERVICE_PORT', 3001),
      tcpClient(REQUESTS_CLIENT, 'REQUESTS_SERVICE_HOST', 'REQUESTS_SERVICE_PORT', 3002),
      tcpClient(TELEMETRY_CLIENT, 'TELEMETRY_SERVICE_HOST', 'TELEMETRY_SERVICE_PORT', 3003),
      tcpClient(CLINICAL_CLIENT, 'CLINICAL_SERVICE_HOST', 'CLINICAL_SERVICE_PORT', 3004),
      tcpClient(INTEGRATION_CLIENT, 'INTEGRATION_SERVICE_HOST', 'INTEGRATION_SERVICE_PORT', 3005),
      tcpClient(FINANCE_CLIENT, 'FINANCE_SERVICE_HOST', 'FINANCE_SERVICE_PORT', 3006),
    ]),
    AuthModule,
    UsersGatewayModule,
    RequestsGatewayModule,
    TelemetryGatewayModule,
    ClinicalGatewayModule,
    IntegrationGatewayModule,
    FinanceGatewayModule,
  ],
  providers: [JwtStrategy, { provide: APP_GUARD, useClass: JwtAuthGuard }],
})
export class AppModule {}
