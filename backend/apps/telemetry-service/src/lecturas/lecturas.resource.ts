import { Controller, Inject, Injectable, Module } from '@nestjs/common';
import { ClientProxy, ClientsModule, MessagePattern, Payload, Transport } from '@nestjs/microservices';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { InjectRepository, TypeOrmModule } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseCrudService, TELEMETRY_EVENT_PATTERNS } from '@app/common';
import { CreateLecturaSignoVitalDto, LecturaSignoVital } from './lectura-signo-vital.entity';
import { DispositivoIoT } from '../dispositivos/dispositivo-iot.entity';
import { AlertaMedica } from '../alertas/alerta-medica.entity';
import { evaluarUmbralClinico } from './umbrales.util';

export const TELEMETRY_RMQ_CLIENT = 'TELEMETRY_RMQ_CLIENT';

@Injectable()
export class LecturasService extends BaseCrudService<LecturaSignoVital> {
  constructor(
    @InjectRepository(LecturaSignoVital) repo: Repository<LecturaSignoVital>,
    @InjectRepository(DispositivoIoT) private readonly dispositivosRepo: Repository<DispositivoIoT>,
    @InjectRepository(AlertaMedica) private readonly alertasRepo: Repository<AlertaMedica>,
    @Inject(TELEMETRY_RMQ_CLIENT) private readonly rmqClient: ClientProxy,
  ) {
    super(repo);
  }

  async create(dto: CreateLecturaSignoVitalDto): Promise<LecturaSignoVital> {
    const entity = this.repository.create({
      dispositivo: { id: dto.id_dispositivo } as DispositivoIoT,
      tipo_medicion: dto.tipo_medicion,
      valor: dto.valor,
      unidad: dto.unidad,
    });
    const lectura = await this.repository.save(entity);
    this.rmqClient.emit(TELEMETRY_EVENT_PATTERNS.LECTURA_CREADA, lectura);

    const gravedad = evaluarUmbralClinico(dto.tipo_medicion, dto.valor);
    if (gravedad) {
      const dispositivo = await this.dispositivosRepo.findOne({ where: { id: dto.id_dispositivo } });
      const alerta = await this.alertasRepo.save(
        this.alertasRepo.create({
          id_paciente: dispositivo?.id_paciente,
          lectura,
          tipo_alerta: `${dto.tipo_medicion}_FUERA_DE_RANGO`,
          nivel_gravedad: gravedad,
        }),
      );
      this.rmqClient.emit(TELEMETRY_EVENT_PATTERNS.ALERTA_GENERADA, alerta);
    }

    return lectura;
  }

  findByDispositivo(id_dispositivo: number) {
    return this.repository.find({ where: { dispositivo: { id: id_dispositivo } }, order: { fecha_hora: 'DESC' } });
  }
}

@Controller()
export class LecturasController {
  constructor(private readonly service: LecturasService) {}

  @MessagePattern('lecturas.create')
  create(@Payload() dto: CreateLecturaSignoVitalDto) {
    return this.service.create(dto);
  }

  @MessagePattern('lecturas.findAll')
  findAll() {
    return this.service.findAll();
  }

  @MessagePattern('lecturas.findOne')
  findOne(@Payload() id: number) {
    return this.service.findOne(id);
  }

  @MessagePattern('lecturas.findByDispositivo')
  findByDispositivo(@Payload() id_dispositivo: number) {
    return this.service.findByDispositivo(id_dispositivo);
  }
}

@Module({
  imports: [
    TypeOrmModule.forFeature([LecturaSignoVital, DispositivoIoT, AlertaMedica]),
    ClientsModule.registerAsync([
      {
        name: TELEMETRY_RMQ_CLIENT,
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (config: ConfigService) => ({
          transport: Transport.RMQ,
          options: {
            urls: [config.get<string>('RABBITMQ_URL') || 'amqp://localhost:5672'],
            queue: config.get<string>('RABBITMQ_TELEMETRY_QUEUE') || 'telemetry_events_queue',
            queueOptions: { durable: true },
          },
        }),
      },
    ]),
  ],
  controllers: [LecturasController],
  providers: [LecturasService],
  exports: [LecturasService],
})
export class LecturasModule {}
