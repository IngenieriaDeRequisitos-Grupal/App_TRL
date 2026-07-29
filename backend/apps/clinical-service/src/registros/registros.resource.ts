import { Controller, Injectable, Module } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { InjectRepository, TypeOrmModule } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseCrudService } from '@app/common';
import { CreateRegistroEvolucionDto, RegistroEvolucion } from './registro-evolucion.entity';
import { HistorialClinico } from '../historiales/historial-clinico.entity';

@Injectable()
export class RegistrosService extends BaseCrudService<RegistroEvolucion> {
  constructor(@InjectRepository(RegistroEvolucion) repo: Repository<RegistroEvolucion>) {
    super(repo);
  }

  create(dto: CreateRegistroEvolucionDto) {
    const entity = this.repository.create({
      historial: { id: dto.id_historial } as HistorialClinico,
      id_medico: dto.id_medico,
      diagnostico_cifrado: dto.diagnostico_cifrado,
      observaciones_cifradas: dto.observaciones_cifradas,
    });
    return this.repository.save(entity);
  }

  findByHistorial(id_historial: number) {
    return this.repository.find({ where: { historial: { id: id_historial } }, order: { fecha_hora: 'DESC' } });
  }
}

@Controller()
export class RegistrosController {
  constructor(private readonly service: RegistrosService) {}

  @MessagePattern('registros.create')
  create(@Payload() dto: CreateRegistroEvolucionDto) {
    return this.service.create(dto);
  }

  @MessagePattern('registros.findAll')
  findAll() {
    return this.service.findAll();
  }

  @MessagePattern('registros.findOne')
  findOne(@Payload() id: number) {
    return this.service.findOne(id);
  }

  @MessagePattern('registros.findByHistorial')
  findByHistorial(@Payload() id_historial: number) {
    return this.service.findByHistorial(id_historial);
  }
}

@Module({
  imports: [TypeOrmModule.forFeature([RegistroEvolucion])],
  controllers: [RegistrosController],
  providers: [RegistrosService],
  exports: [RegistrosService],
})
export class RegistrosModule {}
