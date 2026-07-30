import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventoAuditoria } from '../../database/entities/trl.entities';
import { AuditInterceptor } from './audit.interceptor';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([EventoAuditoria])],
  providers: [AuditInterceptor],
  exports: [AuditInterceptor],
})
export class AuditModule {}
