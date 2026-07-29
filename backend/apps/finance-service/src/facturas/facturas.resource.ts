import { Controller, Injectable, Module } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { InjectRepository, TypeOrmModule } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseCrudService } from '@app/common';
import { CreateFacturaDto, Factura, UpdateFacturaDto } from './factura.entity';

@Injectable()
export class FacturasService extends BaseCrudService<Factura> {
  constructor(@InjectRepository(Factura) repo: Repository<Factura>) {
    super(repo);
  }

  findByPaciente(id_paciente: number) {
    return this.repository.find({ where: { id_paciente }, order: { fecha_emision: 'DESC' } });
  }
}

@Controller()
export class FacturasController {
  constructor(private readonly service: FacturasService) {}

  @MessagePattern('facturas.create')
  create(@Payload() dto: CreateFacturaDto) {
    return this.service.create(dto);
  }

  @MessagePattern('facturas.findAll')
  findAll() {
    return this.service.findAll();
  }

  @MessagePattern('facturas.findOne')
  findOne(@Payload() id: number) {
    return this.service.findOne(id);
  }

  @MessagePattern('facturas.findByPaciente')
  findByPaciente(@Payload() id_paciente: number) {
    return this.service.findByPaciente(id_paciente);
  }

  @MessagePattern('facturas.update')
  update(@Payload() payload: { id: number; data: UpdateFacturaDto }) {
    return this.service.update(payload.id, payload.data);
  }
}

@Module({
  imports: [TypeOrmModule.forFeature([Factura])],
  controllers: [FacturasController],
  providers: [FacturasService],
  exports: [FacturasService],
})
export class FacturasModule {}
