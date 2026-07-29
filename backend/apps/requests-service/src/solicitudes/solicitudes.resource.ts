import { Controller, Injectable, Module } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { InjectRepository, TypeOrmModule } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseCrudService } from '@app/common';
import { CreateSolicitudAtencionDto, SolicitudAtencion, UpdateSolicitudAtencionDto } from './solicitud-atencion.entity';

@Injectable()
export class SolicitudesService extends BaseCrudService<SolicitudAtencion> {
  constructor(@InjectRepository(SolicitudAtencion) repo: Repository<SolicitudAtencion>) {
    super(repo);
  }

  findByPaciente(id_paciente: number) {
    return this.repository.find({ where: { id_paciente }, order: { fecha_hora_solicitud: 'DESC' } });
  }
}

@Controller()
export class SolicitudesController {
  constructor(private readonly service: SolicitudesService) {}

  @MessagePattern('solicitudes.create')
  create(@Payload() dto: CreateSolicitudAtencionDto) {
    return this.service.create(dto);
  }

  @MessagePattern('solicitudes.findAll')
  findAll() {
    return this.service.findAll();
  }

  @MessagePattern('solicitudes.findOne')
  findOne(@Payload() id: number) {
    return this.service.findOne(id);
  }

  @MessagePattern('solicitudes.findByPaciente')
  findByPaciente(@Payload() id_paciente: number) {
    return this.service.findByPaciente(id_paciente);
  }

  @MessagePattern('solicitudes.update')
  update(@Payload() payload: { id: number; data: UpdateSolicitudAtencionDto }) {
    return this.service.update(payload.id, payload.data);
  }

  @MessagePattern('solicitudes.remove')
  remove(@Payload() id: number) {
    return this.service.remove(id);
  }
}

@Module({
  imports: [TypeOrmModule.forFeature([SolicitudAtencion])],
  controllers: [SolicitudesController],
  providers: [SolicitudesService],
  exports: [SolicitudesService],
})
export class SolicitudesModule {}
