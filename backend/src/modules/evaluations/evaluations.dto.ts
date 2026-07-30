import { IsEnum, IsInt, IsObject, IsString, IsUUID, Length, Max, Min } from 'class-validator';
import { EstadoObservacion } from '../../common/domain.enums';

export class CreateEvaluationDto {
  @IsUUID()
  id_proyecto: string;
}

export class AssignEvaluatorDto {
  @IsUUID()
  id_evaluador: string;
}

export class SaveAnswersDto {
  @IsObject()
  respuestas: Record<string, unknown>;
}

export class CreateObservationDto {
  @IsString()
  @Length(3, 4000)
  descripcion_problema: string;
}

export class UpdateObservationDto {
  @IsEnum(EstadoObservacion)
  estado: EstadoObservacion;
}

export class FinalRatingDto {
  @IsString()
  @Length(3, 4000)
  dictamen_auditoria: string;

  @IsInt()
  @Min(1)
  @Max(9)
  nivel_aprobado: number;
}
