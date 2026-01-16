import { assessFleischner } from '@lib/algorithms';
import { FleischnerAssessmentInput } from '@lib/algorithms/types';

describe('Fleischner 2017', () => {
  const basePatient = {
    clinicalContext: 'incidental' as const,
    age: 50,
    riskLevel: 'low' as const,
    hasKnownMalignancy: false,
    isImmunocompromised: false,
  };

  function run(input: Partial<FleischnerAssessmentInput['nodule']> & { type: any; diameterMm: number }, risk?: 'low' | 'high') {
    return assessFleischner({
      patient: { ...basePatient, riskLevel: risk ?? basePatient.riskLevel },
      nodule: {
        type: input.type,
        diameterMm: input.diameterMm,
        solidComponentMm: input.solidComponentMm,
        isMultiple: input.isMultiple ?? false,
        isPerifissural: input.isPerifissural ?? false,
        hasSpiculation: false,
      },
    });
  }

  test('TC-F-001 Solid 4mm low risk -> No routine follow-up', () => {
    const res = run({ type: 'solid', diameterMm: 4 }, 'low');
    expect(res.recommendation).toMatch(/No routine follow-up/i);
  });

  test('TC-F-002 Solid 5mm high risk -> Optional CT 12 months', () => {
    const res = run({ type: 'solid', diameterMm: 5 }, 'high');
    expect(res.recommendation).toMatch(/Optional CT at 12 months/i);
  });

  test('TC-F-003 Solid 7mm low risk -> CT 6-12 months', () => {
    const res = run({ type: 'solid', diameterMm: 7 }, 'low');
    expect(res.recommendation).toMatch(/6-12 months/i);
  });

  test('TC-F-004 Solid 7mm high risk -> CT 6-12 then 18-24', () => {
    const res = run({ type: 'solid', diameterMm: 7 }, 'high');
    expect(res.recommendation).toMatch(/6-12 months; then/i);
  });

  test('TC-F-005 Solid 10mm -> CT 3mo/PET/biopsy', () => {
    const res = run({ type: 'solid', diameterMm: 10 }, 'high');
    expect(res.recommendation).toMatch(/PET\/?CT|PET\/CT|tissue sampling/i);
  });

  test('TC-F-006 GGN 4mm -> No routine follow-up', () => {
    const res = run({ type: 'ground-glass', diameterMm: 4 });
    expect(res.recommendation).toMatch(/No routine follow-up/i);
  });

  test('TC-F-007 GGN 8mm -> CT 6-12mo then q2y', () => {
    const res = run({ type: 'ground-glass', diameterMm: 8 });
    expect(res.recommendation).toMatch(/6-12 months/i);
  });

  test('TC-F-008 Part-solid 8mm solid 4mm -> CT 3-6mo annual', () => {
    const res = run({ type: 'part-solid', diameterMm: 8, solidComponentMm: 4 });
    expect(res.recommendation).toMatch(/3-6 months/i);
  });

  test('TC-F-009 Part-solid 10mm solid 7mm -> PET/biopsy/resection', () => {
    const res = run({ type: 'part-solid', diameterMm: 10, solidComponentMm: 7 });
    expect(res.recommendation).toMatch(/PET|biopsy|excision/i);
  });

  test('TC-F-010 Perifissural solid 8mm -> No routine follow-up', () => {
    const res = run({ type: 'solid', diameterMm: 8, isPerifissural: true });
    expect(res.recommendation).toMatch(/No routine follow-up/i);
  });

  test('TC-F-011 Multiple GGN <6mm high risk -> CT 3-6 months, consider 2 & 4 years', () => {
    const res = run({ type: 'ground-glass', diameterMm: 4, isMultiple: true }, 'high');
    expect(res.recommendation).toMatch(/3-6 months/i);
    expect(res.recommendation).toMatch(/2 and 4 years/i);
  });

  test('TC-F-012 Multiple GGN ≥6mm -> CT 3-6 months dominant nodule', () => {
    const res = run({ type: 'ground-glass', diameterMm: 8, isMultiple: true });
    expect(res.recommendation).toMatch(/3-6 months/i);
    expect(res.recommendation).toMatch(/most suspicious|dominant/i);
  });

  test('TC-F-013 Multiple part-solid ≥6mm solid <6mm -> Annual CT for 5 years', () => {
    const res = run({ type: 'part-solid', diameterMm: 8, solidComponentMm: 3, isMultiple: true });
    expect(res.recommendation).toMatch(/annual/i);
    expect(res.recommendation).toMatch(/5 years/i);
  });

  test('TC-F-014 Multiple part-solid ≥6mm solid ≥6mm -> Consider PET/CT/biopsy', () => {
    const res = run({ type: 'part-solid', diameterMm: 10, solidComponentMm: 7, isMultiple: true });
    expect(res.recommendation).toMatch(/PET|biopsy|excisi|surgical/i);
  });

  test('TC-F-015 Solid 5.6mm rounds to 6mm -> CT 6-12 months', () => {
    const res = run({ type: 'solid', diameterMm: 5.6 }, 'low');
    expect(res.recommendation).toMatch(/6-12 months/i);
  });
});
