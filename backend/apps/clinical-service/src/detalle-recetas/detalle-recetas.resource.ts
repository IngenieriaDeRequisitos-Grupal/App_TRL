import { Controller, Injectable, Module } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { InjectRepository, TypeOrmModule } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseCrudService } from '@app/common';
import { CreateDetalleRecetaDto, DetalleReceta } from './detalle-receta.entity';
import { RecetaMedica } from '../recetas/receta-medica.entity';

@Injectable()
export class DetalleRecetasService extends BaseCrudService<DetalleReceta> {
  constructor(@InjectRepository(DetalleReceta) repo: Repository<DetalleReceta>) {
    super(repo);
  }

  create(dto: CreateDetalleRecetaDto) {
    const entity = this.repository.create({
      receta: { id: dto.id_receta } as RecetaMedica,
      nombre_medicamento: dto.nombre_medicamento,
      dosis: dto.dosis,
      frecuencia: dto.frecuencia,
      duracion_tratamiento: dto.duracion_tratamiento,
    });
    return this.repository.save(entity);
  }

  findByReceta(id_receta: number) {
    return this.repository.find({ where: { receta: { id: id_receta } } });
  }
}

@Controller()
export class DetalleRecetasController {
  constructor(private readonly service: DetalleRecetasService) {}

  @MessagePattern('detalle_recetas.create')
  create(@Payload() dto: CreateDetalleRecetaDto) {
    return this.service.create(dto);
  }

  @MessagePattern('detalle_recetas.findByReceta')
  findByReceta(@Payload() id_receta: number) {
    return this.service.findByReceta(id_receta);
  }

  @MessagePattern('detalle_recetas.remove')
  remove(@Payload() id: number) {
    return this.service.remove(id);
  }
}

@Module({
  imports: [TypeOrmModule.forFeature([DetalleReceta])],
  controllers: [DetalleRecetasController],
  providers: [DetalleRecetasService],
  exports: [DetalleRecetasService],
})
export class DetalleRecetasModule {}
