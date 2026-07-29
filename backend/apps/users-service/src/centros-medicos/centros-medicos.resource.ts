import { Controller, Injectable, Module } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { InjectRepository, TypeOrmModule } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseCrudService } from '@app/common';
import { CentroMedico, CreateCentroMedicoDto, UpdateCentroMedicoDto } from './centro-medico.entity';

@Injectable()
export class CentrosMedicosService extends BaseCrudService<CentroMedico> {
  constructor(@InjectRepository(CentroMedico) repo: Repository<CentroMedico>) {
    super(repo);
  }
}

@Controller()
export class CentrosMedicosController {
  constructor(private readonly service: CentrosMedicosService) {}

  @MessagePattern('centros_medicos.create')
  create(@Payload() dto: CreateCentroMedicoDto) {
    return this.service.create(dto);
  }

  @MessagePattern('centros_medicos.findAll')
  findAll() {
    return this.service.findAll();
  }

  @MessagePattern('centros_medicos.findOne')
  findOne(@Payload() id: number) {
    return this.service.findOne(id);
  }

  @MessagePattern('centros_medicos.update')
  update(@Payload() payload: { id: number; data: UpdateCentroMedicoDto }) {
    return this.service.update(payload.id, payload.data);
  }

  @MessagePattern('centros_medicos.remove')
  remove(@Payload() id: number) {
    return this.service.remove(id);
  }
}

@Module({
  imports: [TypeOrmModule.forFeature([CentroMedico])],
  controllers: [CentrosMedicosController],
  providers: [CentrosMedicosService],
  exports: [CentrosMedicosService],
})
export class CentrosMedicosModule {}
