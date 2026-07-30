import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  Administrador,
  Evaluador,
  GestorIdi,
  Investigador,
  Mfa,
  Rol,
  Sesion,
  Usuario,
} from '../../database/entities/trl.entities';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Usuario, Administrador, Investigador, Evaluador, GestorIdi, Rol, Sesion, Mfa]),
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
