import { assessLungRads, calculateLungRadsGrowth, assessFleischner } from '@lib/algorithms';
import { LungRadsAssessmentInput } from '@lib/algorithms/types';

const screeningPatient = { clinicalContext: 'screening' as const, age: 60 };

const baseNodule: LungRadsAssessmentInput['nodule'] = {
  type: 'solid',
  diameterMm: 7,
  isMultiple: false,
  scanType: 'baseline',
};

function runLungRads(
  overrides: Partial<LungRadsAssessmentInput['nodule']>,
  extra?: { priorCategory?: string; priorStatus?: 'stable' | 'decreasing' | 'progression' },
) {
  return assessLungRads({
    patient: screeningPatient,
    nodule: { ...baseNodule, ...overrides },
    ...extra,
  });
}

// P0-1: S as additive modifier
describe('TC-AUDIT P0-1: S modifier', () => {
  test('TC-AUDIT-001 hasSignificantFinding appends S to base category', () => {
    const res = runLungRads({ diameterMm: 4, hasSignificantFinding: true });
    expect(res.category).toBe('2S');
  });

  test('TC-AUDIT-002 S modifier on Cat 3 baseline', () => {
    const res = runLungRads({ diameterMm: 7, hasSignificantFinding: true });
    expect(res.category).toBe('3S');
  });

  test('TC-AUDIT-003 S modifier on Cat 4A', () => {
    const res = runLungRads({ diameterMm: 10, hasSignificantFinding: true });
    expect(res.category).toBe('4AS');
  });

  test('TC-AUDIT-004 S modifier on Cat 4B', () => {
    const res = runLungRads({ diameterMm: 16, hasSignificantFinding: true });
    expect(res.category).toBe('4BS');
  });

  test('TC-AUDIT-005 S modifier includes base category recommendation', () => {
    const res = runLungRads({ diameterMm: 7, hasSignificantFinding: true });
    expect(res.recommendation).toContain('hallazgos significativos');
    expect(res.followUpInterval).toBe('6 meses');
  });

  test('TC-AUDIT-006 S modifier warning present', () => {
    const res = runLungRads({ diameterMm: 7, hasSignificantFinding: true });
    expect(res.warnings).toEqual(expect.arrayContaining([expect.stringMatching(/modificador S/)]));
  });
});

// P0-2: Growth rule with long intervals
describe('TC-AUDIT P0-2: Growth long intervals', () => {
  test('TC-AUDIT-010 Growth 2mm in 24 months -> not ACR growth nor proven slow growth; classified by size (4A) with warning', () => {
    const res = runLungRads({
      diameterMm: 8,
      scanType: 'follow-up',
      priorDiameterMm: 6,
      priorScanMonthsAgo: 24,
    });
    expect(res.category).toBe('4A');
    expect(res.warnings).toEqual(expect.arrayContaining([expect.stringMatching(/intervalo >12 meses/i)]));
  });

  test('TC-AUDIT-010b Minimal increase 6 -> 6.1mm in 24 months -> classified by size (3), not slow growth', () => {
    const res = runLungRads({
      diameterMm: 6.1,
      scanType: 'follow-up',
      priorDiameterMm: 6,
      priorScanMonthsAgo: 24,
    });
    expect(res.category).toBe('3');
    expect(res.warnings).toEqual(expect.arrayContaining([expect.stringMatching(/intervalo >12 meses/i)]));
  });

  test('TC-AUDIT-010c Increase 6 -> 7.6mm in 24 months -> classified by size (3), not 4B', () => {
    const res = runLungRads({
      diameterMm: 7.6,
      scanType: 'follow-up',
      priorDiameterMm: 6,
      priorScanMonthsAgo: 24,
    });
    expect(res.category).toBe('3');
    expect(res.warnings).toEqual(expect.arrayContaining([expect.stringMatching(/intervalo >12 meses/i)]));
  });

  test('TC-AUDIT-010d GGN 20 -> 35mm in 24 months -> provisional 3 by size: stability cannot be credited', () => {
    const res = runLungRads({
      type: 'ground-glass',
      diameterMm: 35,
      scanType: 'follow-up',
      priorDiameterMm: 20,
      priorScanMonthsAgo: 24,
    });
    expect(res.category).toBe('3');
    expect(res.warnings).toEqual(expect.arrayContaining([expect.stringMatching(/intervalo >12 meses/i)]));
    expect(res.warnings).toEqual(expect.arrayContaining([expect.stringMatching(/no se puede acreditar estabilidad/i)]));
  });

  test('TC-AUDIT-010e GGN 35 -> 35mm in 24 months -> stable, Category 2', () => {
    const res = runLungRads({
      type: 'ground-glass',
      diameterMm: 35,
      scanType: 'follow-up',
      priorDiameterMm: 35,
      priorScanMonthsAgo: 24,
    });
    expect(res.category).toBe('2');
    const hasLongIntervalWarning = res.warnings?.some(w => /intervalo >12 meses/i.test(w));
    expect(hasLongIntervalWarning).toBeFalsy();
  });

  test('TC-AUDIT-010f GGN 40 -> 35mm in 24 months -> decreased, Category 2', () => {
    const res = runLungRads({
      type: 'ground-glass',
      diameterMm: 35,
      scanType: 'follow-up',
      priorDiameterMm: 40,
      priorScanMonthsAgo: 24,
    });
    expect(res.category).toBe('2');
    const hasLongIntervalWarning = res.warnings?.some(w => /intervalo >12 meses/i.test(w));
    expect(hasLongIntervalWarning).toBeFalsy();
  });

  test('TC-AUDIT-011 Growth 2mm in 12 months -> no long interval warning', () => {
    const res = runLungRads({
      diameterMm: 8,
      scanType: 'follow-up',
      priorDiameterMm: 6,
      priorScanMonthsAgo: 12,
    });
    const hasLongIntervalWarning = res.warnings?.some(w => /intervalo >12 meses/i.test(w));
    expect(hasLongIntervalWarning).toBeFalsy();
  });

  test('TC-AUDIT-011b Stable nodule over 24 months -> standard classification, no slow growth', () => {
    const res = runLungRads({
      diameterMm: 6,
      scanType: 'follow-up',
      priorDiameterMm: 6,
      priorScanMonthsAgo: 24,
    });
    expect(res.category).toBe('3');
    const hasLongIntervalWarning = res.warnings?.some(w => /intervalo >12 meses/i.test(w));
    expect(hasLongIntervalWarning).toBeFalsy();
  });

  test('TC-AUDIT-012 calculateLungRadsGrowth backward compatible', () => {
    expect(calculateLungRadsGrowth(8, 6, 12)).toBe(true);
    expect(calculateLungRadsGrowth(7, 6, 12)).toBe(false);
  });
});

// P0-3: Part-solid follow-up
describe('TC-AUDIT P0-3: Part-solid follow-up', () => {
  test('TC-AUDIT-020 New part-solid <6mm in follow-up -> Cat 3', () => {
    const res = runLungRads({
      type: 'part-solid',
      diameterMm: 5,
      solidComponentMm: 2,
      scanType: 'follow-up',
      isNew: true,
    });
    expect(res.category).toBe('3');
  });

  test('TC-AUDIT-021 New part-solid with solid >=4mm in follow-up -> Cat 4B', () => {
    const res = runLungRads({
      type: 'part-solid',
      diameterMm: 15,
      solidComponentMm: 4,
      scanType: 'follow-up',
      isNew: true,
    });
    expect(res.category).toBe('4B');
  });

  test('TC-AUDIT-022 Growing part-solid with solid <4mm -> Cat 4A', () => {
    const res = runLungRads({
      type: 'part-solid',
      diameterMm: 12,
      solidComponentMm: 3,
      scanType: 'follow-up',
      priorDiameterMm: 11,
      priorSolidComponentMm: 1,
      priorScanMonthsAgo: 6,
    });
    expect(res.category).toBe('4A');
  });

  test('TC-AUDIT-022b Total diameter grows but solid component stable -> no escalation', () => {
    const res = runLungRads({
      type: 'part-solid',
      diameterMm: 12,
      solidComponentMm: 3,
      scanType: 'follow-up',
      priorDiameterMm: 9,
      priorSolidComponentMm: 3,
      priorScanMonthsAgo: 6,
    });
    expect(res.category).toBe('3');
  });

  test('TC-AUDIT-022c New solid component 0 -> 0.5mm -> Cat 4A (new <4mm)', () => {
    const res = runLungRads({
      type: 'part-solid',
      diameterMm: 12,
      solidComponentMm: 0.5,
      scanType: 'follow-up',
      priorDiameterMm: 12,
      priorSolidComponentMm: 0,
      priorScanMonthsAgo: 12,
    });
    expect(res.category).toBe('4A');
  });

  test('TC-AUDIT-022d New solid component 0 -> 1.5mm -> Cat 4A (new <4mm)', () => {
    const res = runLungRads({
      type: 'part-solid',
      diameterMm: 12,
      solidComponentMm: 1.5,
      scanType: 'follow-up',
      priorDiameterMm: 12,
      priorSolidComponentMm: 0,
      priorScanMonthsAgo: 12,
    });
    expect(res.category).toBe('4A');
  });

  test('TC-AUDIT-022e New solid component 0 -> 4mm -> Cat 4B (new >=4mm)', () => {
    const res = runLungRads({
      type: 'part-solid',
      diameterMm: 12,
      solidComponentMm: 4,
      scanType: 'follow-up',
      priorDiameterMm: 12,
      priorSolidComponentMm: 0,
      priorScanMonthsAgo: 12,
    });
    expect(res.category).toBe('4B');
  });

  test('TC-AUDIT-022f Existing part-solid total <6mm with growing solid <4mm -> Cat 4A', () => {
    const res = runLungRads({
      type: 'part-solid',
      diameterMm: 5,
      solidComponentMm: 3.9,
      scanType: 'follow-up',
      priorDiameterMm: 5,
      priorSolidComponentMm: 2,
      priorScanMonthsAgo: 12,
    });
    expect(res.category).toBe('4A');
  });

  test('TC-AUDIT-022g Existing part-solid total <6mm with solid growing to >=4mm -> Cat 4B', () => {
    const res = runLungRads({
      type: 'part-solid',
      diameterMm: 5,
      solidComponentMm: 4,
      scanType: 'follow-up',
      priorDiameterMm: 5,
      priorSolidComponentMm: 2,
      priorScanMonthsAgo: 12,
    });
    expect(res.category).toBe('4B');
  });

  test('TC-AUDIT-023 Stable part-solid baseline classification preserved', () => {
    const res = runLungRads({
      type: 'part-solid',
      diameterMm: 12,
      solidComponentMm: 4,
      scanType: 'baseline',
    });
    expect(res.category).toBe('3');
  });
});

describe('TC-AUDIT P0-3b: Slow growth and decreasing follow-up', () => {
  test('TC-AUDIT-024 Solid slow-growing over multiple exams -> Cat 4B', () => {
    const res = runLungRads({
      type: 'solid',
      diameterMm: 7,
      scanType: 'follow-up',
      isSlowGrowing: true,
    });
    expect(res.category).toBe('4B');
  });

  test('TC-AUDIT-025 Part-solid slow-growing over multiple exams -> Cat 4B', () => {
    const res = runLungRads({
      type: 'part-solid',
      diameterMm: 8,
      solidComponentMm: 2,
      scanType: 'follow-up',
      isSlowGrowing: true,
    });
    expect(res.category).toBe('4B');
  });

  test('TC-AUDIT-026 GGN slow-growing can remain Cat 2', () => {
    const res = runLungRads({
      type: 'ground-glass',
      diameterMm: 35,
      scanType: 'follow-up',
      isSlowGrowing: true,
    });
    expect(res.category).toBe('2');
  });

  test('TC-AUDIT-027 Category 4A decreased -> step down to Cat 3', () => {
    const res = runLungRads(
      { diameterMm: 10, scanType: 'follow-up' },
      { priorCategory: '4A', priorStatus: 'decreasing' },
    );
    expect(res.category).toBe('3');
  });

  test('TC-AUDIT-028 New nodule ignores priorCategory/priorStatus (no step-down)', () => {
    const res = runLungRads(
      { diameterMm: 5, scanType: 'follow-up', isNew: true },
      { priorCategory: '3', priorStatus: 'stable' },
    );
    expect(res.category).toBe('3');
  });

  test('TC-AUDIT-029 New solid ignores isSlowGrowing -> new-nodule category (2)', () => {
    const res = runLungRads({
      type: 'solid',
      diameterMm: 3,
      scanType: 'follow-up',
      isNew: true,
      isSlowGrowing: true,
    });
    expect(res.category).toBe('2');
  });

  test('TC-AUDIT-029b New GGN >=30mm ignores isSlowGrowing -> Category 3 (new)', () => {
    const res = runLungRads({
      type: 'ground-glass',
      diameterMm: 35,
      scanType: 'follow-up',
      isNew: true,
      isSlowGrowing: true,
    });
    expect(res.category).toBe('3');
  });

  test('TC-AUDIT-029c New part-solid ignores isSlowGrowing -> 4A (new <4mm solid component)', () => {
    const res = runLungRads({
      type: 'part-solid',
      diameterMm: 12,
      solidComponentMm: 1,
      scanType: 'follow-up',
      isNew: true,
      isSlowGrowing: true,
    });
    expect(res.category).toBe('4A');
  });
});

// Growth threshold measured at clinical precision (one decimal, note 4)
describe('TC-AUDIT P0-2c: Growth boundary at one-decimal precision', () => {
  test.each([
    [2.9, 4.4],
    [6.8, 8.3],
    [0.1, 1.6],
    [4.1, 5.6],
  ])('TC-AUDIT-012x exact +1.5mm increase %s -> %s mm in 12 months is NOT growth', (prior, current) => {
    expect(calculateLungRadsGrowth(current, prior, 12)).toBe(false);
  });

  test.each([
    [2.9, 4.5],
    [6.8, 8.4],
    [0.1, 1.7],
    [4.1, 5.7],
  ])('TC-AUDIT-012y +1.6mm increase %s -> %s mm in 12 months IS growth', (prior, current) => {
    expect(calculateLungRadsGrowth(current, prior, 12)).toBe(true);
  });

  test('TC-AUDIT-012z Solid 6.8 -> 8.3mm in 12 months -> not growth, classified by size (4A)', () => {
    const res = runLungRads({
      diameterMm: 8.3,
      scanType: 'follow-up',
      priorDiameterMm: 6.8,
      priorScanMonthsAgo: 12,
    });
    expect(res.category).toBe('4A');
  });

  test('TC-AUDIT-012w Part-solid solid component 2.9 -> 4.4mm crossing 4mm -> not growth, Category 3', () => {
    const res = runLungRads({
      type: 'part-solid',
      diameterMm: 12,
      solidComponentMm: 4.4,
      scanType: 'follow-up',
      priorDiameterMm: 12,
      priorSolidComponentMm: 2.9,
      priorScanMonthsAgo: 12,
    });
    expect(res.category).toBe('3');
  });

  test('TC-AUDIT-012v Part-solid solid component 2.9 -> 4.5mm (+1.6mm) -> growing >=4mm, Category 4B', () => {
    const res = runLungRads({
      type: 'part-solid',
      diameterMm: 12,
      solidComponentMm: 4.5,
      scanType: 'follow-up',
      priorDiameterMm: 12,
      priorSolidComponentMm: 2.9,
      priorScanMonthsAgo: 12,
    });
    expect(res.category).toBe('4B');
  });
});

// ACR v2022 note 14: GGN doubling in 1 year increases suspicion
describe('TC-AUDIT P0-7: GGN doubling in one year (note 14)', () => {
  test('TC-AUDIT-060 GGN 30 -> 60mm in 12 months -> Category 3 with note 14 warning', () => {
    const res = runLungRads({
      type: 'ground-glass',
      diameterMm: 60,
      scanType: 'follow-up',
      priorDiameterMm: 30,
      priorScanMonthsAgo: 12,
    });
    expect(res.category).toBe('3');
    expect(res.warnings).toEqual(expect.arrayContaining([expect.stringMatching(/duplica.*4X|4X.*duplica/i)]));
  });

  test('TC-AUDIT-061 GGN 30 -> 59mm in 12 months -> Category 3 without doubling warning', () => {
    const res = runLungRads({
      type: 'ground-glass',
      diameterMm: 59,
      scanType: 'follow-up',
      priorDiameterMm: 30,
      priorScanMonthsAgo: 12,
    });
    expect(res.category).toBe('3');
    const hasDoublingWarning = res.warnings?.some(w => /duplica/i.test(w));
    expect(hasDoublingWarning).toBeFalsy();
  });

  test('TC-AUDIT-062 GGN 30 -> 60mm in 24 months -> provisional 3, no doubling warning (interval >12m)', () => {
    const res = runLungRads({
      type: 'ground-glass',
      diameterMm: 60,
      scanType: 'follow-up',
      priorDiameterMm: 30,
      priorScanMonthsAgo: 24,
    });
    expect(res.category).toBe('3');
    const hasDoublingWarning = res.warnings?.some(w => /duplica/i.test(w));
    expect(hasDoublingWarning).toBeFalsy();
  });
});

// P0-4: GGN >=30mm stable
describe('TC-AUDIT P0-4: GGN >=30mm stepped management', () => {
  test('TC-AUDIT-030 GGN >=30mm baseline -> Cat 3', () => {
    const res = runLungRads({ type: 'ground-glass', diameterMm: 35, scanType: 'baseline' });
    expect(res.category).toBe('3');
  });

  test('TC-AUDIT-031 GGN >=30mm stable with prior Cat 3 -> stepped to Cat 2', () => {
    const res = runLungRads(
      { type: 'ground-glass', diameterMm: 35, scanType: 'follow-up' },
      { priorCategory: '3', priorStatus: 'stable' },
    );
    expect(res.category).toBe('2');
  });
});

// P0-5: Category 0 for incomplete studies
describe('TC-AUDIT P0-5: Category 0', () => {
  test('TC-AUDIT-040 Incomplete study -> Cat 0', () => {
    const res = runLungRads({ isIncompleteStudy: true } as any);
    expect(res.category).toBe('0');
    expect(res.warnings).toEqual(expect.arrayContaining([expect.stringMatching(/incompleto/)]));
  });

  test('TC-AUDIT-041 Incomplete study takes priority over classification', () => {
    const res = runLungRads({ diameterMm: 10, isIncompleteStudy: true } as any);
    expect(res.category).toBe('0');
  });

  test('TC-AUDIT-042 Airway likely inflammatory/tubular -> Cat 0', () => {
    const res = runLungRads({
      isAirway: true,
      airwayLocation: 'subsegmental',
      airwayInflammatoryOrInfectious: true,
    });
    expect(res.category).toBe('0');
  });
});

// P0-6: Fleischner confirmatory CT
describe('TC-AUDIT P0-6: Fleischner part-solid confirmatory CT', () => {
  test('TC-AUDIT-050 Part-solid solid >=6mm -> confirmation CT before PET', () => {
    const res = assessFleischner({
      patient: { clinicalContext: 'incidental', age: 55, riskLevel: 'high' },
      nodule: { type: 'part-solid', diameterMm: 12, solidComponentMm: 8, isMultiple: false },
    });
    expect(res.recommendation).toMatch(/3-6 meses/);
    expect(res.recommendation).toMatch(/persistencia/);
    expect(res.recommendation).toMatch(/PET/);
  });

  test('TC-AUDIT-051 Part-solid solid <6mm -> annual surveillance (unchanged)', () => {
    const res = assessFleischner({
      patient: { clinicalContext: 'incidental', age: 55 },
      nodule: { type: 'part-solid', diameterMm: 10, solidComponentMm: 4, isMultiple: false },
    });
    expect(res.recommendation).toMatch(/anual/i);
  });
});
