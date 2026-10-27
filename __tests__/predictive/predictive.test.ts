import { getPredictiveSummaries, getRecommendedPredictiveModel } from '@lib/predictive';
import { AssessmentInput } from '@lib/schemas/noduleInput';

describe('Predictive models', () => {
  const getSummary = (
    input: AssessmentInput,
    id: 'mayo' | 'brock' | 'herder',
  ) => {
    const summary = getPredictiveSummaries(input).find((item) => item.id === id);
    if (!summary) {
      throw new Error(`Missing summary for ${id}`);
    }
    return summary;
  };

  test('Mayo calculation returns probability and high risk band', () => {
    const input: AssessmentInput = {
      clinicalContext: 'incidental',
      patient: {
        clinicalContext: 'incidental',
        age: 65,
        riskLevel: 'low',
        hasKnownMalignancy: false,
        isImmunocompromised: false,
        sex: 'male',
        smokingStatus: 'current',
        extrathoracicCancerHistory: 'over5y',
        hasFamilyHistoryLungCancer: false,
        hasEmphysema: false,
      },
      nodule: {
        type: 'solid',
        diameterMm: 16,
        solidComponentMm: undefined,
        isMultiple: false,
        hasSpiculation: true,
        isUpperLobe: true,
        hasPet: false,
        petUptake: undefined,
      },
    };

    const summary = getSummary(input, 'mayo');
    expect(summary.status).toBe('available');
    expect(summary.probability).toBeCloseTo(0.8465, 4);
    expect(summary.riskBand).toBe('high');
  });

  test('Mayo matches Swensen 1997 Table 3 baseline case (55 y, 20 mm, no risk factors)', () => {
    const input: AssessmentInput = {
      clinicalContext: 'incidental',
      patient: {
        clinicalContext: 'incidental',
        age: 55,
        riskLevel: 'low',
        hasKnownMalignancy: false,
        isImmunocompromised: false,
        sex: 'male',
        smokingStatus: 'never',
        extrathoracicCancerHistory: 'none',
        hasFamilyHistoryLungCancer: false,
        hasEmphysema: false,
      },
      nodule: {
        type: 'solid',
        diameterMm: 20,
        solidComponentMm: undefined,
        isMultiple: false,
        hasSpiculation: false,
        isUpperLobe: false,
        hasPet: false,
        petUptake: undefined,
      },
    };

    const summary = getSummary(input, 'mayo');
    expect(summary.status).toBe('available');
    // Swensen Table 3: P = 0.11 for this row (app ~0.106 before rounding)
    expect(summary.probability).toBeCloseTo(0.11, 2);
    expect(summary.riskBand).toBe('intermediate');
  });

  test('Brock calculation returns probability and intermediate risk band', () => {
    const input: AssessmentInput = {
      clinicalContext: 'screening',
      patient: {
        clinicalContext: 'screening',
        age: 70,
        riskLevel: 'low',
        hasKnownMalignancy: false,
        isImmunocompromised: false,
        sex: 'female',
        smokingStatus: 'former',
        extrathoracicCancerHistory: 'none',
        hasFamilyHistoryLungCancer: true,
        hasEmphysema: true,
      },
      nodule: {
        type: 'part-solid',
        diameterMm: 10,
        solidComponentMm: 4,
        isMultiple: true,
        noduleCount: 3,
        hasSpiculation: true,
        isUpperLobe: true,
        hasPet: false,
        petUptake: undefined,
        scanType: 'baseline',
      },
    };

    const summary = getSummary(input, 'brock');
    expect(summary.status).toBe('available');
    expect(summary.probability).toBeCloseTo(0.4141, 4);
    expect(summary.riskBand).toBe('intermediate');
  });

  test('Brock requires a real age in screening and does not use synthetic defaults', () => {
    const input: AssessmentInput = {
      clinicalContext: 'screening',
      patient: {
        clinicalContext: 'screening',
        riskLevel: 'low',
        hasKnownMalignancy: false,
        isImmunocompromised: false,
        sex: 'female',
        smokingStatus: 'former',
        extrathoracicCancerHistory: 'none',
        hasFamilyHistoryLungCancer: true,
        hasEmphysema: true,
      },
      nodule: {
        type: 'part-solid',
        diameterMm: 10,
        solidComponentMm: 4,
        isMultiple: true,
        noduleCount: 3,
        hasSpiculation: true,
        isUpperLobe: true,
        hasPet: false,
        petUptake: undefined,
        scanType: 'baseline',
      },
    };

    const summary = getSummary(input, 'brock');
    expect(summary.status).toBe('insufficient_data');
    expect(summary.missingFields).toContain('Edad');
  });

  test('Herder computes below 10% pre-test and notes the BTS guidance', () => {
    const input: AssessmentInput = {
      clinicalContext: 'incidental',
      patient: {
        clinicalContext: 'incidental',
        age: 40,
        riskLevel: 'low',
        hasKnownMalignancy: false,
        isImmunocompromised: false,
        sex: 'male',
        smokingStatus: 'never',
        extrathoracicCancerHistory: 'none',
        hasFamilyHistoryLungCancer: false,
        hasEmphysema: false,
      },
      nodule: {
        type: 'solid',
        diameterMm: 8,
        solidComponentMm: undefined,
        isMultiple: false,
        hasSpiculation: false,
        isUpperLobe: false,
        hasPet: true,
        petUptake: 'moderate',
      },
    };

    const summary = getSummary(input, 'herder');
    expect(summary.status).toBe('available');
    expect(summary.preTestModelId).toBe('mayo');
    expect(summary.probability).toBeCloseTo(0.4826, 3);
    expect(summary.notes?.some((note) => note.includes('BTS') && note.includes('≥10%'))).toBe(true);
  });

  test('Herder applies the published logistic model on Mayo pre-test', () => {
    const input: AssessmentInput = {
      clinicalContext: 'incidental',
      patient: {
        clinicalContext: 'incidental',
        age: 60,
        riskLevel: 'low',
        hasKnownMalignancy: false,
        isImmunocompromised: false,
        sex: 'male',
        smokingStatus: 'current',
        extrathoracicCancerHistory: 'none',
        hasFamilyHistoryLungCancer: false,
        hasEmphysema: false,
      },
      nodule: {
        type: 'solid',
        diameterMm: 10,
        solidComponentMm: undefined,
        isMultiple: false,
        hasSpiculation: false,
        isUpperLobe: true,
        hasPet: true,
        petUptake: 'moderate',
      },
    };

    const summary = getSummary(input, 'herder');
    expect(summary.status).toBe('available');
    expect(summary.preTestModelId).toBe('mayo');
    expect(summary.preTestProbability).toBeCloseTo(0.1636, 4);
    // x = -4.739 + 3.691·0.1636 + 4.617 = 0.482 → P ≈ 0.6182.
    expect(summary.probability).toBeCloseTo(0.6182, 4);
    expect(summary.riskBand).toBe('intermediate');
  });

  test('Predictive summaries snapshot', () => {
    const input: AssessmentInput = {
      clinicalContext: 'incidental',
      patient: {
        clinicalContext: 'incidental',
        age: 72,
        riskLevel: 'high',
        hasKnownMalignancy: false,
        isImmunocompromised: false,
        sex: 'female',
        smokingStatus: 'former',
        extrathoracicCancerHistory: 'over5y',
        hasFamilyHistoryLungCancer: false,
        hasEmphysema: true,
      },
      nodule: {
        type: 'solid',
        diameterMm: 18,
        solidComponentMm: undefined,
        isMultiple: false,
        hasSpiculation: true,
        isUpperLobe: true,
        hasPet: true,
        petUptake: 'intense',
      },
    };

    const summaries = getPredictiveSummaries(input).map((summary) => ({
      id: summary.id,
      status: summary.status,
      probability:
        summary.probability !== undefined ? Number(summary.probability.toFixed(4)) : undefined,
      riskBand: summary.riskBand,
      reason: summary.reason,
      preTestProbability:
        summary.preTestProbability !== undefined
          ? Number(summary.preTestProbability.toFixed(4))
          : undefined,
    }));

    expect(summaries).toMatchInlineSnapshot(`
      [
        {
          "id": "mayo",
          "preTestProbability": undefined,
          "probability": 0.9035,
          "reason": undefined,
          "riskBand": "high",
          "status": "available",
        },
        {
          "id": "brock",
          "preTestProbability": undefined,
          "probability": undefined,
          "reason": "Recomendado para cohortes de screening (Lung-RADS).",
          "riskBand": undefined,
          "status": "not_applicable",
        },
        {
          "id": "herder",
          "preTestProbability": 0.9035,
          "probability": 0.9666,
          "reason": undefined,
          "riskBand": "high",
          "status": "available",
        },
      ]
    `);
  });

  // Regression guard: Brock must use the published non-linear size transform,
  // not a linear coefficient on millimetres. A 15 mm solid screening nodule
  // should land in the intermediate band (~25%), not be reported as low risk.
  test('Brock non-linear size term keeps a 15 mm nodule at intermediate risk', () => {
    const input: AssessmentInput = {
      clinicalContext: 'screening',
      patient: {
        clinicalContext: 'screening',
        age: 65,
        riskLevel: 'low',
        hasKnownMalignancy: false,
        isImmunocompromised: false,
        sex: 'female',
        smokingStatus: 'former',
        extrathoracicCancerHistory: 'none',
        hasFamilyHistoryLungCancer: false,
        hasEmphysema: false,
      },
      nodule: {
        type: 'solid',
        diameterMm: 15,
        solidComponentMm: undefined,
        isMultiple: false,
        noduleCount: 1,
        hasSpiculation: false,
        isUpperLobe: true,
        hasPet: false,
        petUptake: undefined,
        scanType: 'baseline',
      },
    };

    const summary = getSummary(input, 'brock');
    expect(summary.status).toBe('available');
    expect(summary.probability).toBeCloseTo(0.2537, 3);
    expect(summary.riskBand).toBe('intermediate');
  });

  test('Brock Model 2a (without spiculation) is used when hasSpiculation is undefined', () => {
    const input: AssessmentInput = {
      clinicalContext: 'screening',
      patient: {
        clinicalContext: 'screening',
        age: 65,
        riskLevel: 'low',
        hasKnownMalignancy: false,
        isImmunocompromised: false,
        sex: 'female',
        smokingStatus: 'former',
        extrathoracicCancerHistory: 'none',
        hasFamilyHistoryLungCancer: false,
        hasEmphysema: false,
      },
      nodule: {
        type: 'solid',
        diameterMm: 15,
        solidComponentMm: undefined,
        isMultiple: false,
        noduleCount: 1,
        hasSpiculation: undefined,
        isUpperLobe: true,
        hasPet: false,
        petUptake: undefined,
        scanType: 'baseline',
      },
    };

    const summary = getSummary(input, 'brock');
    expect(summary.status).toBe('available');
    expect(summary.missingFields).toBeUndefined();
    expect(summary.probability).toBeCloseTo(0.2974, 4);
    expect(summary.riskBand).toBe('intermediate');
    expect(summary.notes?.[0]).toContain('Variante sin espiculación');
  });

  test('Brock Model 2a and 2b produce different probabilities for the same nodule', () => {
    const base: AssessmentInput = {
      clinicalContext: 'screening',
      patient: {
        clinicalContext: 'screening',
        age: 65,
        riskLevel: 'low',
        hasKnownMalignancy: false,
        isImmunocompromised: false,
        sex: 'female',
        smokingStatus: 'former',
        extrathoracicCancerHistory: 'none',
        hasFamilyHistoryLungCancer: false,
        hasEmphysema: false,
      },
      nodule: {
        type: 'solid',
        diameterMm: 15,
        solidComponentMm: undefined,
        isMultiple: false,
        noduleCount: 1,
        isUpperLobe: true,
        hasPet: false,
        petUptake: undefined,
        scanType: 'baseline',
      },
    };

    const withoutSpic = getSummary(
      { ...base, nodule: { ...base.nodule, hasSpiculation: undefined } },
      'brock',
    );
    const withSpic = getSummary(
      { ...base, nodule: { ...base.nodule, hasSpiculation: true } },
      'brock',
    );

    expect(withoutSpic.probability).not.toBeCloseTo(withSpic.probability as number, 4);
    expect(withoutSpic.probability).toBeLessThan(withSpic.probability as number);
  });

  test('Brock Model 2a differs from 2b when spiculation is absent vs not evaluable', () => {
    const base: AssessmentInput = {
      clinicalContext: 'screening',
      patient: {
        clinicalContext: 'screening',
        age: 65,
        riskLevel: 'low',
        hasKnownMalignancy: false,
        isImmunocompromised: false,
        sex: 'female',
        smokingStatus: 'former',
        extrathoracicCancerHistory: 'none',
        hasFamilyHistoryLungCancer: false,
        hasEmphysema: false,
      },
      nodule: {
        type: 'solid',
        diameterMm: 15,
        solidComponentMm: undefined,
        isMultiple: false,
        noduleCount: 1,
        isUpperLobe: true,
        hasPet: false,
        petUptake: undefined,
        scanType: 'baseline',
      },
    };

    const notEvaluable = getSummary(
      { ...base, nodule: { ...base.nodule, hasSpiculation: undefined } },
      'brock',
    );
    const absent = getSummary(
      { ...base, nodule: { ...base.nodule, hasSpiculation: false } },
      'brock',
    );

    expect(notEvaluable.probability).toBeCloseTo(0.2974, 4);
    expect(absent.probability).toBeCloseTo(0.2537, 3);
    expect(notEvaluable.probability).not.toBeCloseTo(absent.probability as number, 3);
    expect(notEvaluable.probability).toBeGreaterThan(absent.probability as number);
  });

  test('Mayo requires spiculation when not evaluable', () => {
    const input: AssessmentInput = {
      clinicalContext: 'incidental',
      patient: {
        clinicalContext: 'incidental',
        age: 60,
        riskLevel: 'low',
        hasKnownMalignancy: false,
        isImmunocompromised: false,
        sex: 'male',
        smokingStatus: 'former',
        extrathoracicCancerHistory: 'none',
        hasFamilyHistoryLungCancer: false,
        hasEmphysema: false,
      },
      nodule: {
        type: 'solid',
        diameterMm: 12,
        solidComponentMm: undefined,
        isMultiple: false,
        hasSpiculation: undefined,
        isUpperLobe: true,
        hasPet: false,
        petUptake: undefined,
      },
    };

    const summary = getSummary(input, 'mayo');
    expect(summary.status).toBe('insufficient_data');
    expect(summary.missingFields).toContain('Espiculación');
  });

  // Regression guard: in Mayo the spiculation coefficient (1.0407) is larger
  // than the upper-lobe coefficient (0.7838). An earlier bug had them swapped,
  // so a spiculated lower-lobe nodule must score higher than a smooth
  // upper-lobe nodule that is otherwise identical.
  test('Mayo weights spiculation above upper-lobe location', () => {
    const base = {
      clinicalContext: 'incidental' as const,
      patient: {
        clinicalContext: 'incidental' as const,
        age: 60,
        riskLevel: 'low' as const,
        hasKnownMalignancy: false,
        isImmunocompromised: false,
        sex: 'male' as const,
        smokingStatus: 'former' as const,
        extrathoracicCancerHistory: 'none' as const,
        hasFamilyHistoryLungCancer: false,
        hasEmphysema: false,
      },
      nodule: {
        type: 'solid' as const,
        diameterMm: 12,
        solidComponentMm: undefined,
        isMultiple: false,
        hasPet: false,
        petUptake: undefined,
      },
    };

    const spiculatedLowerLobe = getSummary(
      { ...base, nodule: { ...base.nodule, hasSpiculation: true, isUpperLobe: false } },
      'mayo',
    );
    const smoothUpperLobe = getSummary(
      { ...base, nodule: { ...base.nodule, hasSpiculation: false, isUpperLobe: true } },
      'mayo',
    );

    expect(spiculatedLowerLobe.probability).toBeGreaterThan(smoothUpperLobe.probability as number);
  });

  test('incidental 7 mm with intense PET: Mayo pre-PET ~18.7%, Herder post-PET ~67%', () => {
    const input: AssessmentInput = {
      clinicalContext: 'incidental',
      patient: {
        clinicalContext: 'incidental',
        age: 74,
        riskLevel: 'high',
        hasKnownMalignancy: false,
        isImmunocompromised: false,
        sex: 'male',
        smokingStatus: 'current',
        extrathoracicCancerHistory: 'none',
        hasFamilyHistoryLungCancer: false,
        hasEmphysema: true,
      },
      nodule: {
        type: 'solid',
        diameterMm: 7,
        isMultiple: false,
        hasSpiculation: false,
        isUpperLobe: true,
        hasPet: true,
        petUptake: 'intense',
      },
    };

    const mayo = getSummary(input, 'mayo');
    const herder = getSummary(input, 'herder');

    expect(mayo.probability).toBeCloseTo(0.187, 3);
    expect(mayo.notes?.[0]).toContain('pre-PET');
    expect(herder.status).toBe('available');
    expect(herder.probability).toBeCloseTo(0.673, 2);
    expect(herder.preTestProbability).toBeCloseTo(0.187, 3);
    expect(getRecommendedPredictiveModel(input)).toBe('herder');
  });

  test('Herder computes published formula with P_pre as 0-1 fraction', () => {
    const input: AssessmentInput = {
      clinicalContext: 'incidental',
      patient: {
        clinicalContext: 'incidental',
        age: 74,
        riskLevel: 'high',
        hasKnownMalignancy: false,
        isImmunocompromised: false,
        sex: 'male',
        smokingStatus: 'current',
        extrathoracicCancerHistory: 'none',
        hasFamilyHistoryLungCancer: false,
        hasEmphysema: true,
      },
      nodule: {
        type: 'solid',
        diameterMm: 7,
        isMultiple: false,
        hasSpiculation: false,
        isUpperLobe: true,
        hasPet: true,
        petUptake: 'intense',
      },
    };

    const logistic = getSummary(input, 'herder');

    // x = -4.739 + 3.691*0.187 + 4.771 = 0.7222 -> P = 1/(1+e^-x) ~ 0.673.
    // (Scale check: if P_pre were entered as 0-100 the result would saturate to ~1.)
    expect(logistic.status).toBe('available');
    expect(logistic.probability).toBeCloseTo(0.673, 2);
    expect(logistic.preTestProbability).toBeCloseTo(0.187, 3);
  });

  test('a single Herder model is exposed (published logistic regression)', () => {
    const input: AssessmentInput = {
      clinicalContext: 'incidental',
      patient: {
        clinicalContext: 'incidental',
        age: 74,
        riskLevel: 'high',
        hasKnownMalignancy: false,
        isImmunocompromised: false,
        sex: 'male',
        smokingStatus: 'current',
        extrathoracicCancerHistory: 'none',
        hasFamilyHistoryLungCancer: false,
        hasEmphysema: true,
      },
      nodule: {
        type: 'solid',
        diameterMm: 7,
        isMultiple: false,
        hasSpiculation: false,
        isUpperLobe: true,
        hasPet: true,
        petUptake: 'moderate',
      },
    };

    const summaries = getPredictiveSummaries(input);
    expect(summaries.map((s) => s.id)).toEqual(['mayo', 'brock', 'herder']);

    const herder = summaries.find((s) => s.id === 'herder');
    expect(herder?.status).toBe('available');
    expect(herder?.notes?.some((n) => n.includes('Herder 2005'))).toBe(true);
  });

  test('Herder uses Mayo pre-test in screening too (not Brock)', () => {
    const input: AssessmentInput = {
      clinicalContext: 'screening',
      patient: {
        clinicalContext: 'screening',
        age: 60,
        hasKnownMalignancy: false,
        isImmunocompromised: false,
        sex: 'male',
        smokingStatus: 'current',
        extrathoracicCancerHistory: 'none',
        hasFamilyHistoryLungCancer: false,
        hasEmphysema: false,
      },
      nodule: {
        type: 'solid',
        diameterMm: 15,
        solidComponentMm: undefined,
        isMultiple: false,
        noduleCount: 1,
        hasSpiculation: false,
        isUpperLobe: true,
        hasPet: true,
        petUptake: 'moderate',
        scanType: 'baseline',
      },
    };

    const herder = getSummary(input, 'herder');
    expect(herder.status).toBe('available');
    expect(herder.preTestModelId).toBe('mayo');
    // Mayo: x = -6.8272 + 2.346 + 0.7917 + 1.911 + 0.7838 = -0.9947 → P ≈ 0.270.
    expect(herder.preTestProbability).toBeCloseTo(0.27, 3);
    // Herder: x = -4.739 + 3.691·0.27 + 4.617 = 0.875 → P ≈ 0.7057.
    expect(herder.probability).toBeCloseTo(0.7057, 3);
  });

  test('Herder reports missing Mayo fields in screening instead of using Brock', () => {
    const input: AssessmentInput = {
      clinicalContext: 'screening',
      patient: {
        clinicalContext: 'screening',
        age: 60,
        hasKnownMalignancy: false,
        isImmunocompromised: false,
        sex: 'male',
        hasFamilyHistoryLungCancer: false,
        hasEmphysema: false,
      },
      nodule: {
        type: 'solid',
        diameterMm: 15,
        solidComponentMm: undefined,
        isMultiple: false,
        noduleCount: 1,
        hasSpiculation: false,
        isUpperLobe: true,
        hasPet: true,
        petUptake: 'moderate',
        scanType: 'baseline',
      },
    };

    const herder = getSummary(input, 'herder');
    expect(herder.status).toBe('insufficient_data');
    expect(herder.preTestModelId).toBe('mayo');
    expect(herder.missingFields).toContain('Tabaquismo');
    expect(herder.missingFields).toContain('Cáncer extratorácico (>5 años)');
  });

  test('Herder reports insufficient_data with the missing Mayo fields when diameter is absent and PET is available', () => {
    const input: AssessmentInput = {
      clinicalContext: 'screening',
      patient: {
        clinicalContext: 'screening',
        age: 60,
        hasKnownMalignancy: false,
        isImmunocompromised: false,
        sex: 'male',
        smokingStatus: 'current',
        extrathoracicCancerHistory: 'none',
        hasFamilyHistoryLungCancer: false,
        hasEmphysema: false,
      },
      nodule: {
        type: 'solid',
        isMultiple: false,
        noduleCount: 1,
        hasSpiculation: false,
        isUpperLobe: true,
        hasPet: true,
        petUptake: 'moderate',
        scanType: 'baseline',
      },
    };

    const herder = getSummary(input, 'herder');
    expect(herder.status).toBe('insufficient_data');
    expect(herder.preTestModelId).toBe('mayo');
    expect(herder.missingFields).toContain('Diámetro');
  });

  test('Herder stays not_applicable for a known diameter below 4 mm', () => {
    const input: AssessmentInput = {
      clinicalContext: 'screening',
      patient: {
        clinicalContext: 'screening',
        age: 60,
        hasKnownMalignancy: false,
        isImmunocompromised: false,
        sex: 'male',
        smokingStatus: 'current',
        extrathoracicCancerHistory: 'none',
        hasFamilyHistoryLungCancer: false,
        hasEmphysema: false,
      },
      nodule: {
        type: 'solid',
        diameterMm: 3,
        isMultiple: false,
        noduleCount: 1,
        hasSpiculation: false,
        isUpperLobe: true,
        hasPet: true,
        petUptake: 'moderate',
        scanType: 'baseline',
      },
    };

    const herder = getSummary(input, 'herder');
    expect(herder.status).toBe('not_applicable');
    expect(herder.missingFields).toBeUndefined();
  });

  test('Brock uses the maximum transverse diameter when provided', () => {
    const input: AssessmentInput = {
      clinicalContext: 'screening',
      patient: {
        clinicalContext: 'screening',
        age: 65,
        hasKnownMalignancy: false,
        isImmunocompromised: false,
        sex: 'female',
        smokingStatus: 'former',
        extrathoracicCancerHistory: 'none',
        hasFamilyHistoryLungCancer: false,
        hasEmphysema: false,
      },
      nodule: {
        type: 'solid',
        diameterMm: 15,
        maxDiameterMm: 20,
        solidComponentMm: undefined,
        isMultiple: false,
        noduleCount: 1,
        hasSpiculation: false,
        isUpperLobe: true,
        hasPet: false,
        petUptake: undefined,
        scanType: 'baseline',
      },
    };

    const summary = getSummary(input, 'brock');
    expect(summary.status).toBe('available');
    expect(summary.probability).toBeCloseTo(0.38, 2);
    expect(summary.notes?.some((n) => n.includes('diámetro máximo transversal'))).not.toBe(true);
  });

  test('Brock falls back to the mean diameter with an underestimation note', () => {
    const input: AssessmentInput = {
      clinicalContext: 'screening',
      patient: {
        clinicalContext: 'screening',
        age: 65,
        hasKnownMalignancy: false,
        isImmunocompromised: false,
        sex: 'female',
        smokingStatus: 'former',
        extrathoracicCancerHistory: 'none',
        hasFamilyHistoryLungCancer: false,
        hasEmphysema: false,
      },
      nodule: {
        type: 'solid',
        diameterMm: 15,
        solidComponentMm: undefined,
        isMultiple: false,
        noduleCount: 1,
        hasSpiculation: false,
        isUpperLobe: true,
        hasPet: false,
        petUptake: undefined,
        scanType: 'baseline',
      },
    };

    const summary = getSummary(input, 'brock');
    expect(summary.status).toBe('available');
    expect(summary.probability).toBeCloseTo(0.2537, 3);
    expect(summary.notes?.some((n) => n.includes('diámetro máximo transversal'))).toBe(true);
  });
});
