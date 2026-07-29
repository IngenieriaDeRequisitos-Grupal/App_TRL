import { Body, Controller, Delete, Get, Inject, Module, Param, Patch, Post } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { INTEGRATION_CLIENT } from '../clients.constants';

@Controller('entidades-externas')
export class EntidadesGatewayController {
  constructor(@Inject(INTEGRATION_CLIENT) private readonly client: ClientProxy) {}

  @Post()
  create(@Body() body: any) {
    return firstValueFrom(this.client.send('entidades_externas.create', body));
  }

  @Get()
  findAll() {
    return firstValueFrom(this.client.send('entidades_externas.findAll', {}));
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return firstValueFrom(this.client.send('entidades_externas.findOne', Number(id)));
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: any) {
    return firstValueFrom(this.client.send('entidades_externas.update', { id: Number(id), data: body }));
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return firstValueFrom(this.client.send('entidades_externas.remove', Number(id)));
  }
}

@Controller('logs-interoperabilidad')
export class LogsGatewayController {
  constructor(@Inject(INTEGRATION_CLIENT) private readonly client: ClientProxy) {}

  @Post()
  create(@Body() body: any) {
    return firstValueFrom(this.client.send('logs_interoperabilidad.create', body));
  }

  @Get()
  findAll() {
    return firstValueFrom(this.client.send('logs_interoperabilidad.findAll', {}));
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return firstValueFrom(this.client.send('logs_interoperabilidad.findOne', Number(id)));
  }
}

@Module({
  controllers: [EntidadesGatewayController, LogsGatewayController],
})
export class IntegrationGatewayModule {}
