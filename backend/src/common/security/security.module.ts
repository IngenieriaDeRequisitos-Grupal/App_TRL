import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Consentimiento, Sesion } from '../../database/entities/trl.entities';
import { CryptoService } from './crypto.service';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([Sesion, Consentimiento])],
  providers: [CryptoService],
  exports: [CryptoService],
})
export class SecurityModule {}
