import { Controller, Injectable, Module } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { InjectRepository, TypeOrmModule } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseCrudService } from '@app/common';
import { ConsentimientoPaciente, CreateConsentimientoDto } from './consentimiento-paciente.entity';
import { Paciente } from '../pacientes/paciente.entity';

@Injectable()
export class ConsentimientosService extends BaseCrudService<ConsentimientoPaciente> {
  constructor(@InjectRepository(ConsentimientoPaciente) repo: Repository<ConsentimientoPaciente>) {
    super(repo);
  }

  create(dto: CreateConsentimientoDto) {
    const entity = this.repository.create({
      paciente: { id: dto.id_paciente } as Paciente,
      tipo_consentimiento: dto.tipo_consentimiento,
      version_terminos: dto.version_terminos,
    });
    return this.repository.save(entity);
  }
}

@Controller()
export class ConsentimientosController {
  constructor(private readonly service: ConsentimientosService) {}

  @MessagePattern('consentimientos.create')
  create(@Payload() dto: CreateConsentimientoDto) {
    return this.service.create(dto);
  }

  @MessagePattern('consentimientos.findAll')
  findAll() {
    return this.service.findAll();
  }

  @MessagePattern('consentimientos.findOne')
  findOne(@Payload() id: number) {
    return this.service.findOne(id);
  }
}

@Module({
  imports: [TypeOrmModule.forFeature([ConsentimientoPaciente])],
  controllers: [ConsentimientosController],
  providers: [ConsentimientosService],
  exports: [ConsentimientosService],
})
export class ConsentimientosModule {}
