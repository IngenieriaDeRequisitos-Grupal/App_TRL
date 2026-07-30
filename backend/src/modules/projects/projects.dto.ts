import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Length, Max, Min } from 'class-validator';

export class CreateProjectDto {
  @IsString()
  @Length(3, 220)
  titulo_tecnologia: string;

  @IsString()
  @Length(2, 160)
  rama_innovacion: string;
}

export class UpdateProjectDto {
  @IsOptional()
  @IsString()
  @Length(3, 220)
  titulo_tecnologia?: string;

  @IsOptional()
  @IsString()
  @Length(2, 160)
  rama_innovacion?: string;
}

export class ProjectListQueryDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 20;
}
