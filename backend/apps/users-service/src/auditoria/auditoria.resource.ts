import { Controller, Injectable, Module } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { InjectRepository, TypeOrmModule } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseCrudService } from '@app/common';
import { AuditoriaAcceso, CreateAuditoriaDto } from './auditoria-acceso.entity';
import { Usuario } from '../usuarios/usuario.entity';

@Injectable()
export class AuditoriaService extends BaseCrudService<AuditoriaAcceso> {
  constructor(@InjectRepository(AuditoriaAcceso) repo: Repository<AuditoriaAcceso>) {
    super(repo);
  }

  create(dto: CreateAuditoriaDto) {
    const entity = this.repository.create({
      usuario: { id: dto.id_usuario } as Usuario,
      accion_realizada: dto.accion_realizada,
      tabla_afectada: dto.tabla_afectada,
      direccion_ip: dto.direccion_ip,
    });
    return this.repository.save(entity);
  }
}

@Controller()
export class AuditoriaController {
  constructor(private readonly service: AuditoriaService) {}

  @MessagePattern('auditoria.create')
  create(@Payload() dto: CreateAuditoriaDto) {
    return this.service.create(dto);
  }

  @MessagePattern('auditoria.findAll')
  findAll() {
    return this.service.findAll();
  }

  @MessagePattern('auditoria.findOne')
  findOne(@Payload() id: number) {
    return this.service.findOne(id);
  }
}

@Module({
  imports: [TypeOrmModule.forFeature([AuditoriaAcceso])],
  controllers: [AuditoriaController],
  providers: [AuditoriaService],
  exports: [AuditoriaService],
})
export class AuditoriaModule {}
