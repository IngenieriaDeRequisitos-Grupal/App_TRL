import { Controller, Injectable, Module } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { InjectRepository, TypeOrmModule } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseCrudService } from '@app/common';
import { CreatePacienteDto, Paciente, UpdatePacienteDto } from './paciente.entity';
import { Usuario } from '../usuarios/usuario.entity';

@Injectable()
export class PacientesService extends BaseCrudService<Paciente> {
  constructor(@InjectRepository(Paciente) repo: Repository<Paciente>) {
    super(repo);
  }

  create(dto: CreatePacienteDto) {
    const entity = this.repository.create({
      usuario: { id: dto.id_usuario } as Usuario,
      cedula: dto.cedula,
      nombres: dto.nombres,
      apellidos: dto.apellidos,
      fecha_nacimiento: dto.fecha_nacimiento,
      telefono: dto.telefono,
      direccion: dto.direccion,
      contacto_emergencia: dto.contacto_emergencia,
    });
    return this.repository.save(entity);
  }

  findByCedula(cedula: string) {
    return this.repository.findOne({ where: { cedula } });
  }
}

@Controller()
export class PacientesController {
  constructor(private readonly service: PacientesService) {}

  @MessagePattern('pacientes.create')
  create(@Payload() dto: CreatePacienteDto) {
    return this.service.create(dto);
  }

  @MessagePattern('pacientes.findAll')
  findAll() {
    return this.service.findAll();
  }

  @MessagePattern('pacientes.findOne')
  findOne(@Payload() id: number) {
    return this.service.findOne(id);
  }

  @MessagePattern('pacientes.findByCedula')
  findByCedula(@Payload() cedula: string) {
    return this.service.findByCedula(cedula);
  }

  @MessagePattern('pacientes.update')
  update(@Payload() payload: { id: number; data: UpdatePacienteDto }) {
    return this.service.update(payload.id, payload.data);
  }

  @MessagePattern('pacientes.remove')
  remove(@Payload() id: number) {
    return this.service.remove(id);
  }
}

@Module({
  imports: [TypeOrmModule.forFeature([Paciente])],
  controllers: [PacientesController],
  providers: [PacientesService],
  exports: [PacientesService],
})
export class PacientesModule {}
