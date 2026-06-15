import { getPredictiveSummaries, getRecommendedPredictiveModel } from '@lib/predictive';
import { AssessmentInput } from '@lib/schemas/noduleInput';

describe('Predictive models', () => {
  const getSummary = (input: AssessmentInput, id: 'mayo' | 'brock' | 'herder') => {
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

  test('Herder requires pre-test probability ≥10%', () => {
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
    expect(summary.status).toBe('not_applicable');
    expect(summary.reason).toContain('10%');
  });

  test('Herder uses Mayo pre-test odds with PET LR', () => {
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
    expect(summary.probability).toBeCloseTo(0.2709, 4);
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
          "probability": 0.9893,
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

    expect(spiculatedLowerLobe.probability).toBeGreaterThan(
      smoothUpperLobe.probability as number,
    );
  });

  test('incidental 7 mm with intense PET: Mayo pre-PET ~18.7%, Herder post-PET ~70% (MDCalc-style)', () => {
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
    expect(herder.probability).toBeCloseTo(0.696, 2);
    expect(herder.preTestProbability).toBeCloseTo(0.187, 3);
    expect(getRecommendedPredictiveModel(input)).toBe('herder');
  });
});
