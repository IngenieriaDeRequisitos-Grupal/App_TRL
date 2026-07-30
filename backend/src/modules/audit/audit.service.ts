import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventoAuditoria } from '../../database/entities/trl.entities';

@Injectable()
export class AuditService {
  constructor(@InjectRepository(EventoAuditoria) private readonly events: Repository<EventoAuditoria>) {}

  async list() {
    return this.events.find({ order: { fecha_evento: 'DESC' }, take: 100 });
  }
}
