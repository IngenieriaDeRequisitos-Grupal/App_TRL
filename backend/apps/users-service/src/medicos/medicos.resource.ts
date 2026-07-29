import { Controller, Injectable, Module } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { InjectRepository, TypeOrmModule } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseCrudService } from '@app/common';
import { CreateMedicoDto, Medico, UpdateMedicoDto } from './medico.entity';
import { Usuario } from '../usuarios/usuario.entity';
import { CentroMedico } from '../centros-medicos/centro-medico.entity';

@Injectable()
export class MedicosService extends BaseCrudService<Medico> {
  constructor(@InjectRepository(Medico) repo: Repository<Medico>) {
    super(repo);
  }

  create(dto: CreateMedicoDto) {
    const entity = this.repository.create({
      usuario: { id: dto.id_usuario } as Usuario,
      centro: dto.id_centro ? ({ id: dto.id_centro } as CentroMedico) : undefined,
      nombres: dto.nombres,
      apellidos: dto.apellidos,
      especialidad: dto.especialidad,
      licencia_medica: dto.licencia_medica,
      disponibilidad_actual: dto.disponibilidad_actual,
    });
    return this.repository.save(entity);
  }

  async update(id: number, dto: UpdateMedicoDto) {
    await this.findOne(id);
    await this.repository.save({
      id,
      nombres: dto.nombres,
      apellidos: dto.apellidos,
      especialidad: dto.especialidad,
      licencia_medica: dto.licencia_medica,
      disponibilidad_actual: dto.disponibilidad_actual,
      centro: dto.id_centro ? ({ id: dto.id_centro } as CentroMedico) : undefined,
    });
    return this.findOne(id);
  }

  findByEspecialidad(especialidad: string) {
    return this.repository.find({ where: { especialidad } });
  }
}

@Controller()
export class MedicosController {
  constructor(private readonly service: MedicosService) {}

  @MessagePattern('medicos.create')
  create(@Payload() dto: CreateMedicoDto) {
    return this.service.create(dto);
  }

  @MessagePattern('medicos.findAll')
  findAll() {
    return this.service.findAll();
  }

  @MessagePattern('medicos.findOne')
  findOne(@Payload() id: number) {
    return this.service.findOne(id);
  }

  @MessagePattern('medicos.findByEspecialidad')
  findByEspecialidad(@Payload() especialidad: string) {
    return this.service.findByEspecialidad(especialidad);
  }

  @MessagePattern('medicos.update')
  update(@Payload() payload: { id: number; data: UpdateMedicoDto }) {
    return this.service.update(payload.id, payload.data);
  }

  @MessagePattern('medicos.remove')
  remove(@Payload() id: number) {
    return this.service.remove(id);
  }
}

@Module({
  imports: [TypeOrmModule.forFeature([Medico])],
  controllers: [MedicosController],
  providers: [MedicosService],
  exports: [MedicosService],
})
export class MedicosModule {}
