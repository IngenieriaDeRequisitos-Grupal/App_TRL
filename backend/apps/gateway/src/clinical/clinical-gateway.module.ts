import { Body, Controller, Get, Inject, Module, Param, Patch, Post } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { CLINICAL_CLIENT } from '../clients.constants';

@Controller('teleconsultas')
export class TeleconsultasGatewayController {
  constructor(@Inject(CLINICAL_CLIENT) private readonly client: ClientProxy) {}

  @Post()
  create(@Body() body: any) {
    return firstValueFrom(this.client.send('teleconsultas.create', body));
  }

  @Get()
  findAll() {
    return firstValueFrom(this.client.send('teleconsultas.findAll', {}));
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return firstValueFrom(this.client.send('teleconsultas.findOne', Number(id)));
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: any) {
    return firstValueFrom(this.client.send('teleconsultas.update', { id: Number(id), data: body }));
  }

  @Patch(':id/finalizar')
  finalizar(@Param('id') id: string) {
    return firstValueFrom(this.client.send('teleconsultas.finalizar', Number(id)));
  }
}

@Controller('historiales-clinicos')
export class HistorialesGatewayController {
  constructor(@Inject(CLINICAL_CLIENT) private readonly client: ClientProxy) {}

  @Post()
  create(@Body() body: any) {
    return firstValueFrom(this.client.send('historiales.create', body));
  }

  @Get()
  findAll() {
    return firstValueFrom(this.client.send('historiales.findAll', {}));
  }

  @Get('paciente/:id_paciente')
  findByPaciente(@Param('id_paciente') id: string) {
    return firstValueFrom(this.client.send('historiales.findByPaciente', Number(id)));
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return firstValueFrom(this.client.send('historiales.findOne', Number(id)));
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: any) {
    return firstValueFrom(this.client.send('historiales.update', { id: Number(id), data: body }));
  }
}

@Controller('registros-evolucion')
export class RegistrosGatewayController {
  constructor(@Inject(CLINICAL_CLIENT) private readonly client: ClientProxy) {}

  @Post()
  create(@Body() body: any) {
    return firstValueFrom(this.client.send('registros.create', body));
  }

  @Get()
  findAll() {
    return firstValueFrom(this.client.send('registros.findAll', {}));
  }

  @Get('historial/:id_historial')
  findByHistorial(@Param('id_historial') id: string) {
    return firstValueFrom(this.client.send('registros.findByHistorial', Number(id)));
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return firstValueFrom(this.client.send('registros.findOne', Number(id)));
  }
}

@Controller('recetas-medicas')
export class RecetasGatewayController {
  constructor(@Inject(CLINICAL_CLIENT) private readonly client: ClientProxy) {}

  @Post()
  create(@Body() body: any) {
    return firstValueFrom(this.client.send('recetas.create', body));
  }

  @Get()
  findAll() {
    return firstValueFrom(this.client.send('recetas.findAll', {}));
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return firstValueFrom(this.client.send('recetas.findOne', Number(id)));
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: any) {
    return firstValueFrom(this.client.send('recetas.update', { id: Number(id), data: body }));
  }
}

@Controller('detalle-recetas')
export class DetalleRecetasGatewayController {
  constructor(@Inject(CLINICAL_CLIENT) private readonly client: ClientProxy) {}

  @Post()
  create(@Body() body: any) {
    return firstValueFrom(this.client.send('detalle_recetas.create', body));
  }

  @Get('receta/:id_receta')
  findByReceta(@Param('id_receta') id: string) {
    return firstValueFrom(this.client.send('detalle_recetas.findByReceta', Number(id)));
  }
}

@Controller('ordenes-examenes')
export class OrdenesGatewayController {
  constructor(@Inject(CLINICAL_CLIENT) private readonly client: ClientProxy) {}

  @Post()
  create(@Body() body: any) {
    return firstValueFrom(this.client.send('ordenes.create', body));
  }

  @Get('registro/:id_registro')
  findByRegistro(@Param('id_registro') id: string) {
    return firstValueFrom(this.client.send('ordenes.findByRegistro', Number(id)));
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return firstValueFrom(this.client.send('ordenes.findOne', Number(id)));
  }
}

@Module({
  controllers: [
    TeleconsultasGatewayController,
    HistorialesGatewayController,
    RegistrosGatewayController,
    RecetasGatewayController,
    DetalleRecetasGatewayController,
    OrdenesGatewayController,
  ],
})
export class ClinicalGatewayModule {}
