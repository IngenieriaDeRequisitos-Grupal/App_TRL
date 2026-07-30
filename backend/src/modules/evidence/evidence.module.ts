import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Cuestionario, DocumentoAdjunto } from '../../database/entities/trl.entities';
import { EvidenceController } from './evidence.controller';
import { EvidenceService } from './evidence.service';

@Module({
  imports: [TypeOrmModule.forFeature([Cuestionario, DocumentoAdjunto])],
  controllers: [EvidenceController],
  providers: [EvidenceService],
})
export class EvidenceModule {}
