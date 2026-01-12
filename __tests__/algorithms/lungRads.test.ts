import { assessLungRads } from '@lib/algorithms';
import { LungRadsAssessmentInput } from '@lib/algorithms/types';

describe('Lung-RADS v2022', () => {
  const basePatient = {
    clinicalContext: 'screening' as const,
    age: 60,
  };

  const baseNodule: LungRadsAssessmentInput['nodule'] = {
    type: 'solid',
    diameterMm: 4,
    solidComponentMm: undefined,
    isMultiple: false,
    isPerifissural: false,
    hasSpiculation: false,
    isJuxtapleural: false,
    isAirway: false,
    isAtypicalCyst: false,
    isNew: false,
    scanType: 'baseline',
  };

  function run(overrides: Partial<LungRadsAssessmentInput['nodule']>) {
    const nodule = { ...baseNodule, ...overrides };
    return assessLungRads({ patient: basePatient, nodule });
  }

  test('TC-LR-001 Baseline Solid 4mm -> Category 2', () => {
    const res = run({ type: 'solid', diameterMm: 4, scanType: 'baseline' });
    expect(res.category).toBe('2');
  });

  test('TC-LR-002 Baseline Solid 7mm -> Category 3', () => {
    const res = run({ type: 'solid', diameterMm: 7, scanType: 'baseline' });
    expect(res.category).toBe('3');
  });

  test('TC-LR-003 Baseline Solid 10mm -> Category 4A', () => {
    const res = run({ type: 'solid', diameterMm: 10, scanType: 'baseline' });
    expect(res.category).toBe('4A');
  });

  test('TC-LR-004 Baseline Solid 16mm -> Category 4B', () => {
    const res = run({ type: 'solid', diameterMm: 16, scanType: 'baseline' });
    expect(res.category).toBe('4B');
  });

  test('TC-LR-005 Follow-up New 5mm -> Category 3', () => {
    const res = run({ type: 'solid', diameterMm: 5, scanType: 'follow-up', isNew: true });
    expect(res.category).toBe('3');
  });

  test('TC-LR-006 Growth >1.5mm -> Category 4A/4B depending size', () => {
    const smallGrowing = run({
      type: 'solid',
      diameterMm: 7,
      scanType: 'follow-up',
      priorDiameterMm: 4,
      priorScanMonthsAgo: 12,
      isNew: false,
    });
    expect(['4A', '4B']).toContain(smallGrowing.category);

    const largeGrowing = run({
      type: 'solid',
      diameterMm: 10,
      scanType: 'follow-up',
      priorDiameterMm: 7,
      priorScanMonthsAgo: 12,
      isNew: false,
    });
    expect(largeGrowing.category).toBe('4B');
  });

  test('TC-LR-007 GGN 25mm -> Category 2', () => {
    const res = run({ type: 'ground-glass', diameterMm: 25 });
    expect(res.category).toBe('2');
  });

  test('TC-LR-008 GGN 35mm -> Category 3', () => {
    const res = run({ type: 'ground-glass', diameterMm: 35 });
    expect(res.category).toBe('3');
  });
});
