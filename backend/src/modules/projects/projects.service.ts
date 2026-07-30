import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NombreRol } from '../../common/domain.enums';
import { RequestPrincipal } from '../../common/security/security.decorators';
import { Investigador, ProyectoInvencion, ServicioNube } from '../../database/entities/trl.entities';
import { CreateProjectDto, ProjectListQueryDto, UpdateProjectDto } from './projects.dto';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(ProyectoInvencion) private readonly projects: Repository<ProyectoInvencion>,
    @InjectRepository(ServicioNube) private readonly persistence: Repository<ServicioNube>,
  ) {}

  async create(user: RequestPrincipal, dto: CreateProjectDto): Promise<ProyectoInvencion> {
    const adapter = await this.ensurePostgresAdapter();
    return this.projects.save(this.projects.create({
      titulo_tecnologia: dto.titulo_tecnologia.trim(),
      rama_innovacion: dto.rama_innovacion.trim(),
      investigador: { id_usuario: user.id_usuario } as Investigador,
      servicio_persistencia: adapter,
      nivel_trl_actual: null,
    }));
  }

  async list(user: RequestPrincipal, query: ProjectListQueryDto) {
    const builder = this.projects.createQueryBuilder('p')
      .leftJoin('p.investigador', 'i')
      .orderBy('p.fecha_creacion', 'DESC')
      .skip((query.page - 1) * query.limit)
      .take(query.limit);
    if (user.rol === NombreRol.INVESTIGADOR) {
      builder.where('i.id_usuario = :userId', { userId: user.id_usuario });
    } else if (user.rol === NombreRol.EVALUADOR) {
      builder.innerJoin('p.solicitudes', 's', 's.id_evaluador = :userId', { userId: user.id_usuario });
    }
    const [data, total] = await builder.getManyAndCount();
    return { data, total, page: query.page, limit: query.limit };
  }

  async update(user: RequestPrincipal, id: string, dto: UpdateProjectDto): Promise<ProyectoInvencion> {
    const project = await this.findOwned(user, id);
    if (dto.titulo_tecnologia !== undefined) project.titulo_tecnologia = dto.titulo_tecnologia.trim();
    if (dto.rama_innovacion !== undefined) project.rama_innovacion = dto.rama_innovacion.trim();
    return this.projects.save(project);
  }

  async findOwned(user: RequestPrincipal, id: string): Promise<ProyectoInvencion> {
    const project = await this.projects.findOne({ where: { id_proyecto: id }, relations: { investigador: true } });
    if (!project) throw new NotFoundException('Proyecto no encontrado');
    if (project.investigador.id_usuario !== user.id_usuario) throw new ForbiddenException('Acceso denegado al proyecto');
    return project;
  }

  private async ensurePostgresAdapter(): Promise<ServicioNube> {
    let adapter = await this.persistence.findOne({ where: { direccion_ip: 'postgresql://database' } });
    if (!adapter) {
      adapter = await this.persistence.save(this.persistence.create({
        direccion_ip: 'postgresql://database',
        protocolo_cifrado: 'TLS+AES-256-GCM',
        estado_microservicio: 'ACTIVO',
      }));
    }
    return adapter;
  }
}
