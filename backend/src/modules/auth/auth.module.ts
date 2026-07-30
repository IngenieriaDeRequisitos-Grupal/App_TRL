import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Mfa, Sesion, Usuario } from '../../database/entities/trl.entities';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

@Module({
  imports: [JwtModule.register({}), TypeOrmModule.forFeature([Usuario, Sesion, Mfa])],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
