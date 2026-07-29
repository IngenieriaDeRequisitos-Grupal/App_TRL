import { Controller, Injectable, Module } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { InjectRepository, TypeOrmModule } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseCrudService } from '@app/common';
import { CreateOrdenExamenDto, OrdenExamen } from './orden-examen.entity';
import { RegistroEvolucion } from '../registros/registro-evolucion.entity';

@Injectable()
export class OrdenesService extends BaseCrudService<OrdenExamen> {
  constructor(@InjectRepository(OrdenExamen) repo: Repository<OrdenExamen>) {
    super(repo);
  }

  create(dto: CreateOrdenExamenDto) {
    const entity = this.repository.create({
      registro: { id: dto.id_registro } as RegistroEvolucion,
      tipo_examen: dto.tipo_examen,
      indicaciones: dto.indicaciones,
    });
    return this.repository.save(entity);
  }

  findByRegistro(id_registro: number) {
    return this.repository.find({ where: { registro: { id: id_registro } } });
  }
}

@Controller()
export class OrdenesController {
  constructor(private readonly service: OrdenesService) {}

  @MessagePattern('ordenes.create')
  create(@Payload() dto: CreateOrdenExamenDto) {
    return this.service.create(dto);
  }

  @MessagePattern('ordenes.findByRegistro')
  findByRegistro(@Payload() id_registro: number) {
    return this.service.findByRegistro(id_registro);
  }

  @MessagePattern('ordenes.findOne')
  findOne(@Payload() id: number) {
    return this.service.findOne(id);
  }
}

@Module({
  imports: [TypeOrmModule.forFeature([OrdenExamen])],
  controllers: [OrdenesController],
  providers: [OrdenesService],
  exports: [OrdenesService],
})
export class OrdenesModule {}
