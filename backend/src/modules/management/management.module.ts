import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfiguracionTrl, Dashboard, ProyectoInvencion, Reporte } from '../../database/entities/trl.entities';
import { EvaluationsModule } from '../evaluations/evaluations.module';
import { ManagementController } from './management.controller';
import { ManagementService } from './management.service';

@Module({
  imports: [EvaluationsModule, TypeOrmModule.forFeature([ConfiguracionTrl, Dashboard, ProyectoInvencion, Reporte])],
  controllers: [ManagementController],
  providers: [ManagementService],
})
export class ManagementModule {}
