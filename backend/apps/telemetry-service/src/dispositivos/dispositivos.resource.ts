import { Controller, Injectable, Module } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { InjectRepository, TypeOrmModule } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseCrudService } from '@app/common';
import { CreateDispositivoIoTDto, DispositivoIoT, UpdateDispositivoIoTDto } from './dispositivo-iot.entity';

@Injectable()
export class DispositivosService extends BaseCrudService<DispositivoIoT> {
  constructor(@InjectRepository(DispositivoIoT) repo: Repository<DispositivoIoT>) {
    super(repo);
  }

  findByPaciente(id_paciente: number) {
    return this.repository.find({ where: { id_paciente } });
  }
}

@Controller()
export class DispositivosController {
  constructor(private readonly service: DispositivosService) {}

  @MessagePattern('dispositivos.create')
  create(@Payload() dto: CreateDispositivoIoTDto) {
    return this.service.create(dto);
  }

  @MessagePattern('dispositivos.findAll')
  findAll() {
    return this.service.findAll();
  }

  @MessagePattern('dispositivos.findOne')
  findOne(@Payload() id: number) {
    return this.service.findOne(id);
  }

  @MessagePattern('dispositivos.findByPaciente')
  findByPaciente(@Payload() id_paciente: number) {
    return this.service.findByPaciente(id_paciente);
  }

  @MessagePattern('dispositivos.update')
  update(@Payload() payload: { id: number; data: UpdateDispositivoIoTDto }) {
    return this.service.update(payload.id, payload.data);
  }

  @MessagePattern('dispositivos.remove')
  remove(@Payload() id: number) {
    return this.service.remove(id);
  }
}

@Module({
  imports: [TypeOrmModule.forFeature([DispositivoIoT])],
  controllers: [DispositivosController],
  providers: [DispositivosService],
  exports: [DispositivosService],
})
export class DispositivosModule {}
