import { Controller, Injectable, Module } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { InjectRepository, TypeOrmModule } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseCrudService } from '@app/common';
import { CreateTeleconsultaDto, Teleconsulta, UpdateTeleconsultaDto } from './teleconsulta.entity';

@Injectable()
export class TeleconsultasService extends BaseCrudService<Teleconsulta> {
  constructor(@InjectRepository(Teleconsulta) repo: Repository<Teleconsulta>) {
    super(repo);
  }

  create(dto: CreateTeleconsultaDto) {
    const entity = this.repository.create({
      ...dto,
      fecha_hora_inicio: new Date(),
    });
    return this.repository.save(entity);
  }

  async finalizar(id: number): Promise<Teleconsulta> {
    await this.findOne(id);
    await this.repository.update(id, { fecha_hora_fin: new Date() });
    return this.findOne(id);
  }
}

@Controller()
export class TeleconsultasController {
  constructor(private readonly service: TeleconsultasService) {}

  @MessagePattern('teleconsultas.create')
  create(@Payload() dto: CreateTeleconsultaDto) {
    return this.service.create(dto);
  }

  @MessagePattern('teleconsultas.findAll')
  findAll() {
    return this.service.findAll();
  }

  @MessagePattern('teleconsultas.findOne')
  findOne(@Payload() id: number) {
    return this.service.findOne(id);
  }

  @MessagePattern('teleconsultas.update')
  update(@Payload() payload: { id: number; data: UpdateTeleconsultaDto }) {
    return this.service.update(payload.id, payload.data);
  }

  @MessagePattern('teleconsultas.finalizar')
  finalizar(@Payload() id: number) {
    return this.service.finalizar(id);
  }

  @MessagePattern('teleconsultas.remove')
  remove(@Payload() id: number) {
    return this.service.remove(id);
  }
}

@Module({
  imports: [TypeOrmModule.forFeature([Teleconsulta])],
  controllers: [TeleconsultasController],
  providers: [TeleconsultasService],
  exports: [TeleconsultasService],
})
export class TeleconsultasModule {}
