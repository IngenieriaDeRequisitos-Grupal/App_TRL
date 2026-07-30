import { IsEnum, IsString, MaxLength, MinLength } from 'class-validator';
import { DecisionConsentimiento, TipoConsentimiento } from '../../common/domain.enums';

export class RegisterLegalDecisionDto {
  @IsEnum(TipoConsentimiento)
  tipo: TipoConsentimiento;

  @IsEnum(DecisionConsentimiento)
  decision: DecisionConsentimiento;

  @IsString() @MinLength(1) @MaxLength(40)
  version_documento: string;
}

export class WithdrawOptionalConsentDto {
  @IsString() @MinLength(3) @MaxLength(180)
  finalidad: string;
}
