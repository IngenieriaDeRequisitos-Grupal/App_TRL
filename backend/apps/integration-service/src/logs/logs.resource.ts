import { Controller, Injectable, Module } from '@nestjs/common';
import { EventPattern, MessagePattern, Payload } from '@nestjs/microservices';
import { InjectRepository, TypeOrmModule } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseCrudService, TELEMETRY_EVENT_PATTERNS } from '@app/common';
import { CreateLogInteroperabilidadDto, LogInteroperabilidad } from './log-interoperabilidad.entity';
import { EntidadExterna } from '../entidades/entidad-externa.entity';

@Injectable()
export class LogsService extends BaseCrudService<LogInteroperabilidad> {
  constructor(@InjectRepository(LogInteroperabilidad) repo: Repository<LogInteroperabilidad>) {
    super(repo);
  }

  create(dto: CreateLogInteroperabilidadDto) {
    const entity = this.repository.create({
      entidad: { id: dto.id_entidad } as EntidadExterna,
      tipo_transaccion: dto.tipo_transaccion,
      estado_respuesta_api: dto.estado_respuesta_api,
    });
    return this.repository.save(entity);
  }

  /** Registra automaticamente la notificacion de una alerta medica generada por telemetry-service. */
  registrarNotificacionAlerta(alerta: { id: number; nivel_gravedad: string }) {
    const entity = this.repository.create({
      tipo_transaccion: `NOTIFICACION_ALERTA_MEDICA#${alerta.id}`,
      estado_respuesta_api: `RECIBIDA_${alerta.nivel_gravedad}`,
    });
    return this.repository.save(entity);
  }
}

@Controller()
export class LogsController {
  constructor(private readonly service: LogsService) {}

  @MessagePattern('logs_interoperabilidad.create')
  create(@Payload() dto: CreateLogInteroperabilidadDto) {
    return this.service.create(dto);
  }

  @MessagePattern('logs_interoperabilidad.findAll')
  findAll() {
    return this.service.findAll();
  }

  @MessagePattern('logs_interoperabilidad.findOne')
  findOne(@Payload() id: number) {
    return this.service.findOne(id);
  }

  @EventPattern(TELEMETRY_EVENT_PATTERNS.ALERTA_GENERADA)
  async onAlertaGenerada(@Payload() alerta: { id: number; nivel_gravedad: string }) {
    await this.service.registrarNotificacionAlerta(alerta);
  }
}

@Module({
  imports: [TypeOrmModule.forFeature([LogInteroperabilidad])],
  controllers: [LogsController],
  providers: [LogsService],
  exports: [LogsService],
})
export class LogsModule {}
