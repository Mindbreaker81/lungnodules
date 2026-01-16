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

  test('TC-LR-009 Benign/no nodules -> Category 1', () => {
    const res = run({ isBenign: true });
    expect(res.category).toBe('1');
  });

  test('TC-LR-010 Significant findings -> Category S', () => {
    const res = run({ hasSignificantFinding: true });
    expect(res.category).toBe('S');
  });

  test('TC-LR-011 Inflammatory category 0 -> Category 0', () => {
    const res = run({ isInflammatory: true, inflammatoryCategory: 'category0' });
    expect(res.category).toBe('0');
  });

  test('TC-LR-012 Inflammatory category 2 -> Category 2', () => {
    const res = run({ isInflammatory: true, inflammatoryCategory: 'category2' });
    expect(res.category).toBe('2');
  });

  test('TC-LR-013 Airway subsegmental -> Category 2', () => {
    const res = run({ isAirway: true, airwayLocation: 'subsegmental' });
    expect(res.category).toBe('2');
  });

  test('TC-LR-014 Airway segmental/proximal -> Category 4A', () => {
    const res = run({ isAirway: true, airwayLocation: 'segmental-proximal' });
    expect(res.category).toBe('4A');
  });

  test('TC-LR-015 Airway persistent -> Category 4B', () => {
    const res = run({
      isAirway: true,
      airwayLocation: 'segmental-proximal',
      airwayPersistent: true,
    });
    expect(res.category).toBe('4B');
  });

  test('TC-LR-016 Atypical cyst -> Category 3/4A/4B', () => {
    expect(run({ isAtypicalCyst: true, atypicalCystCategory: 'category3' }).category).toBe('3');
    expect(run({ isAtypicalCyst: true, atypicalCystCategory: 'category4A' }).category).toBe('4A');
    expect(run({ isAtypicalCyst: true, atypicalCystCategory: 'category4B' }).category).toBe('4B');
  });

  test('TC-LR-017 Juxta/perifissural benign morphology -> Category 2', () => {
    const res = run({
      type: 'solid',
      diameterMm: 8,
      isJuxtapleural: true,
      hasSpiculation: false,
    });
    expect(res.category).toBe('2');
  });

  test('TC-LR-018 Spiculation upgrades to 4X', () => {
    const res = run({ type: 'solid', diameterMm: 7, hasSpiculation: true });
    expect(res.category).toBe('4X');
  });
});
