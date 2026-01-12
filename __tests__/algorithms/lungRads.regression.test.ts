import { assessLungRads, calculateLungRadsGrowth } from '@lib/algorithms';
import { LungRadsAssessmentInput } from '@lib/algorithms/types';

describe('Lung-RADS Regression: Stepped Management', () => {
  const basePatient = {
    clinicalContext: 'screening' as const,
    age: 60,
  };

  const baseNodule: LungRadsAssessmentInput['nodule'] = {
    type: 'solid' as const,
    diameterMm: 7,
    isMultiple: false,
    scanType: 'follow-up' as const,
  };

  describe('Category 3 -> 2 step-down (stable)', () => {
    test('TC-SM-001 Category 3 stable for 3+ months -> Category 2', () => {
      const result = assessLungRads({
        patient: basePatient,
        nodule: { ...baseNodule, diameterMm: 7, scanType: 'follow-up' },
        priorCategory: '3',
        priorStatus: 'stable',
      });
      expect(result.category).toBe('2');
    });

    test('TC-SM-002 Category 3 with progression -> stays Category 3 or higher', () => {
      const result = assessLungRads({
        patient: basePatient,
        nodule: { ...baseNodule, diameterMm: 7, scanType: 'follow-up' },
        priorCategory: '3',
        priorStatus: 'progression',
      });
      expect(['3', '4A', '4B']).toContain(result.category);
    });

    test('TC-SM-003 Category 3 stable, no prior status -> no step-down', () => {
      const result = assessLungRads({
        patient: basePatient,
        nodule: { ...baseNodule, diameterMm: 7, scanType: 'baseline' },
        priorCategory: '3',
      });
      expect(result.category).toBe('3');
    });
  });

  describe('Category 4A -> 3 step-down (stable)', () => {
    test('TC-SM-004 Category 4A stable for 3+ months -> Category 3', () => {
      const result = assessLungRads({
        patient: basePatient,
        nodule: { ...baseNodule, diameterMm: 10, scanType: 'follow-up' },
        priorCategory: '4A',
        priorStatus: 'stable',
      });
      expect(result.category).toBe('3');
    });

    test('TC-SM-005 Category 4A with progression -> stays 4A or higher', () => {
      const result = assessLungRads({
        patient: basePatient,
        nodule: { ...baseNodule, diameterMm: 10, scanType: 'follow-up' },
        priorCategory: '4A',
        priorStatus: 'progression',
      });
      expect(['4A', '4B']).toContain(result.category);
    });
  });

  describe('No step-down scenarios', () => {
    test('TC-SM-006 Category 2 stable -> stays Category 2', () => {
      const result = assessLungRads({
        patient: basePatient,
        nodule: { ...baseNodule, diameterMm: 4, scanType: 'follow-up' },
        priorCategory: '2',
        priorStatus: 'stable',
      });
      expect(result.category).toBe('2');
    });

    test('TC-SM-007 Category 4B stable -> no automatic step-down', () => {
      const result = assessLungRads({
        patient: basePatient,
        nodule: { ...baseNodule, diameterMm: 16, scanType: 'follow-up' },
        priorCategory: '4B',
        priorStatus: 'stable',
      });
      expect(result.category).toBe('4B');
    });

    test('TC-SM-008 No prior category -> current classification only', () => {
      const result = assessLungRads({
        patient: basePatient,
        nodule: { ...baseNodule, diameterMm: 7, scanType: 'baseline' },
      });
      expect(result.category).toBe('3');
    });
  });
});

describe('Lung-RADS Regression: Growth Calculation', () => {
  describe('calculateLungRadsGrowth', () => {
    test('TC-GR-001 Growth >1.5mm in 12 months -> true', () => {
      expect(calculateLungRadsGrowth(8, 6, 12)).toBe(true);
    });

    test('TC-GR-002 Growth =1.5mm in 12 months -> false (threshold is >)', () => {
      expect(calculateLungRadsGrowth(7.5, 6, 12)).toBe(false);
    });

    test('TC-GR-003 Growth <1.5mm in 12 months -> false', () => {
      expect(calculateLungRadsGrowth(7, 6, 12)).toBe(false);
    });

    test('TC-GR-004 Annualized growth >1.5mm (6 months) -> true', () => {
      // 2mm growth in 6 months = 4mm/year > 1.5mm threshold
      expect(calculateLungRadsGrowth(8, 6, 6)).toBe(true);
    });

    test('TC-GR-005 Annualized growth <1.5mm (24 months) -> false', () => {
      // 2mm growth in 24 months = 1mm/year < 1.5mm threshold
      expect(calculateLungRadsGrowth(8, 6, 24)).toBe(false);
    });

    test('TC-GR-006 No prior diameter -> false', () => {
      expect(calculateLungRadsGrowth(8, undefined, 12)).toBe(false);
    });

    test('TC-GR-007 No interval months -> false', () => {
      expect(calculateLungRadsGrowth(8, 6, undefined)).toBe(false);
    });

    test('TC-GR-008 Zero prior diameter -> false', () => {
      expect(calculateLungRadsGrowth(8, 0, 12)).toBe(false);
    });

    test('TC-GR-009 Zero interval months -> false', () => {
      expect(calculateLungRadsGrowth(8, 6, 0)).toBe(false);
    });

    test('TC-GR-010 Negative growth (nodule shrinking) -> false', () => {
      expect(calculateLungRadsGrowth(5, 8, 12)).toBe(false);
    });
  });

  describe('Growth affecting classification', () => {
    const basePatient = {
      clinicalContext: 'screening' as const,
      age: 60,
    };

    test('TC-GR-011 Small nodule with significant growth -> elevated category', () => {
      const result = assessLungRads({
        patient: basePatient,
        nodule: {
          type: 'solid',
          diameterMm: 7,
          isMultiple: false,
          scanType: 'follow-up',
          priorDiameterMm: 4,
          priorScanMonthsAgo: 12,
          isNew: false,
        },
      });
      expect(['4A', '4B']).toContain(result.category);
      expect(result.rationale).toMatch(/Growth >1\.5mm/i);
    });

    test('TC-GR-012 Large nodule with growth -> 4B', () => {
      const result = assessLungRads({
        patient: basePatient,
        nodule: {
          type: 'solid',
          diameterMm: 12,
          isMultiple: false,
          scanType: 'follow-up',
          priorDiameterMm: 8,
          priorScanMonthsAgo: 12,
          isNew: false,
        },
      });
      expect(result.category).toBe('4B');
    });

    test('TC-GR-013 Nodule without growth -> baseline classification', () => {
      const result = assessLungRads({
        patient: basePatient,
        nodule: {
          type: 'solid',
          diameterMm: 7,
          isMultiple: false,
          scanType: 'follow-up',
          priorDiameterMm: 6.5,
          priorScanMonthsAgo: 12,
          isNew: false,
        },
      });
      expect(result.rationale).toMatch(/No significant growth/i);
    });
  });
});

describe('Lung-RADS Regression: Part-solid & GGN Growth', () => {
  const basePatient = {
    clinicalContext: 'screening' as const,
    age: 60,
  };

  test('TC-PS-001 Part-solid with solid ≥6mm -> 4B', () => {
    const result = assessLungRads({
      patient: basePatient,
      nodule: {
        type: 'part-solid',
        diameterMm: 15,
        solidComponentMm: 7,
        isMultiple: false,
        scanType: 'baseline',
      },
    });
    expect(result.category).toBe('4B');
  });

  test('TC-PS-002 Part-solid with solid <6mm, large size -> 4A', () => {
    const result = assessLungRads({
      patient: basePatient,
      nodule: {
        type: 'part-solid',
        diameterMm: 12,
        solidComponentMm: 4,
        isMultiple: false,
        scanType: 'baseline',
      },
    });
    expect(result.category).toBe('4A');
  });

  test('TC-PS-003 Part-solid missing solid component -> warning', () => {
    const result = assessLungRads({
      patient: basePatient,
      nodule: {
        type: 'part-solid',
        diameterMm: 10,
        isMultiple: false,
        scanType: 'baseline',
      },
    });
    expect(result.warnings).toContain('Solid component size required for part-solid assessment');
  });

  test('TC-GGN-001 GGN <30mm -> Category 2', () => {
    const result = assessLungRads({
      patient: basePatient,
      nodule: {
        type: 'ground-glass',
        diameterMm: 25,
        isMultiple: false,
        scanType: 'baseline',
      },
    });
    expect(result.category).toBe('2');
  });

  test('TC-GGN-002 GGN ≥30mm -> Category 3', () => {
    const result = assessLungRads({
      patient: basePatient,
      nodule: {
        type: 'ground-glass',
        diameterMm: 35,
        isMultiple: false,
        scanType: 'baseline',
      },
    });
    expect(result.category).toBe('3');
  });
});

describe('Lung-RADS Regression: New Nodule Classification', () => {
  const basePatient = {
    clinicalContext: 'screening' as const,
    age: 60,
  };

  test('TC-NEW-001 New solid <4mm -> Category 2', () => {
    const result = assessLungRads({
      patient: basePatient,
      nodule: {
        type: 'solid',
        diameterMm: 3,
        isMultiple: false,
        scanType: 'follow-up',
        isNew: true,
      },
    });
    expect(result.category).toBe('2');
  });

  test('TC-NEW-002 New solid 4-5mm -> Category 3', () => {
    const result = assessLungRads({
      patient: basePatient,
      nodule: {
        type: 'solid',
        diameterMm: 5,
        isMultiple: false,
        scanType: 'follow-up',
        isNew: true,
      },
    });
    expect(result.category).toBe('3');
  });

  test('TC-NEW-003 New solid 6-7mm -> Category 4A', () => {
    const result = assessLungRads({
      patient: basePatient,
      nodule: {
        type: 'solid',
        diameterMm: 7,
        isMultiple: false,
        scanType: 'follow-up',
        isNew: true,
      },
    });
    expect(result.category).toBe('4A');
  });

  test('TC-NEW-004 New solid ≥8mm -> Category 4B', () => {
    const result = assessLungRads({
      patient: basePatient,
      nodule: {
        type: 'solid',
        diameterMm: 10,
        isMultiple: false,
        scanType: 'follow-up',
        isNew: true,
      },
    });
    expect(result.category).toBe('4B');
  });
});

describe('Lung-RADS Regression: Edge Cases', () => {
  const basePatient = {
    clinicalContext: 'screening' as const,
    age: 60,
  };

  test('TC-EDGE-001 Solid component > total diameter -> warning', () => {
    const result = assessLungRads({
      patient: basePatient,
      nodule: {
        type: 'part-solid',
        diameterMm: 8,
        solidComponentMm: 10,
        isMultiple: false,
        scanType: 'baseline',
      },
    });
    expect(result.warnings).toContain('Solid component cannot exceed total diameter');
  });

  test('TC-EDGE-002 Non-screening context -> not applicable', () => {
    const result = assessLungRads({
      patient: { ...basePatient, clinicalContext: 'incidental' as const },
      nodule: {
        type: 'solid',
        diameterMm: 8,
        isMultiple: false,
        scanType: 'baseline',
      },
    });
    expect(result.category).toBe('Not applicable');
    expect(result.warnings).toContain('Screening context required for Lung-RADS');
  });

  test('TC-EDGE-003 Boundary diameter 6mm baseline -> Category 3', () => {
    const result = assessLungRads({
      patient: basePatient,
      nodule: {
        type: 'solid',
        diameterMm: 6,
        isMultiple: false,
        scanType: 'baseline',
      },
    });
    expect(result.category).toBe('3');
  });

  test('TC-EDGE-004 Boundary diameter 8mm baseline -> Category 4A', () => {
    const result = assessLungRads({
      patient: basePatient,
      nodule: {
        type: 'solid',
        diameterMm: 8,
        isMultiple: false,
        scanType: 'baseline',
      },
    });
    expect(result.category).toBe('4A');
  });

  test('TC-EDGE-005 Boundary diameter 15mm baseline -> Category 4B', () => {
    const result = assessLungRads({
      patient: basePatient,
      nodule: {
        type: 'solid',
        diameterMm: 15,
        isMultiple: false,
        scanType: 'baseline',
      },
    });
    expect(result.category).toBe('4B');
  });
});
