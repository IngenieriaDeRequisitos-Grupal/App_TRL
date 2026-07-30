import { Controller, Get, Param, ParseUUIDPipe, Post, Res, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { memoryStorage } from 'multer';
import { NombreRol } from '../../common/domain.enums';
import { CurrentUser, RequestPrincipal, Roles } from '../../common/security/security.decorators';
import { EvidenceService } from './evidence.service';

@Controller('evidence')
export class EvidenceController {
  constructor(private readonly evidence: EvidenceService) {}

  @Post('questionnaires/:id')
  @Roles(NombreRol.INVESTIGADOR)
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage(), limits: { files: 1 } }))
  upload(@CurrentUser() user: RequestPrincipal, @Param('id', ParseUUIDPipe) id: string, @UploadedFile() file?: Express.Multer.File) {
    return this.evidence.upload(user, id, file);
  }

  @Get(':id')
  @Roles(NombreRol.INVESTIGADOR, NombreRol.EVALUADOR, NombreRol.GESTOR_IDI)
  async download(
    @CurrentUser() user: RequestPrincipal,
    @Param('id', ParseUUIDPipe) id: string,
    @Res() response: Response,
  ): Promise<void> {
    const result = await this.evidence.download(user, id);
    response.setHeader('Content-Type', result.mimeType);
    response.setHeader('Content-Disposition', `attachment; filename="${result.filename.replace(/["\\]/g, '_')}"`);
    response.setHeader('Cache-Control', 'no-store');
    response.send(result.bytes);
  }
}
