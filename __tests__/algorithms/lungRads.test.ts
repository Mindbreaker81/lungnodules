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

  test('TC-LR-010 Significant findings -> S modifier appended to base category', () => {
    const res = run({ hasSignificantFinding: true });
    expect(res.category).toBe('2S');
    expect(res.warnings).toEqual(expect.arrayContaining([expect.stringMatching(/modificador S/)]));
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

  test('TC-LR-013b Airway inflammatory/tubular -> Category 0', () => {
    const res = run({
      isAirway: true,
      airwayLocation: 'subsegmental',
      airwayInflammatoryOrInfectious: true,
    });
    expect(res.category).toBe('0');
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

  test('TC-LR-015b Airway persistent subsegmental -> stays Category 2', () => {
    const res = run({
      isAirway: true,
      airwayLocation: 'subsegmental',
      airwayPersistent: true,
    });
    expect(res.category).toBe('2');
  });

  test('TC-LR-015c Airway inflammatory classified as benign -> Category 2', () => {
    const res = run({
      isAirway: true,
      airwayLocation: 'subsegmental',
      airwayInflammatoryOrInfectious: true,
      airwayInflammatoryCategory: 'category2',
    });
    expect(res.category).toBe('2');
  });

  test('TC-LR-016 Atypical cyst manual override -> Category 3/4A/4B', () => {
    expect(
      run({
        isAtypicalCyst: true,
        atypicalCystManualOverride: true,
        atypicalCystCategory: 'category3',
      }).category,
    ).toBe('3');
    expect(
      run({
        isAtypicalCyst: true,
        atypicalCystManualOverride: true,
        atypicalCystCategory: 'category4A',
      }).category,
    ).toBe('4A');
    expect(
      run({
        isAtypicalCyst: true,
        atypicalCystManualOverride: true,
        atypicalCystCategory: 'category4B',
      }).category,
    ).toBe('4B');
  });

  test('TC-LR-016b Atypical cyst auto thick-walled -> Category 4A', () => {
    const res = run({ isAtypicalCyst: true, atypicalCystThickWalled: true });
    expect(res.category).toBe('4A');
  });

  test('TC-LR-016c Atypical cyst auto multilocular with loculation -> Category 4B', () => {
    const res = run({
      isAtypicalCyst: true,
      atypicalCystMultilocular: true,
      atypicalCystIncreasedLoculationOrDensity: true,
    });
    expect(res.category).toBe('4B');
  });

  test('TC-LR-016d Atypical cyst auto thick-walled stable growing cystic component -> Category 3', () => {
    const res = run({
      isAtypicalCyst: true,
      atypicalCystThickWalled: true,
      atypicalCystPreviouslyStable: true,
      atypicalCystGrowingCysticComponent: true,
    });
    expect(res.category).toBe('3');
  });

  test('TC-LR-016j Atypical cyst stable growing cystic component without thick wall -> insufficient descriptors', () => {
    const res = run({
      isAtypicalCyst: true,
      atypicalCystPreviouslyStable: true,
      atypicalCystGrowingCysticComponent: true,
    });
    expect(res.rationale).toMatch(/descriptores morfológicos insuficientes/i);
  });

  test('TC-LR-016e Manual override 3 when auto would be 4A', () => {
    const res = run({
      isAtypicalCyst: true,
      atypicalCystThickWalled: true,
      atypicalCystManualOverride: true,
      atypicalCystCategory: 'category3',
    });
    expect(res.category).toBe('3');
  });

  test('TC-LR-016f Unilocular thin-walled uses standard solid pathway', () => {
    const res = run({
      isAtypicalCyst: true,
      atypicalCystUnilocularThinWalled: true,
      type: 'solid',
      diameterMm: 7,
      scanType: 'baseline',
    });
    expect(res.category).toBe('3');
    expect(res.warnings).toEqual(
      expect.arrayContaining([expect.stringMatching(/unilocular de pared fina/i)]),
    );
  });

  test('TC-LR-016g Solid-dominant cavitary uses standard solid pathway', () => {
    const res = run({
      isAtypicalCyst: true,
      atypicalCystSolidDominant: true,
      type: 'solid',
      diameterMm: 10,
      scanType: 'baseline',
    });
    expect(res.category).toBe('4A');
  });

  test('TC-LR-016h Adjacent nodule takes higher category (cyst 3 vs solid 15mm -> 4B)', () => {
    const res = run({
      isAtypicalCyst: true,
      atypicalCystThickWalled: true,
      atypicalCystPreviouslyStable: true,
      atypicalCystGrowingCysticComponent: true,
      atypicalCystAdjacentNodule: true,
      type: 'solid',
      diameterMm: 15,
      scanType: 'baseline',
    });
    expect(res.category).toBe('4B');
  });

  test('TC-LR-016i Adjacent nodule keeps cyst 4A when higher than nodule 3', () => {
    const res = run({
      isAtypicalCyst: true,
      atypicalCystThickWalled: true,
      atypicalCystAdjacentNodule: true,
      type: 'solid',
      diameterMm: 7,
      scanType: 'baseline',
    });
    expect(res.category).toBe('4A');
  });

  test('TC-LR-017 Juxta/perifissural benign morphology -> Category 2', () => {
    const res = run({
      type: 'solid',
      diameterMm: 8,
      isJuxtapleural: true,
      hasSpiculation: false,
      hasSmoothMargins: true,
      juxtapleuralShape: 'triangular',
    });
    expect(res.category).toBe('2');
  });

  test('TC-LR-017b Juxtapleural without benign morphology -> standard classification', () => {
    const res = run({
      type: 'solid',
      diameterMm: 8,
      isJuxtapleural: true,
      hasSpiculation: false,
    });
    expect(res.category).not.toBe('2');
    expect(res.warnings).toEqual(
      expect.arrayContaining([expect.stringMatching(/margen|forma|yuxtapleural/i)]),
    );
  });

  test('TC-LR-017c Juxtapleural growing -> not Category 2', () => {
    const res = run({
      type: 'solid',
      diameterMm: 8,
      scanType: 'follow-up',
      priorDiameterMm: 6,
      priorScanMonthsAgo: 12,
      isJuxtapleural: true,
      hasSpiculation: false,
      hasSmoothMargins: true,
      juxtapleuralShape: 'triangular',
    });
    expect(res.category).not.toBe('2');
  });

  test('TC-LR-017d Juxtapleural existing in follow-up -> rule limited to baseline or new', () => {
    const res = run({
      type: 'solid',
      diameterMm: 8,
      scanType: 'follow-up',
      priorDiameterMm: 8,
      priorScanMonthsAgo: 12,
      isNew: false,
      isJuxtapleural: true,
      hasSpiculation: false,
      hasSmoothMargins: true,
      juxtapleuralShape: 'triangular',
    });
    expect(res.category).not.toBe('2');
    expect(res.warnings).toEqual(
      expect.arrayContaining([expect.stringMatching(/basal o n[óo]dulo nuevo/i)]),
    );
  });

  test('TC-LR-017e New juxtapleural with benign morphology -> Category 2', () => {
    const res = run({
      type: 'solid',
      diameterMm: 8,
      scanType: 'follow-up',
      isNew: true,
      isJuxtapleural: true,
      hasSpiculation: false,
      hasSmoothMargins: true,
      juxtapleuralShape: 'ovoid',
    });
    expect(res.category).toBe('2');
  });

  test('TC-LR-017f Juxtapleural diameter boundary: <10mm required by official table', () => {
    const benignMorphology = {
      type: 'solid' as const,
      isJuxtapleural: true,
      hasSpiculation: false,
      hasSmoothMargins: true,
      juxtapleuralShape: 'triangular' as const,
      scanType: 'baseline' as const,
    };
    // 9.9 mm -> Category 2
    expect(run({ ...benignMorphology, diameterMm: 9.9 }).category).toBe('2');
    // exactly 10.0 mm -> strict <10mm bound fails, standard baseline 8-<15mm -> 4A
    const at10 = run({ ...benignMorphology, diameterMm: 10 });
    expect(at10.category).toBe('4A');
    expect(at10.warnings).toEqual(
      expect.arrayContaining([expect.stringMatching(/<10 mm/)]),
    );
    // 10.1 mm -> 4A
    expect(run({ ...benignMorphology, diameterMm: 10.1 }).category).toBe('4A');
  });

  test('TC-LR-018 Spiculation upgrades to 4X', () => {
    const res = run({ type: 'solid', diameterMm: 7, hasSpiculation: true });
    expect(res.category).toBe('4X');
  });

  test('TC-LR-019 S modifier preserved on special categories', () => {
    expect(run({ isBenign: true, hasSignificantFinding: true }).category).toBe('1S');
    expect(run({ isIncompleteStudy: true, hasSignificantFinding: true } as any).category).toBe('0S');
    expect(
      run({ isInflammatory: true, inflammatoryCategory: 'category2', hasSignificantFinding: true }).category,
    ).toBe('2S');
    expect(
      run({ isAirway: true, airwayLocation: 'subsegmental', hasSignificantFinding: true }).category,
    ).toBe('2S');
  });

  test('TC-LR-020 Interval-growth warning preserved on special categories', () => {
    const res = run({
      isBenign: true,
      scanType: 'follow-up',
      priorDiameterMm: 6,
      priorScanMonthsAgo: 24,
      diameterMm: 8,
    });
    expect(res.category).toBe('1');
    expect(res.warnings).toEqual(
      expect.arrayContaining([expect.stringMatching(/intervalo >12 meses/i)]),
    );
  });

  test('TC-LR-021 Part-solid escalation uses solid component growth', () => {
    const growing = run({
      type: 'part-solid',
      diameterMm: 12,
      solidComponentMm: 4,
      scanType: 'follow-up',
      priorDiameterMm: 11,
      priorSolidComponentMm: 2,
      priorScanMonthsAgo: 12,
      isNew: false,
    });
    expect(growing.category).toBe('4B');

    const stable = run({
      type: 'part-solid',
      diameterMm: 12,
      solidComponentMm: 4,
      scanType: 'follow-up',
      priorDiameterMm: 9,
      priorSolidComponentMm: 4,
      priorScanMonthsAgo: 12,
      isNew: false,
    });
    expect(stable.category).toBe('3');
  });

  test('TC-LR-022 Follow-up part-solid without prior solid component -> warning', () => {
    const res = run({
      type: 'part-solid',
      diameterMm: 12,
      solidComponentMm: 4,
      scanType: 'follow-up',
      priorDiameterMm: 9,
      priorScanMonthsAgo: 12,
      isNew: false,
    });
    expect(res.warnings).toEqual(
      expect.arrayContaining([expect.stringMatching(/Componente sólido previo no indicado/i)]),
    );
  });

  test('TC-LR-023 GGN ≥30mm stable in follow-up -> Category 2 without prior category', () => {
    const res = run({
      type: 'ground-glass',
      diameterMm: 35,
      scanType: 'follow-up',
      priorDiameterMm: 34,
      priorScanMonthsAgo: 12,
      isNew: false,
    });
    expect(res.category).toBe('2');
  });

  test('TC-LR-024 GGN ≥30mm new in follow-up -> Category 3', () => {
    const res = run({
      type: 'ground-glass',
      diameterMm: 35,
      scanType: 'follow-up',
      isNew: true,
    });
    expect(res.category).toBe('3');
  });
});
