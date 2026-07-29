import { Body, Controller, Get, Inject, Module, Param, Patch, Post } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { FINANCE_CLIENT } from '../clients.constants';

@Controller('facturas')
export class FacturasGatewayController {
  constructor(@Inject(FINANCE_CLIENT) private readonly client: ClientProxy) {}

  @Post()
  create(@Body() body: any) {
    return firstValueFrom(this.client.send('facturas.create', body));
  }

  @Get()
  findAll() {
    return firstValueFrom(this.client.send('facturas.findAll', {}));
  }

  @Get('paciente/:id_paciente')
  findByPaciente(@Param('id_paciente') id: string) {
    return firstValueFrom(this.client.send('facturas.findByPaciente', Number(id)));
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return firstValueFrom(this.client.send('facturas.findOne', Number(id)));
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: any) {
    return firstValueFrom(this.client.send('facturas.update', { id: Number(id), data: body }));
  }
}

@Controller('pagos')
export class PagosGatewayController {
  constructor(@Inject(FINANCE_CLIENT) private readonly client: ClientProxy) {}

  @Post()
  create(@Body() body: any) {
    return firstValueFrom(this.client.send('pagos.create', body));
  }

  @Get()
  findAll() {
    return firstValueFrom(this.client.send('pagos.findAll', {}));
  }

  @Get('factura/:id_factura')
  findByFactura(@Param('id_factura') id: string) {
    return firstValueFrom(this.client.send('pagos.findByFactura', Number(id)));
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return firstValueFrom(this.client.send('pagos.findOne', Number(id)));
  }
}

@Module({
  controllers: [FacturasGatewayController, PagosGatewayController],
})
export class FinanceGatewayModule {}
