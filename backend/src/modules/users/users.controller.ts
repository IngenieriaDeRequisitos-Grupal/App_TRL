import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { NombreRol } from '../../common/domain.enums';
import { CurrentUser, RequestPrincipal, Roles } from '../../common/security/security.decorators';
import { CreateUsuarioDto, ListQueryDto, UpdateUsuarioAccessDto } from './users.dto';
import { UsersService } from './users.service';

@Controller('usuarios')
@Roles(NombreRol.ADMINISTRADOR)
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Post()
  create(@Body() dto: CreateUsuarioDto) {
    return this.users.create(dto);
  }

  @Get()
  @Roles(NombreRol.ADMINISTRADOR, NombreRol.GESTOR_IDI)
  list(@CurrentUser() user: RequestPrincipal, @Query() query: ListQueryDto) {
    return this.users.list(user, query);
  }

  @Patch(':id/access')
  updateAccess(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateUsuarioAccessDto,
  ) {
    return this.users.updateAccess(id, dto);
  }
}
