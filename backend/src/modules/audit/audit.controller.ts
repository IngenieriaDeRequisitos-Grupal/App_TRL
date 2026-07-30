import { Controller, Get } from '@nestjs/common';
import { NombreRol } from '../../common/domain.enums';
import { Roles } from '../../common/security/security.decorators';
import { AuditService } from './audit.service';

@Controller('audit')
@Roles(NombreRol.ADMINISTRADOR, NombreRol.GESTOR_IDI)
export class AuditController {
  constructor(private readonly audit: AuditService) {}

  @Get()
  list() {
    return this.audit.list();
  }
}
