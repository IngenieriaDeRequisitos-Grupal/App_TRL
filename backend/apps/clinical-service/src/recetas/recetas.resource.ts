import { Controller, Injectable, Module } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { InjectRepository, TypeOrmModule } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomBytes } from 'crypto';
import { BaseCrudService } from '@app/common';
import { CreateRecetaMedicaDto, RecetaMedica, UpdateRecetaMedicaDto } from './receta-medica.entity';
import { RegistroEvolucion } from '../registros/registro-evolucion.entity';

@Injectable()
export class RecetasService extends BaseCrudService<RecetaMedica> {
  constructor(@InjectRepository(RecetaMedica) repo: Repository<RecetaMedica>) {
    super(repo);
  }

  create(dto: CreateRecetaMedicaDto) {
    const entity = this.repository.create({
      registro: { id: dto.id_registro } as RegistroEvolucion,
      id_medico: dto.id_medico,
      // Codigo criptografico unico que respalda el QR de validacion de la receta
      codigo_qr_criptografico: randomBytes(32).toString('hex'),
    });
    return this.repository.save(entity);
  }
}

@Controller()
export class RecetasController {
  constructor(private readonly service: RecetasService) {}

  @MessagePattern('recetas.create')
  create(@Payload() dto: CreateRecetaMedicaDto) {
    return this.service.create(dto);
  }

  @MessagePattern('recetas.findAll')
  findAll() {
    return this.service.findAll();
  }

  @MessagePattern('recetas.findOne')
  findOne(@Payload() id: number) {
    return this.service.findOne(id);
  }

  @MessagePattern('recetas.update')
  update(@Payload() payload: { id: number; data: UpdateRecetaMedicaDto }) {
    return this.service.update(payload.id, payload.data);
  }
}

@Module({
  imports: [TypeOrmModule.forFeature([RecetaMedica])],
  controllers: [RecetasController],
  providers: [RecetasService],
  exports: [RecetasService],
})
export class RecetasModule {}
