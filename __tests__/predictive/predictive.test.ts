import { getPredictiveSummaries } from "@lib/predictive";
import { AssessmentInput } from "@lib/schemas/noduleInput";

describe("Predictive models", () => {
  const getSummary = (input: AssessmentInput, id: "mayo" | "brock" | "herder") => {
    const summary = getPredictiveSummaries(input).find((item) => item.id === id);
    if (!summary) {
      throw new Error(`Missing summary for ${id}`);
    }
    return summary;
  };

  test("Mayo calculation returns probability and high risk band", () => {
    const input: AssessmentInput = {
      clinicalContext: "incidental",
      patient: {
        clinicalContext: "incidental",
        age: 65,
        riskLevel: "low",
        hasKnownMalignancy: false,
        isImmunocompromised: false,
        sex: "male",
        smokingStatus: "current",
        extrathoracicCancerHistory: "over5y",
        hasFamilyHistoryLungCancer: false,
        hasEmphysema: false,
      },
      nodule: {
        type: "solid",
        diameterMm: 16,
        solidComponentMm: undefined,
        isMultiple: false,
        hasSpiculation: true,
        isUpperLobe: true,
        hasPet: false,
        petUptake: undefined,
      },
    };

    const summary = getSummary(input, "mayo");
    expect(summary.status).toBe("available");
    expect(summary.probability).toBeCloseTo(0.848, 3);
    expect(summary.riskBand).toBe("high");
  });

  test("Brock calculation returns probability and low risk band", () => {
    const input: AssessmentInput = {
      clinicalContext: "screening",
      patient: {
        clinicalContext: "screening",
        age: 70,
        riskLevel: "low",
        hasKnownMalignancy: false,
        isImmunocompromised: false,
        sex: "female",
        smokingStatus: "former",
        extrathoracicCancerHistory: "none",
        hasFamilyHistoryLungCancer: true,
        hasEmphysema: true,
      },
      nodule: {
        type: "part-solid",
        diameterMm: 10,
        solidComponentMm: 4,
        isMultiple: true,
        noduleCount: 3,
        hasSpiculation: true,
        isUpperLobe: true,
        hasPet: false,
        petUptake: undefined,
        scanType: "baseline",
      },
    };

    const summary = getSummary(input, "brock");
    expect(summary.status).toBe("available");
    expect(summary.probability).toBeCloseTo(0.0214, 4);
    expect(summary.riskBand).toBe("low");
  });

  test("Herder requires pre-test probability ≥10%", () => {
    const input: AssessmentInput = {
      clinicalContext: "incidental",
      patient: {
        clinicalContext: "incidental",
        age: 40,
        riskLevel: "low",
        hasKnownMalignancy: false,
        isImmunocompromised: false,
        sex: "male",
        smokingStatus: "never",
        extrathoracicCancerHistory: "none",
        hasFamilyHistoryLungCancer: false,
        hasEmphysema: false,
      },
      nodule: {
        type: "solid",
        diameterMm: 8,
        solidComponentMm: undefined,
        isMultiple: false,
        hasSpiculation: false,
        isUpperLobe: false,
        hasPet: true,
        petUptake: "moderate",
      },
    };

    const summary = getSummary(input, "herder");
    expect(summary.status).toBe("not_applicable");
    expect(summary.reason).toContain("10%");
  });

  test("Herder uses Mayo pre-test odds with PET LR", () => {
    const input: AssessmentInput = {
      clinicalContext: "incidental",
      patient: {
        clinicalContext: "incidental",
        age: 60,
        riskLevel: "low",
        hasKnownMalignancy: false,
        isImmunocompromised: false,
        sex: "male",
        smokingStatus: "current",
        extrathoracicCancerHistory: "none",
        hasFamilyHistoryLungCancer: false,
        hasEmphysema: false,
      },
      nodule: {
        type: "solid",
        diameterMm: 10,
        solidComponentMm: undefined,
        isMultiple: false,
        hasSpiculation: false,
        isUpperLobe: true,
        hasPet: true,
        petUptake: "moderate",
      },
    };

    const summary = getSummary(input, "herder");
    expect(summary.status).toBe("available");
    expect(summary.preTestModelId).toBe("mayo");
    expect(summary.preTestProbability).toBeCloseTo(0.216, 3);
    expect(summary.probability).toBeCloseTo(0.344, 3);
    expect(summary.riskBand).toBe("intermediate");
  });

  test("Predictive summaries snapshot", () => {
    const input: AssessmentInput = {
      clinicalContext: "incidental",
      patient: {
        clinicalContext: "incidental",
        age: 72,
        riskLevel: "high",
        hasKnownMalignancy: false,
        isImmunocompromised: false,
        sex: "female",
        smokingStatus: "former",
        extrathoracicCancerHistory: "over5y",
        hasFamilyHistoryLungCancer: false,
        hasEmphysema: true,
      },
      nodule: {
        type: "solid",
        diameterMm: 18,
        solidComponentMm: undefined,
        isMultiple: false,
        hasSpiculation: true,
        isUpperLobe: true,
        hasPet: true,
        petUptake: "intense",
      },
    };

    const summaries = getPredictiveSummaries(input).map((summary) => ({
      id: summary.id,
      status: summary.status,
      probability: summary.probability !== undefined ? Number(summary.probability.toFixed(4)) : undefined,
      riskBand: summary.riskBand,
      reason: summary.reason,
      preTestProbability:
        summary.preTestProbability !== undefined ? Number(summary.preTestProbability.toFixed(4)) : undefined,
    }));

    expect(summaries).toMatchInlineSnapshot(`
      [
        {
          "id": "mayo",
          "preTestProbability": undefined,
          "probability": 0.9041,
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
          "preTestProbability": 0.9041,
          "probability": 0.9894,
          "reason": undefined,
          "riskBand": "high",
          "status": "available",
        },
      ]
    `);
  });
});
