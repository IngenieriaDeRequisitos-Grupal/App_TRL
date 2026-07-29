import { Body, Controller, Delete, Get, Inject, Module, Param, Patch, Post } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { USERS_CLIENT } from '../clients.constants';

@Controller('roles')
export class RolesGatewayController {
  constructor(@Inject(USERS_CLIENT) private readonly client: ClientProxy) {}

  @Post()
  create(@Body() body: any) {
    return firstValueFrom(this.client.send('roles.create', body));
  }

  @Get()
  findAll() {
    return firstValueFrom(this.client.send('roles.findAll', {}));
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return firstValueFrom(this.client.send('roles.findOne', Number(id)));
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: any) {
    return firstValueFrom(this.client.send('roles.update', { id: Number(id), data: body }));
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return firstValueFrom(this.client.send('roles.remove', Number(id)));
  }
}

@Controller('usuarios')
export class UsuariosGatewayController {
  constructor(@Inject(USERS_CLIENT) private readonly client: ClientProxy) {}

  @Post()
  create(@Body() body: any) {
    return firstValueFrom(this.client.send('usuarios.create', body));
  }

  @Get()
  findAll() {
    return firstValueFrom(this.client.send('usuarios.findAll', {}));
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return firstValueFrom(this.client.send('usuarios.findOne', Number(id)));
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: any) {
    return firstValueFrom(this.client.send('usuarios.update', { id: Number(id), data: body }));
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return firstValueFrom(this.client.send('usuarios.remove', Number(id)));
  }
}

@Controller('medicos')
export class MedicosGatewayController {
  constructor(@Inject(USERS_CLIENT) private readonly client: ClientProxy) {}

  @Post()
  create(@Body() body: any) {
    return firstValueFrom(this.client.send('medicos.create', body));
  }

  @Get()
  findAll() {
    return firstValueFrom(this.client.send('medicos.findAll', {}));
  }

  @Get('especialidad/:especialidad')
  findByEspecialidad(@Param('especialidad') especialidad: string) {
    return firstValueFrom(this.client.send('medicos.findByEspecialidad', especialidad));
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return firstValueFrom(this.client.send('medicos.findOne', Number(id)));
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: any) {
    return firstValueFrom(this.client.send('medicos.update', { id: Number(id), data: body }));
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return firstValueFrom(this.client.send('medicos.remove', Number(id)));
  }
}

@Controller('pacientes')
export class PacientesGatewayController {
  constructor(@Inject(USERS_CLIENT) private readonly client: ClientProxy) {}

  @Post()
  create(@Body() body: any) {
    return firstValueFrom(this.client.send('pacientes.create', body));
  }

  @Get()
  findAll() {
    return firstValueFrom(this.client.send('pacientes.findAll', {}));
  }

  @Get('cedula/:cedula')
  findByCedula(@Param('cedula') cedula: string) {
    return firstValueFrom(this.client.send('pacientes.findByCedula', cedula));
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return firstValueFrom(this.client.send('pacientes.findOne', Number(id)));
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: any) {
    return firstValueFrom(this.client.send('pacientes.update', { id: Number(id), data: body }));
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return firstValueFrom(this.client.send('pacientes.remove', Number(id)));
  }
}

@Controller('centros-medicos')
export class CentrosMedicosGatewayController {
  constructor(@Inject(USERS_CLIENT) private readonly client: ClientProxy) {}

  @Post()
  create(@Body() body: any) {
    return firstValueFrom(this.client.send('centros_medicos.create', body));
  }

  @Get()
  findAll() {
    return firstValueFrom(this.client.send('centros_medicos.findAll', {}));
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return firstValueFrom(this.client.send('centros_medicos.findOne', Number(id)));
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: any) {
    return firstValueFrom(this.client.send('centros_medicos.update', { id: Number(id), data: body }));
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return firstValueFrom(this.client.send('centros_medicos.remove', Number(id)));
  }
}

@Controller('auditoria')
export class AuditoriaGatewayController {
  constructor(@Inject(USERS_CLIENT) private readonly client: ClientProxy) {}

  @Post()
  create(@Body() body: any) {
    return firstValueFrom(this.client.send('auditoria.create', body));
  }

  @Get()
  findAll() {
    return firstValueFrom(this.client.send('auditoria.findAll', {}));
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return firstValueFrom(this.client.send('auditoria.findOne', Number(id)));
  }
}

@Controller('consentimientos')
export class ConsentimientosGatewayController {
  constructor(@Inject(USERS_CLIENT) private readonly client: ClientProxy) {}

  @Post()
  create(@Body() body: any) {
    return firstValueFrom(this.client.send('consentimientos.create', body));
  }

  @Get()
  findAll() {
    return firstValueFrom(this.client.send('consentimientos.findAll', {}));
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return firstValueFrom(this.client.send('consentimientos.findOne', Number(id)));
  }
}

@Module({
  controllers: [
    RolesGatewayController,
    UsuariosGatewayController,
    MedicosGatewayController,
    PacientesGatewayController,
    CentrosMedicosGatewayController,
    AuditoriaGatewayController,
    ConsentimientosGatewayController,
  ],
})
export class UsersGatewayModule {}
