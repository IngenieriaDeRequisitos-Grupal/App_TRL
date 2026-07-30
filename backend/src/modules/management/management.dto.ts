import { IsObject, IsString, IsUUID, Length } from 'class-validator';

export class CreateTrlConfigurationDto {
  @IsString()
  @Length(1, 40)
  version: string;

  @IsObject()
  parametros_universidad: Record<string, unknown>;
}

export class GenerateReportDto {
  @IsUUID('4', { each: true })
  project_ids: string[];
}
