import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { CorrelationMiddleware } from './common/http/correlation.middleware';
import { SafeExceptionFilter } from './common/http/safe-exception.filter';
import { ConsentGuard } from './common/security/consent.guard';
import { JwtSessionGuard } from './common/security/jwt-session.guard';
import { RolesGuard } from './common/security/roles.guard';
import { SecurityModule } from './common/security/security.module';
import { validateEnvironment } from './config/configuration';
import { TRL_ENTITIES } from './database/entities/trl.entities';
import { InitialTrlPostgres1722211200000 } from './database/migrations/1722211200000-InitialTrlPostgres';
import { AuditInterceptor } from './modules/audit/audit.interceptor';
import { AuditModule } from './modules/audit/audit.module';
import { AuthModule } from './modules/auth/auth.module';
import { ConsentModule } from './modules/consent/consent.module';
import { EvaluationsModule } from './modules/evaluations/evaluations.module';
import { EvidenceModule } from './modules/evidence/evidence.module';
import { ManagementModule } from './modules/management/management.module';
import { ProjectsModule } from './modules/projects/projects.module';
import { UsersModule } from './modules/users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, cache: true, validate: validateEnvironment }),
    JwtModule.register({ global: true }),
    ThrottlerModule.forRoot([{ name: 'default', ttl: 60_000, limit: 100 }]),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres' as const,
        url: config.getOrThrow<string>('DATABASE_URL'),
        ssl: String(config.get('DB_SSL')).toLowerCase() === 'true' ? { rejectUnauthorized: true } : false,
        entities: [...TRL_ENTITIES],
        migrations: [InitialTrlPostgres1722211200000],
        migrationsRun: true,
        synchronize: false,
        logging: false,
      }),
    }),
    TypeOrmModule.forFeature([...TRL_ENTITIES]),
    SecurityModule,
    AuditModule,
    AuthModule,
    ConsentModule,
    UsersModule,
    ProjectsModule,
    EvaluationsModule,
    EvidenceModule,
    ManagementModule,
  ],
  controllers: [AppController],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtSessionGuard },
    { provide: APP_GUARD, useClass: ConsentGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_INTERCEPTOR, useClass: AuditInterceptor },
    { provide: APP_FILTER, useClass: SafeExceptionFilter },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(CorrelationMiddleware).forRoutes('*');
  }
}
