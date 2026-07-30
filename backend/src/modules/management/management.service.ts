import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import PDFDocument from 'pdfkit';
import { In, Repository } from 'typeorm';
import { CryptoService } from '../../common/security/crypto.service';
import { RequestPrincipal } from '../../common/security/security.decorators';
import { ConfiguracionTrl, Dashboard, GestorIdi, ProyectoInvencion, Reporte } from '../../database/entities/trl.entities';
import { TrlCalculationService } from '../evaluations/trl-calculation.service';
import { CreateTrlConfigurationDto, GenerateReportDto } from './management.dto';

@Injectable()
export class ManagementService {
  constructor(
    private readonly calculator: TrlCalculationService,
    private readonly crypto: CryptoService,
    @InjectRepository(ConfiguracionTrl) private readonly configurations: Repository<ConfiguracionTrl>,
    @InjectRepository(Dashboard) private readonly dashboards: Repository<Dashboard>,
    @InjectRepository(ProyectoInvencion) private readonly projects: Repository<ProyectoInvencion>,
    @InjectRepository(Reporte) private readonly reports: Repository<Reporte>,
  ) {}

  async configure(user: RequestPrincipal, dto: CreateTrlConfigurationDto) {
    this.calculator.validateConfiguration(dto.parametros_universidad);
    await this.configurations.update({ activa: true }, { activa: false });
    return this.configurations.save(this.configurations.create({
      version: dto.version.trim(),
      parametros_universidad: dto.parametros_universidad,
      activa: true,
      gestor: { id_usuario: user.id_usuario } as GestorIdi,
    }));
  }

  async dashboard(user: RequestPrincipal) {
    const totalProjects = await this.projects.count();
    const projectsWithApprovedTrl = await this.projects.createQueryBuilder('p')
      .where('p.nivel_trl_actual IS NOT NULL')
      .getCount();
    const rows = await this.projects.createQueryBuilder('p')
      .leftJoin('p.solicitudes', 's')
      .select("COALESCE(s.estado::text, 'SIN_SOLICITUD')", 'estado')
      .addSelect('COUNT(DISTINCT p.id_proyecto)', 'total')
      .groupBy("COALESCE(s.estado::text, 'SIN_SOLICITUD')")
      .getRawMany<{ estado: string; total: string }>();
    const requestStatistics = Object.fromEntries(rows.map((row) => {
      const label = row.estado === 'SIN_SOLICITUD'
        ? 'Invenciones sin solicitud'
        : `Solicitudes ${row.estado.toLocaleLowerCase('es')}`;
      return [label, Number(row.total)];
    }));
    const statistics = {
      'Total de invenciones': totalProjects,
      'Con TRL aprobado': projectsWithApprovedTrl,
      'Sin TRL aprobado': totalProjects - projectsWithApprovedTrl,
      ...requestStatistics,
    };
    return this.dashboards.save(this.dashboards.create({
      estadisticas_globales: statistics,
      estados_solicitudes: JSON.stringify(Object.keys(statistics).sort()),
      gestor: { id_usuario: user.id_usuario } as GestorIdi,
    }));
  }

  async generateReport(user: RequestPrincipal, dto: GenerateReportDto) {
    const ids = [...new Set(dto.project_ids)];
    if (ids.length === 0 || ids.length > 100) throw new BadRequestException('Seleccione entre 1 y 100 proyectos');
    const projects = await this.projects.find({ where: { id_proyecto: In(ids) }, order: { fecha_creacion: 'ASC' } });
    if (projects.length !== ids.length) throw new NotFoundException('Uno o más proyectos no existen');
    const bytes = await this.renderPdf(projects);
    const number = `TRL-${new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14)}-${this.crypto.sha256(ids.join(',')).slice(0, 8)}`;
    return this.reports.save(this.reports.create({
      numero_reporte: number,
      contenido_pdf: bytes,
      sha256: this.crypto.sha256(bytes),
      gestor: { id_usuario: user.id_usuario } as GestorIdi,
      proyectos: projects,
    }));
  }

  async downloadReport(number: string): Promise<{ filename: string; bytes: Buffer }> {
    const report = await this.reports.createQueryBuilder('r').addSelect('r.contenido_pdf')
      .where('r.numero_reporte = :number', { number }).getOne();
    if (!report) throw new NotFoundException('Reporte no encontrado');
    if (this.crypto.sha256(report.contenido_pdf) !== report.sha256) throw new BadRequestException('Integridad del reporte inválida');
    return { filename: `${number}.pdf`, bytes: report.contenido_pdf };
  }

  private renderPdf(projects: ProyectoInvencion[]): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      const document = new PDFDocument({ size: 'A4', margin: 50, info: { Title: 'Reporte TRL' } });
      document.on('data', (chunk: Buffer) => chunks.push(chunk));
      document.on('end', () => resolve(Buffer.concat(chunks)));
      document.on('error', reject);
      document.fontSize(18).text('Reporte de madurez tecnológica TRL');
      document.moveDown();
      for (const project of projects) {
        document.fontSize(11).text(`${project.titulo_tecnologia} | ${project.rama_innovacion} | TRL ${project.nivel_trl_actual ?? 'N/D'}`);
      }
      document.end();
    });
  }
}
