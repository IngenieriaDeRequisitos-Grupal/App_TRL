import { Controller, Injectable, Module } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { InjectRepository, TypeOrmModule } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseCrudService } from '@app/common';
import { AlertaMedica, UpdateAlertaMedicaDto } from './alerta-medica.entity';
import { LecturaSignoVital } from '../lecturas/lectura-signo-vital.entity';

@Injectable()
export class AlertasService extends BaseCrudService<AlertaMedica> {
  constructor(@InjectRepository(AlertaMedica) repo: Repository<AlertaMedica>) {
    super(repo);
  }

  findByPaciente(id_paciente: number) {
    return this.repository.find({ where: { id_paciente }, order: { fecha_hora_emision: 'DESC' } });
  }
}

@Controller()
export class AlertasController {
  constructor(private readonly service: AlertasService) {}

  @MessagePattern('alertas.findAll')
  findAll() {
    return this.service.findAll();
  }

  @MessagePattern('alertas.findOne')
  findOne(@Payload() id: number) {
    return this.service.findOne(id);
  }

  @MessagePattern('alertas.findByPaciente')
  findByPaciente(@Payload() id_paciente: number) {
    return this.service.findByPaciente(id_paciente);
  }

  @MessagePattern('alertas.update')
  update(@Payload() payload: { id: number; data: UpdateAlertaMedicaDto }) {
    return this.service.update(payload.id, payload.data);
  }
}

@Module({
  imports: [TypeOrmModule.forFeature([AlertaMedica, LecturaSignoVital])],
  controllers: [AlertasController],
  providers: [AlertasService],
  exports: [AlertasService],
})
export class AlertasModule {}
