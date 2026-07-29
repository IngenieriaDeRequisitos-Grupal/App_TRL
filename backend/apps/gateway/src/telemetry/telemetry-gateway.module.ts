import { Body, Controller, Delete, Get, Inject, Module, Param, Patch, Post } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { TELEMETRY_CLIENT } from '../clients.constants';

@Controller('dispositivos-iot')
export class DispositivosGatewayController {
  constructor(@Inject(TELEMETRY_CLIENT) private readonly client: ClientProxy) {}

  @Post()
  create(@Body() body: any) {
    return firstValueFrom(this.client.send('dispositivos.create', body));
  }

  @Get()
  findAll() {
    return firstValueFrom(this.client.send('dispositivos.findAll', {}));
  }

  @Get('paciente/:id_paciente')
  findByPaciente(@Param('id_paciente') id: string) {
    return firstValueFrom(this.client.send('dispositivos.findByPaciente', Number(id)));
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return firstValueFrom(this.client.send('dispositivos.findOne', Number(id)));
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: any) {
    return firstValueFrom(this.client.send('dispositivos.update', { id: Number(id), data: body }));
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return firstValueFrom(this.client.send('dispositivos.remove', Number(id)));
  }
}

@Controller('lecturas-signos-vitales')
export class LecturasGatewayController {
  constructor(@Inject(TELEMETRY_CLIENT) private readonly client: ClientProxy) {}

  @Post()
  create(@Body() body: any) {
    return firstValueFrom(this.client.send('lecturas.create', body));
  }

  @Get()
  findAll() {
    return firstValueFrom(this.client.send('lecturas.findAll', {}));
  }

  @Get('dispositivo/:id_dispositivo')
  findByDispositivo(@Param('id_dispositivo') id: string) {
    return firstValueFrom(this.client.send('lecturas.findByDispositivo', Number(id)));
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return firstValueFrom(this.client.send('lecturas.findOne', Number(id)));
  }
}

@Controller('alertas-medicas')
export class AlertasGatewayController {
  constructor(@Inject(TELEMETRY_CLIENT) private readonly client: ClientProxy) {}

  @Get()
  findAll() {
    return firstValueFrom(this.client.send('alertas.findAll', {}));
  }

  @Get('paciente/:id_paciente')
  findByPaciente(@Param('id_paciente') id: string) {
    return firstValueFrom(this.client.send('alertas.findByPaciente', Number(id)));
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return firstValueFrom(this.client.send('alertas.findOne', Number(id)));
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: any) {
    return firstValueFrom(this.client.send('alertas.update', { id: Number(id), data: body }));
  }
}

@Module({
  controllers: [DispositivosGatewayController, LecturasGatewayController, AlertasGatewayController],
})
export class TelemetryGatewayModule {}
