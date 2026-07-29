import { Body, Controller, Delete, Get, Inject, Module, Param, Patch, Post } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { REQUESTS_CLIENT } from '../clients.constants';

@Controller('solicitudes')
export class SolicitudesGatewayController {
  constructor(@Inject(REQUESTS_CLIENT) private readonly client: ClientProxy) {}

  @Post()
  create(@Body() body: any) {
    return firstValueFrom(this.client.send('solicitudes.create', body));
  }

  @Get()
  findAll() {
    return firstValueFrom(this.client.send('solicitudes.findAll', {}));
  }

  @Get('paciente/:id_paciente')
  findByPaciente(@Param('id_paciente') id: string) {
    return firstValueFrom(this.client.send('solicitudes.findByPaciente', Number(id)));
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return firstValueFrom(this.client.send('solicitudes.findOne', Number(id)));
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: any) {
    return firstValueFrom(this.client.send('solicitudes.update', { id: Number(id), data: body }));
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return firstValueFrom(this.client.send('solicitudes.remove', Number(id)));
  }
}

@Controller('asignaciones')
export class AsignacionesGatewayController {
  constructor(@Inject(REQUESTS_CLIENT) private readonly client: ClientProxy) {}

  @Post()
  create(@Body() body: any) {
    return firstValueFrom(this.client.send('asignaciones.create', body));
  }

  @Get()
  findAll() {
    return firstValueFrom(this.client.send('asignaciones.findAll', {}));
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return firstValueFrom(this.client.send('asignaciones.findOne', Number(id)));
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: any) {
    return firstValueFrom(this.client.send('asignaciones.update', { id: Number(id), data: body }));
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return firstValueFrom(this.client.send('asignaciones.remove', Number(id)));
  }
}

@Module({
  controllers: [SolicitudesGatewayController, AsignacionesGatewayController],
})
export class RequestsGatewayModule {}
