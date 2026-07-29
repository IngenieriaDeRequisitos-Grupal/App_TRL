import { Controller, Injectable, Module } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { InjectRepository, TypeOrmModule } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseCrudService } from '@app/common';
import { CreateHistorialClinicoDto, HistorialClinico, UpdateHistorialClinicoDto } from './historial-clinico.entity';

@Injectable()
export class HistorialesService extends BaseCrudService<HistorialClinico> {
  constructor(@InjectRepository(HistorialClinico) repo: Repository<HistorialClinico>) {
    super(repo);
  }

  findByPaciente(id_paciente: number) {
    return this.repository.findOne({ where: { id_paciente } });
  }
}

@Controller()
export class HistorialesController {
  constructor(private readonly service: HistorialesService) {}

  @MessagePattern('historiales.create')
  create(@Payload() dto: CreateHistorialClinicoDto) {
    return this.service.create(dto);
  }

  @MessagePattern('historiales.findAll')
  findAll() {
    return this.service.findAll();
  }

  @MessagePattern('historiales.findOne')
  findOne(@Payload() id: number) {
    return this.service.findOne(id);
  }

  @MessagePattern('historiales.findByPaciente')
  findByPaciente(@Payload() id_paciente: number) {
    return this.service.findByPaciente(id_paciente);
  }

  @MessagePattern('historiales.update')
  update(@Payload() payload: { id: number; data: UpdateHistorialClinicoDto }) {
    return this.service.update(payload.id, payload.data);
  }
}

@Module({
  imports: [TypeOrmModule.forFeature([HistorialClinico])],
  controllers: [HistorialesController],
  providers: [HistorialesService],
  exports: [HistorialesService],
})
export class HistorialesModule {}
