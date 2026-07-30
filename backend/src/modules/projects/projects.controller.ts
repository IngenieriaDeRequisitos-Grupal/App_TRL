import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { NombreRol } from '../../common/domain.enums';
import { CurrentUser, RequestPrincipal, Roles } from '../../common/security/security.decorators';
import { CreateProjectDto, ProjectListQueryDto, UpdateProjectDto } from './projects.dto';
import { ProjectsService } from './projects.service';

@Controller('projects')
export class ProjectsController {
  constructor(private readonly projects: ProjectsService) {}

  @Post()
  @Roles(NombreRol.INVESTIGADOR)
  create(@CurrentUser() user: RequestPrincipal, @Body() dto: CreateProjectDto) {
    return this.projects.create(user, dto);
  }

  @Get()
  @Roles(NombreRol.INVESTIGADOR, NombreRol.EVALUADOR, NombreRol.ADMINISTRADOR)
  list(@CurrentUser() user: RequestPrincipal, @Query() query: ProjectListQueryDto) {
    return this.projects.list(user, query);
  }

  @Patch(':id')
  @Roles(NombreRol.INVESTIGADOR)
  update(@CurrentUser() user: RequestPrincipal, @Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateProjectDto) {
    return this.projects.update(user, id, dto);
  }
}
