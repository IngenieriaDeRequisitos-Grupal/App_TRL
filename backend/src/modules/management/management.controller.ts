import { Body, Controller, Get, Param, Post, Res } from '@nestjs/common';
import { Response } from 'express';
import { NombreRol } from '../../common/domain.enums';
import { CurrentUser, RequestPrincipal, Roles } from '../../common/security/security.decorators';
import { CreateTrlConfigurationDto, GenerateReportDto } from './management.dto';
import { ManagementService } from './management.service';

@Controller('management')
@Roles(NombreRol.GESTOR_IDI)
export class ManagementController {
  constructor(private readonly management: ManagementService) {}

  @Post('trl-configurations')
  @Roles(NombreRol.ADMINISTRADOR)
  configure(@CurrentUser() user: RequestPrincipal, @Body() dto: CreateTrlConfigurationDto) {
    return this.management.configure(user, dto);
  }

  @Post('dashboard')
  dashboard(@CurrentUser() user: RequestPrincipal) { return this.management.dashboard(user); }

  @Post('reports')
  @Roles(NombreRol.ADMINISTRADOR)
  report(@CurrentUser() user: RequestPrincipal, @Body() dto: GenerateReportDto) {
    return this.management.generateReport(user, dto);
  }

  @Get('reports/:number')
  @Roles(NombreRol.ADMINISTRADOR)
  async download(@Param('number') number: string, @Res() response: Response): Promise<void> {
    const report = await this.management.downloadReport(number);
    response.setHeader('Content-Type', 'application/pdf');
    response.setHeader('Content-Disposition', `attachment; filename="${report.filename}"`);
    response.setHeader('Cache-Control', 'no-store');
    response.send(report.bytes);
  }
}
