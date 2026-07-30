import { ConflictException, Injectable } from '@nestjs/common';

export interface TrlRule { level: number; required: string[] }

@Injectable()
export class TrlCalculationService {
  calculate(configuration: Record<string, unknown>, answers: Record<string, unknown>): number {
    const rawRules = configuration.reglas;
    if (!Array.isArray(rawRules)) throw new ConflictException('La configuración TRL activa no contiene reglas válidas');
    const rules = rawRules.map((raw) => this.parseRule(raw)).sort((a, b) => a.level - b.level);
    if (rules.length !== 9 || rules.some((rule, index) => rule.level !== index + 1)) {
      throw new ConflictException('La configuración debe definir exactamente los niveles TRL 1 a 9');
    }
    let achieved = 0;
    for (const rule of rules) {
      if (!rule.required.every((key) => answers[key] === true)) break;
      achieved = rule.level;
    }
    return achieved;
  }

  validateConfiguration(configuration: Record<string, unknown>): void {
    this.calculate(configuration, {});
  }

  private parseRule(value: unknown): TrlRule {
    if (!value || typeof value !== 'object') throw new ConflictException('Regla TRL inválida');
    const raw = value as Record<string, unknown>;
    if (!Number.isInteger(raw.level) || Number(raw.level) < 1 || Number(raw.level) > 9) {
      throw new ConflictException('Nivel TRL inválido');
    }
    if (!Array.isArray(raw.required) || raw.required.length === 0 || !raw.required.every((item) => typeof item === 'string')) {
      throw new ConflictException('Criterios TRL inválidos');
    }
    return { level: Number(raw.level), required: [...new Set(raw.required as string[])] };
  }
}
