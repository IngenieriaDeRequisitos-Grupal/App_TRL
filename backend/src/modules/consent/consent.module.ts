import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Consentimiento } from '../../database/entities/trl.entities';
import { ConsentController } from './consent.controller';
import { ConsentService } from './consent.service';

@Module({
  imports: [TypeOrmModule.forFeature([Consentimiento])],
  controllers: [ConsentController],
  providers: [ConsentService],
})
export class ConsentModule {}
