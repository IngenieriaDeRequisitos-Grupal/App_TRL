import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Put } from '@nestjs/common';
import { NombreRol } from '../../common/domain.enums';
import { CurrentUser, RequestPrincipal, Roles } from '../../common/security/security.decorators';
import { AssignEvaluatorDto, CreateEvaluationDto, CreateObservationDto, FinalRatingDto, SaveAnswersDto, UpdateObservationDto } from './evaluations.dto';
import { EvaluationsService } from './evaluations.service';

@Controller('evaluations')
export class EvaluationsController {
  constructor(private readonly evaluations: EvaluationsService) {}

  @Get()
  @Roles(NombreRol.INVESTIGADOR, NombreRol.EVALUADOR, NombreRol.GESTOR_IDI, NombreRol.ADMINISTRADOR)
  list(@CurrentUser() user: RequestPrincipal) { return this.evaluations.list(user); }

  @Post()
  @Roles(NombreRol.INVESTIGADOR)
  create(@CurrentUser() user: RequestPrincipal, @Body() dto: CreateEvaluationDto) { return this.evaluations.create(user, dto); }

  @Put(':id/answers')
  @Roles(NombreRol.INVESTIGADOR)
  answers(@CurrentUser() user: RequestPrincipal, @Param('id', ParseUUIDPipe) id: string, @Body() dto: SaveAnswersDto) {
    return this.evaluations.saveAnswers(user, id, dto);
  }

  @Post(':id/submit')
  @Roles(NombreRol.INVESTIGADOR)
  submit(@CurrentUser() user: RequestPrincipal, @Param('id', ParseUUIDPipe) id: string) { return this.evaluations.submit(user, id); }

  @Patch(':id/assign')
  @Roles(NombreRol.GESTOR_IDI, NombreRol.ADMINISTRADOR)
  assign(@Param('id', ParseUUIDPipe) id: string, @Body() dto: AssignEvaluatorDto) { return this.evaluations.assign(id, dto); }

  @Post(':id/observations')
  @Roles(NombreRol.EVALUADOR)
  observe(@CurrentUser() user: RequestPrincipal, @Param('id', ParseUUIDPipe) id: string, @Body() dto: CreateObservationDto) {
    return this.evaluations.addObservation(user, id, dto);
  }

  @Patch('observations/:id')
  @Roles(NombreRol.INVESTIGADOR, NombreRol.EVALUADOR)
  updateObservation(@CurrentUser() user: RequestPrincipal, @Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateObservationDto) {
    return this.evaluations.updateObservation(user, id, dto);
  }

  @Post(':id/rating')
  @Roles(NombreRol.EVALUADOR)
  rate(@CurrentUser() user: RequestPrincipal, @Param('id', ParseUUIDPipe) id: string, @Body() dto: FinalRatingDto) {
    return this.evaluations.rate(user, id, dto);
  }
}
