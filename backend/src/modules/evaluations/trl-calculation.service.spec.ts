import { ConflictException } from '@nestjs/common';
import { TrlCalculationService } from './trl-calculation.service';

describe('TrlCalculationService', () => {
  const service = new TrlCalculationService();
  const configuration = {
    reglas: Array.from({ length: 9 }, (_, index) => ({ level: index + 1, required: [`trl_${index + 1}`] })),
  };

  it('applies the sequential hard gate without skipping levels', () => {
    expect(service.calculate(configuration, { trl_1: true, trl_2: true, trl_3: false, trl_4: true })).toBe(2);
  });

  it('rejects incomplete institutional matrices', () => {
    expect(() => service.calculate({ reglas: [{ level: 1, required: ['a'] }] }, { a: true })).toThrow(ConflictException);
  });
});
