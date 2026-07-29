import { Controller, Injectable, Module } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { InjectRepository, TypeOrmModule } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseCrudService } from '@app/common';
import { CreatePagoDto, Pago } from './pago.entity';
import { EstadoPago, Factura } from '../facturas/factura.entity';

@Injectable()
export class PagosService extends BaseCrudService<Pago> {
  constructor(
    @InjectRepository(Pago) repo: Repository<Pago>,
    @InjectRepository(Factura) private readonly facturasRepo: Repository<Factura>,
  ) {
    super(repo);
  }

  async create(dto: CreatePagoDto): Promise<Pago> {
    const entity = this.repository.create({
      factura: { id: dto.id_factura } as Factura,
      metodo_pago: dto.metodo_pago,
      referencia_pasarela: dto.referencia_pasarela,
      monto_pagado: dto.monto_pagado,
    });
    const pago = await this.repository.save(entity);

    const factura = await this.facturasRepo.findOne({ where: { id: dto.id_factura } });
    if (factura) {
      const pagos = await this.repository.find({ where: { factura: { id: dto.id_factura } } });
      const totalPagado = pagos.reduce((acc, p) => acc + Number(p.monto_pagado), 0);
      if (totalPagado >= Number(factura.total)) {
        await this.facturasRepo.update(factura.id, { estado_pago: EstadoPago.PAGADA });
      }
    }
    return pago;
  }

  findByFactura(id_factura: number) {
    return this.repository.find({ where: { factura: { id: id_factura } } });
  }
}

@Controller()
export class PagosController {
  constructor(private readonly service: PagosService) {}

  @MessagePattern('pagos.create')
  create(@Payload() dto: CreatePagoDto) {
    return this.service.create(dto);
  }

  @MessagePattern('pagos.findAll')
  findAll() {
    return this.service.findAll();
  }

  @MessagePattern('pagos.findOne')
  findOne(@Payload() id: number) {
    return this.service.findOne(id);
  }

  @MessagePattern('pagos.findByFactura')
  findByFactura(@Payload() id_factura: number) {
    return this.service.findByFactura(id_factura);
  }
}

@Module({
  imports: [TypeOrmModule.forFeature([Pago, Factura])],
  controllers: [PagosController],
  providers: [PagosService],
  exports: [PagosService],
})
export class PagosModule {}
