import { Controller, Injectable, Module } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { InjectRepository, TypeOrmModule } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseCrudService } from '@app/common';
import { AsignacionRecurso, CreateAsignacionRecursoDto, UpdateAsignacionRecursoDto } from './asignacion-recurso.entity';
import { SolicitudAtencion } from '../solicitudes/solicitud-atencion.entity';
import { EstadoSolicitud } from '../solicitudes/solicitud-atencion.entity';

@Injectable()
export class AsignacionesService extends BaseCrudService<AsignacionRecurso> {
  constructor(@InjectRepository(AsignacionRecurso) repo: Repository<AsignacionRecurso>) {
    super(repo);
  }

  async create(dto: CreateAsignacionRecursoDto) {
    const entity = this.repository.create({
      solicitud: { id: dto.id_solicitud } as SolicitudAtencion,
      id_medico: dto.id_medico,
      tiempo_respuesta_minutos: dto.tiempo_respuesta_minutos,
    });
    const saved = await this.repository.save(entity);
    await this.repository.manager.update(SolicitudAtencion, dto.id_solicitud, {
      estado: EstadoSolicitud.ASIGNADA,
    });
    return saved;
  }
}

@Controller()
export class AsignacionesController {
  constructor(private readonly service: AsignacionesService) {}

  @MessagePattern('asignaciones.create')
  create(@Payload() dto: CreateAsignacionRecursoDto) {
    return this.service.create(dto);
  }

  @MessagePattern('asignaciones.findAll')
  findAll() {
    return this.service.findAll();
  }

  @MessagePattern('asignaciones.findOne')
  findOne(@Payload() id: number) {
    return this.service.findOne(id);
  }

  @MessagePattern('asignaciones.update')
  update(@Payload() payload: { id: number; data: UpdateAsignacionRecursoDto }) {
    return this.service.update(payload.id, payload.data);
  }

  @MessagePattern('asignaciones.remove')
  remove(@Payload() id: number) {
    return this.service.remove(id);
  }
}

@Module({
  imports: [TypeOrmModule.forFeature([AsignacionRecurso, SolicitudAtencion])],
  controllers: [AsignacionesController],
  providers: [AsignacionesService],
  exports: [AsignacionesService],
})
export class AsignacionesModule {}
