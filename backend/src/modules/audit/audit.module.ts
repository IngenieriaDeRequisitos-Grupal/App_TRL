import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventoAuditoria } from '../../database/entities/trl.entities';
import { AuditInterceptor } from './audit.interceptor';
import { AuditController } from './audit.controller';
import { AuditService } from './audit.service';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([EventoAuditoria])],
  controllers: [AuditController],
  providers: [AuditInterceptor, AuditService],
  exports: [AuditInterceptor],
})
export class AuditModule {}
