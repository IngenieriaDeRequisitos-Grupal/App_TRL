import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'crypto';
import { Repository } from 'typeorm';
import { NombreRol } from '../../common/domain.enums';
import { CryptoService } from '../../common/security/crypto.service';
import { RequestPrincipal } from '../../common/security/security.decorators';
import { Cuestionario, DocumentoAdjunto } from '../../database/entities/trl.entities';

interface DownloadedEvidence { filename: string; mimeType: 'application/pdf'; bytes: Buffer }

@Injectable()
export class EvidenceService {
  constructor(
    private readonly config: ConfigService,
    private readonly crypto: CryptoService,
    @InjectRepository(Cuestionario) private readonly questionnaires: Repository<Cuestionario>,
    @InjectRepository(DocumentoAdjunto) private readonly documents: Repository<DocumentoAdjunto>,
  ) {}

  async upload(user: RequestPrincipal, questionnaireId: string, file?: Express.Multer.File) {
    if (!file) throw new BadRequestException('Archivo PDF requerido');
    this.validatePdf(file);
    const questionnaire = await this.questionnaires.findOne({
      where: { id_cuestionario: questionnaireId },
      relations: { solicitud: { proyecto: { investigador: true } } },
    });
    if (!questionnaire) throw new NotFoundException('Cuestionario no encontrado');
    if (questionnaire.solicitud.proyecto.investigador.id_usuario !== user.id_usuario) {
      throw new ForbiddenException('No puede adjuntar evidencias a este cuestionario');
    }
    const id = randomUUID();
    const safeName = file.originalname.replace(/[^a-zA-Z0-9._ -]/g, '_').slice(0, 255);
    const encrypted = this.crypto.encryptBuffer(file.buffer, `documento:${id}`);
    return this.documents.save(this.documents.create({
      id_documento: id,
      cuestionario: questionnaire,
      nombre_archivo: safeName || 'evidencia.pdf',
      url_bucket_protegido: `postgresql://documentos_adjuntos/${id}`,
      tipo_formato: 'application/pdf',
      contenido_cifrado: encrypted,
      sha256: this.crypto.sha256(file.buffer),
      tamano_bytes: file.size,
    }));
  }

  async download(user: RequestPrincipal, id: string): Promise<DownloadedEvidence> {
    const document = await this.documents.createQueryBuilder('d')
      .addSelect('d.contenido_cifrado')
      .leftJoinAndSelect('d.cuestionario', 'q')
      .leftJoinAndSelect('q.solicitud', 's')
      .leftJoinAndSelect('s.proyecto', 'p')
      .leftJoinAndSelect('p.investigador', 'i')
      .leftJoinAndSelect('s.evaluador', 'e')
      .where('d.id_documento = :id', { id })
      .getOne();
    if (!document) throw new NotFoundException('Evidencia no encontrada');
    const owner = document.cuestionario.solicitud.proyecto.investigador.id_usuario === user.id_usuario;
    const assigned = document.cuestionario.solicitud.evaluador?.id_usuario === user.id_usuario;
    const manager = user.rol === NombreRol.GESTOR_IDI;
    if (!owner && !assigned && !manager) throw new ForbiddenException('Acceso denegado a la evidencia');
    const bytes = this.crypto.decryptBuffer(document.contenido_cifrado, `documento:${id}`);
    if (this.crypto.sha256(bytes) !== document.sha256) throw new BadRequestException('Falló la verificación de integridad');
    return { filename: document.nombre_archivo, mimeType: 'application/pdf', bytes };
  }

  private validatePdf(file: Express.Multer.File): void {
    const max = Number(this.config.get('MAX_EVIDENCE_BYTES') ?? 10 * 1024 * 1024);
    if (file.size < 5 || file.size > max || file.mimetype !== 'application/pdf' || file.buffer.subarray(0, 5).toString() !== '%PDF-') {
      throw new BadRequestException('PDF inválido o tamaño no permitido');
    }
    const sample = file.buffer.toString('latin1');
    // WARNING: el filtro estructural no sustituye un sandbox antimalware; integrarlo exige infraestructura aislada y cuarentena asíncrona.
    if (/\/(JavaScript|JS|Launch|EmbeddedFile)\b/i.test(sample)) {
      throw new BadRequestException('El PDF contiene elementos activos no permitidos');
    }
  }
}
