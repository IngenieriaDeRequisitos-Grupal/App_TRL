import { Controller, Injectable, Module } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { InjectRepository, TypeOrmModule } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseCrudService } from '@app/common';
import { CreateEntidadExternaDto, EntidadExterna, UpdateEntidadExternaDto } from './entidad-externa.entity';

@Injectable()
export class EntidadesService extends BaseCrudService<EntidadExterna> {
  constructor(@InjectRepository(EntidadExterna) repo: Repository<EntidadExterna>) {
    super(repo);
  }
}

@Controller()
export class EntidadesController {
  constructor(private readonly service: EntidadesService) {}

  @MessagePattern('entidades_externas.create')
  create(@Payload() dto: CreateEntidadExternaDto) {
    return this.service.create(dto);
  }

  @MessagePattern('entidades_externas.findAll')
  findAll() {
    return this.service.findAll();
  }

  @MessagePattern('entidades_externas.findOne')
  findOne(@Payload() id: number) {
    return this.service.findOne(id);
  }

  @MessagePattern('entidades_externas.update')
  update(@Payload() payload: { id: number; data: UpdateEntidadExternaDto }) {
    return this.service.update(payload.id, payload.data);
  }

  @MessagePattern('entidades_externas.remove')
  remove(@Payload() id: number) {
    return this.service.remove(id);
  }
}

@Module({
  imports: [TypeOrmModule.forFeature([EntidadExterna])],
  controllers: [EntidadesController],
  providers: [EntidadesService],
  exports: [EntidadesService],
})
export class EntidadesModule {}
