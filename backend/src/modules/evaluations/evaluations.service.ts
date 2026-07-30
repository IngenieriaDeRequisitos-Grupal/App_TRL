import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { EstadoObservacion, EstadoProgreso, EstadoSolicitud, NombreRol } from '../../common/domain.enums';
import { RequestPrincipal } from '../../common/security/security.decorators';
import {
  CalificacionFinal,
  ConfiguracionTrl,
  Cuestionario,
  Evaluador,
  NivelTrl,
  Observacion,
  ProyectoInvencion,
  SolicitudEvaluacion,
} from '../../database/entities/trl.entities';
import { ProjectsService } from '../projects/projects.service';
import {
  AssignEvaluatorDto,
  CreateEvaluationDto,
  CreateObservationDto,
  FinalRatingDto,
  SaveAnswersDto,
  UpdateObservationDto,
} from './evaluations.dto';
import { TrlCalculationService } from './trl-calculation.service';

@Injectable()
export class EvaluationsService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly projects: ProjectsService,
    private readonly calculator: TrlCalculationService,
    @InjectRepository(SolicitudEvaluacion) private readonly requests: Repository<SolicitudEvaluacion>,
    @InjectRepository(ConfiguracionTrl) private readonly configurations: Repository<ConfiguracionTrl>,
    @InjectRepository(Evaluador) private readonly evaluators: Repository<Evaluador>,
    @InjectRepository(Observacion) private readonly observations: Repository<Observacion>,
  ) {}

  async create(user: RequestPrincipal, dto: CreateEvaluationDto): Promise<SolicitudEvaluacion> {
    const project = await this.projects.findOwned(user, dto.id_proyecto);
    const existing = await this.requests.exists({
      where: { proyecto: { id_proyecto: project.id_proyecto }, estado: EstadoSolicitud.BORRADOR },
    });
    if (existing) throw new ConflictException('Ya existe una solicitud en borrador para el proyecto');
    const config = await this.configurations.findOne({ where: { activa: true }, order: { fecha_creacion: 'DESC' } });
    if (!config) throw new ConflictException('No existe una configuración TRL activa');
    this.calculator.validateConfiguration(config.parametros_universidad);
    return this.dataSource.transaction(async (manager) => {
      const request = await manager.getRepository(SolicitudEvaluacion).save(
        manager.getRepository(SolicitudEvaluacion).create({ proyecto: project, estado: EstadoSolicitud.BORRADOR }),
      );
      const questionnaire = await manager.getRepository(Cuestionario).save(manager.getRepository(Cuestionario).create({
        solicitud: request,
        configuracion: config,
        respuestas_json: {},
        estado_progreso: EstadoProgreso.NO_INICIADO,
      }));
      return Object.assign(request, { cuestionario: questionnaire });
    });
  }

  async list(user: RequestPrincipal) {
    const builder = this.requests.createQueryBuilder('s')
      .leftJoinAndSelect('s.proyecto', 'p')
      .leftJoinAndSelect('p.investigador', 'i')
      .leftJoinAndSelect('s.evaluador', 'e')
      .leftJoinAndSelect('s.cuestionario', 'q')
      .leftJoinAndSelect('s.nivel', 'n')
      .leftJoinAndSelect('s.observaciones', 'o')
      .leftJoinAndSelect('s.calificacion', 'c')
      .orderBy('s.fecha_envio', 'DESC');
    if (user.rol === NombreRol.INVESTIGADOR) {
      builder.where('i.id_usuario = :userId', { userId: user.id_usuario });
    } else if (user.rol === NombreRol.EVALUADOR) {
      builder.where('e.id_usuario = :userId', { userId: user.id_usuario });
    }
    const requests = await builder.getMany();
    return requests.map((request) => ({
      id_solicitud: request.id_solicitud,
      fecha_envio: request.fecha_envio,
      estado: request.estado,
      proyecto: {
        id_proyecto: request.proyecto.id_proyecto,
        titulo_tecnologia: request.proyecto.titulo_tecnologia,
        rama_innovacion: request.proyecto.rama_innovacion,
      },
      id_evaluador: request.evaluador?.id_usuario ?? null,
      id_cuestionario: request.cuestionario?.id_cuestionario ?? null,
      respuestas: request.cuestionario?.respuestas_json ?? {},
      nivel_estimado: request.nivel?.valor_estimado ?? null,
      observaciones: (request.observaciones ?? [])
        .sort((left, right) => right.fecha_creacion.getTime() - left.fecha_creacion.getTime())
        .map((observation) => ({
          id_observacion: observation.id_observacion,
          descripcion_problema: observation.descripcion_problema,
          fecha_creacion: observation.fecha_creacion,
          estado: observation.estado,
        })),
      calificacion: request.calificacion
        ? {
          id_calificacion: request.calificacion.id_calificacion,
          dictamen_auditoria: request.calificacion.dictamen_auditoria,
          nivel_aprobado: request.calificacion.nivel_aprobado,
          fecha_calificacion: request.calificacion.fecha_calificacion,
        }
        : null,
    }));
  }

  async saveAnswers(user: RequestPrincipal, requestId: string, dto: SaveAnswersDto) {
    const request = await this.ownerRequest(user, requestId);
    if (![EstadoSolicitud.BORRADOR, EstadoSolicitud.OBSERVADA].includes(request.estado)) {
      throw new ConflictException('La solicitud ya no permite editar respuestas');
    }
    const level = this.calculator.calculate(request.cuestionario.configuracion.parametros_universidad, dto.respuestas);
    request.cuestionario.respuestas_json = dto.respuestas;
    request.cuestionario.estado_progreso = level > 0 ? EstadoProgreso.EN_PROGRESO : EstadoProgreso.NO_INICIADO;
    await this.dataSource.transaction(async (manager) => {
      await manager.getRepository(Cuestionario).save(request.cuestionario);
      const existing = await manager.getRepository(NivelTrl).findOne({ where: { solicitud: { id_solicitud: requestId } } });
      await manager.getRepository(NivelTrl).save(existing
        ? Object.assign(existing, { valor_estimado: level })
        : manager.getRepository(NivelTrl).create({ solicitud: request, valor_estimado: level }));
    });
    return { id_solicitud: requestId, nivel_estimado: level, estado_progreso: request.cuestionario.estado_progreso };
  }

  async submit(user: RequestPrincipal, requestId: string) {
    const request = await this.ownerRequest(user, requestId);
    const evidenceCount = await this.dataSource.getRepository(Cuestionario)
      .createQueryBuilder('q').leftJoin('q.documentos', 'd')
      .where('q.id_cuestionario = :id', { id: request.cuestionario.id_cuestionario })
      .getCount();
    if (evidenceCount < 1) throw new BadRequestException('Debe adjuntar al menos una evidencia PDF');
    request.cuestionario.estado_progreso = EstadoProgreso.COMPLETADO;
    request.estado = EstadoSolicitud.ENVIADA;
    await this.dataSource.transaction(async (manager) => {
      await manager.getRepository(Cuestionario).save(request.cuestionario);
      await manager.getRepository(SolicitudEvaluacion).save(request);
    });
    return { id_solicitud: requestId, estado: request.estado };
  }

  async assign(requestId: string, dto: AssignEvaluatorDto) {
    const request = await this.findRequest(requestId);
    if (![EstadoSolicitud.ENVIADA, EstadoSolicitud.ASIGNADA].includes(request.estado)) {
      throw new ConflictException('La solicitud no está disponible para asignación');
    }
    const evaluator = await this.evaluators.findOne({ where: { id_usuario: dto.id_evaluador } });
    if (!evaluator) throw new NotFoundException('Evaluador no encontrado');
    if (request.proyecto.investigador.id_usuario === evaluator.id_usuario) {
      throw new ConflictException('El investigador del proyecto no puede evaluar su propia solicitud');
    }
    request.evaluador = evaluator;
    request.estado = EstadoSolicitud.ASIGNADA;
    await this.requests.save(request);
    return { id_solicitud: requestId, id_evaluador: evaluator.id_usuario, estado: request.estado };
  }

  async addObservation(user: RequestPrincipal, requestId: string, dto: CreateObservationDto) {
    const request = await this.assignedRequest(user, requestId);
    if (![EstadoSolicitud.ASIGNADA, EstadoSolicitud.EN_EVALUACION, EstadoSolicitud.OBSERVADA].includes(request.estado)) {
      throw new ConflictException('La solicitud no admite observaciones');
    }
    const observation = await this.observations.save(this.observations.create({
      solicitud: request,
      evaluador: { id_usuario: user.id_usuario } as Evaluador,
      investigador: request.proyecto.investigador,
      descripcion_problema: dto.descripcion_problema.trim(),
      estado: EstadoObservacion.PENDIENTE,
    }));
    request.estado = EstadoSolicitud.OBSERVADA;
    await this.requests.save(request);
    return observation;
  }

  async updateObservation(user: RequestPrincipal, observationId: string, dto: UpdateObservationDto) {
    const observation = await this.observations.findOne({
      where: { id_observacion: observationId },
      relations: { investigador: true, evaluador: true },
    });
    if (!observation) throw new NotFoundException('Observación no encontrada');
    const allowed = user.rol === NombreRol.INVESTIGADOR
      ? observation.investigador.id_usuario === user.id_usuario && dto.estado === EstadoObservacion.CORREGIDA
      : observation.evaluador.id_usuario === user.id_usuario && dto.estado === EstadoObservacion.CERRADA;
    if (!allowed) throw new ForbiddenException('Transición de observación no autorizada');
    observation.estado = dto.estado;
    return this.observations.save(observation);
  }

  async rate(user: RequestPrincipal, requestId: string, dto: FinalRatingDto) {
    const request = await this.assignedRequest(user, requestId);
    if (![EstadoSolicitud.ASIGNADA, EstadoSolicitud.EN_EVALUACION, EstadoSolicitud.OBSERVADA].includes(request.estado)) {
      throw new ConflictException('La solicitud no puede calificarse');
    }
    const openObservations = await this.observations.count({
      where: { solicitud: { id_solicitud: requestId }, estado: EstadoObservacion.PENDIENTE },
    });
    if (openObservations > 0) throw new ConflictException('Existen observaciones pendientes');
    const estimated = request.nivel?.valor_estimado ?? 0;
    if (dto.nivel_aprobado > estimated) throw new BadRequestException('El nivel aprobado no puede superar el nivel estimado');
    return this.dataSource.transaction(async (manager) => {
      const rating = await manager.getRepository(CalificacionFinal).save(manager.getRepository(CalificacionFinal).create({
        solicitud: request,
        evaluador: { id_usuario: user.id_usuario } as Evaluador,
        dictamen_auditoria: dto.dictamen_auditoria.trim(),
        nivel_aprobado: dto.nivel_aprobado,
      }));
      request.estado = EstadoSolicitud.EVALUADA;
      request.proyecto.nivel_trl_actual = dto.nivel_aprobado;
      await manager.getRepository(SolicitudEvaluacion).save(request);
      await manager.getRepository(ProyectoInvencion).save(request.proyecto);
      return rating;
    });
  }

  private async ownerRequest(user: RequestPrincipal, id: string): Promise<SolicitudEvaluacion> {
    const request = await this.findRequest(id);
    if (request.proyecto.investigador.id_usuario !== user.id_usuario) throw new ForbiddenException('Acceso denegado');
    return request;
  }

  private async assignedRequest(user: RequestPrincipal, id: string): Promise<SolicitudEvaluacion> {
    const request = await this.findRequest(id);
    if (!request.evaluador || request.evaluador.id_usuario !== user.id_usuario) throw new ForbiddenException('Solicitud no asignada');
    return request;
  }

  private async findRequest(id: string): Promise<SolicitudEvaluacion> {
    const request = await this.requests.findOne({
      where: { id_solicitud: id },
      relations: {
        proyecto: { investigador: true },
        evaluador: true,
        cuestionario: { configuracion: true },
        nivel: true,
      },
    });
    if (!request) throw new NotFoundException('Solicitud no encontrada');
    return request;
  }
}
