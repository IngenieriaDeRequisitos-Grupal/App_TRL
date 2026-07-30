import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfiguracionTrl, Evaluador, Observacion, SolicitudEvaluacion } from '../../database/entities/trl.entities';
import { ProjectsModule } from '../projects/projects.module';
import { EvaluationsController } from './evaluations.controller';
import { EvaluationsService } from './evaluations.service';
import { TrlCalculationService } from './trl-calculation.service';

@Module({
  imports: [ProjectsModule, TypeOrmModule.forFeature([SolicitudEvaluacion, ConfiguracionTrl, Evaluador, Observacion])],
  controllers: [EvaluationsController],
  providers: [EvaluationsService, TrlCalculationService],
  exports: [TrlCalculationService],
})
export class EvaluationsModule {}
