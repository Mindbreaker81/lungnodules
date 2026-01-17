import { AssessmentInput } from "@lib/schemas/noduleInput";
import { PredictiveModelId, PredictiveModelSummary, PredictiveRiskBand } from "./types";

export type {
  PredictiveModelId,
  PredictiveModelSummary,
  PredictiveRiskBand,
  PredictiveStatus,
} from "./types";

const MODEL_LABELS: Record<PredictiveModelId, string> = {
  mayo: "Mayo Clinic",
  brock: "Brock (Pan-Can)",
  herder: "Herder (post-PET)",
};

const hasNumber = (value: unknown): value is number =>
  typeof value === "number" && !Number.isNaN(value);

const hasBoolean = (value: unknown): value is boolean => typeof value === "boolean";

const isMassTooLarge = (diameterMm?: number) =>
  typeof diameterMm === "number" && diameterMm > 30;

const logistic = (value: number) => 1 / (1 + Math.exp(-value));

const toRiskBand = (probability: number): PredictiveRiskBand => {
  if (probability < 0.05) return "low";
  if (probability <= 0.65) return "intermediate";
  return "high";
};

const MAYO_COEFFICIENTS = {
  intercept: -6.827,
  age: 0.039,
  smoking: 0.791,
  cancer: 1.338,
  diameter: 0.127,
  spiculation: 0.71,
  upper: 1.138,
} as const;

const BROCK_COEFFICIENTS = {
  intercept: -8.4852,
  age: 0.0287,
  sexFemale: 0.6011,
  familyHistory: 0.2961,
  emphysema: 0.2953,
  diameter: 0.0546,
  noduleCount: -0.0654,
  spiculation: 0.3543,
  upper: 0.3138,
  nonsolid: -0.1271,
  partSolid: 0.377,
} as const;

const HERDER_LIKELIHOOD_RATIOS: Record<string, number> = {
  absent: 0.08,
  faint: 0.17,
  moderate: 1.9,
  intense: 9.9,
};

export function getRecommendedPredictiveModel(
  input: AssessmentInput | null,
): PredictiveModelId | null {
  if (!input) return null;
  return input.clinicalContext === "screening" ? "brock" : "mayo";
}

export function getPredictiveSummaries(
  input: AssessmentInput | null,
): PredictiveModelSummary[] {
  if (!input) return [];

  const mayoSummary = buildMayoSummary(input);
  const brockSummary = buildBrockSummary(input);
  const herderSummary = buildHerderSummary(input, {
    mayoSummary,
    brockSummary,
  });

  return [mayoSummary, brockSummary, herderSummary];
}

function buildMayoSummary(input: AssessmentInput): PredictiveModelSummary {
  const missingFields: string[] = [];
  const diameter = input.nodule.diameterMm;

  if (input.clinicalContext !== "incidental") {
    return {
      id: "mayo",
      label: MODEL_LABELS.mayo,
      status: "not_applicable",
      reason: "Recomendado para hallazgos incidentales; usa Brock en screening.",
    };
  }

  if (isMassTooLarge(diameter)) {
    return {
      id: "mayo",
      label: MODEL_LABELS.mayo,
      status: "not_applicable",
      reason: "No aplicar a masas >30 mm.",
    };
  }

  if (input.patient.hasKnownMalignancy) {
    return {
      id: "mayo",
      label: MODEL_LABELS.mayo,
      status: "not_applicable",
      reason: "No aplica con cáncer conocido.",
    };
  }

  if (input.patient.extrathoracicCancerHistory === "recent") {
    return {
      id: "mayo",
      label: MODEL_LABELS.mayo,
      status: "not_applicable",
      reason: "No aplica si cáncer extratorácico fue <5 años.",
    };
  }

  if (!hasNumber(input.patient.age)) missingFields.push("Edad");
  if (!input.patient.smokingStatus) missingFields.push("Tabaquismo");
  if (!input.patient.extrathoracicCancerHistory) missingFields.push("Cáncer extratorácico (>5 años)");
  if (!hasNumber(diameter)) missingFields.push("Diámetro");
  if (!hasBoolean(input.nodule.isUpperLobe)) missingFields.push("Lóbulo superior");
  if (!hasBoolean(input.nodule.hasSpiculation)) missingFields.push("Espiculación");

  if (missingFields.length > 0) {
    return {
      id: "mayo",
      label: MODEL_LABELS.mayo,
      status: "insufficient_data",
      missingFields,
    };
  }

  const smoking = input.patient.smokingStatus === "current" || input.patient.smokingStatus === "former" ? 1 : 0;
  const cancer = input.patient.extrathoracicCancerHistory === "over5y" ? 1 : 0;
  const spiculation = input.nodule.hasSpiculation ? 1 : 0;
  const upper = input.nodule.isUpperLobe ? 1 : 0;

  const logOdds =
    MAYO_COEFFICIENTS.intercept +
    MAYO_COEFFICIENTS.age * input.patient.age +
    MAYO_COEFFICIENTS.smoking * smoking +
    MAYO_COEFFICIENTS.cancer * cancer +
    MAYO_COEFFICIENTS.diameter * diameter +
    MAYO_COEFFICIENTS.spiculation * spiculation +
    MAYO_COEFFICIENTS.upper * upper;

  const probability = logistic(logOdds);

  return {
    id: "mayo",
    label: MODEL_LABELS.mayo,
    status: "available",
    probability,
    riskBand: toRiskBand(probability),
  };
}

function buildBrockSummary(input: AssessmentInput): PredictiveModelSummary {
  const missingFields: string[] = [];
  const diameter = input.nodule.diameterMm;
  const resolvedNoduleCount =
    input.nodule.noduleCount ?? (input.nodule.isMultiple ? undefined : 1);

  if (input.clinicalContext !== "screening") {
    return {
      id: "brock",
      label: MODEL_LABELS.brock,
      status: "not_applicable",
      reason: "Recomendado para cohortes de screening (Lung-RADS).",
    };
  }

  if (isMassTooLarge(diameter)) {
    return {
      id: "brock",
      label: MODEL_LABELS.brock,
      status: "not_applicable",
      reason: "No aplicar a masas >30 mm.",
    };
  }

  if (!hasNumber(input.patient.age)) missingFields.push("Edad");
  if (!input.patient.sex) missingFields.push("Sexo");
  if (!hasBoolean(input.patient.hasFamilyHistoryLungCancer)) missingFields.push("Historia familiar");
  if (!hasBoolean(input.patient.hasEmphysema)) missingFields.push("Enfisema");
  if (!hasNumber(diameter)) missingFields.push("Diámetro");
  if (!input.nodule.type) missingFields.push("Tipo de nódulo");
  if (!hasBoolean(input.nodule.isUpperLobe)) missingFields.push("Lóbulo superior");
  if (!resolvedNoduleCount) missingFields.push("Número de nódulos");
  if (!hasBoolean(input.nodule.hasSpiculation)) missingFields.push("Espiculación");

  if (missingFields.length > 0) {
    return {
      id: "brock",
      label: MODEL_LABELS.brock,
      status: "insufficient_data",
      missingFields,
    };
  }

  const sexFemale = input.patient.sex === "female" ? 1 : 0;
  const familyHistory = input.patient.hasFamilyHistoryLungCancer ? 1 : 0;
  const emphysema = input.patient.hasEmphysema ? 1 : 0;
  const spiculation = input.nodule.hasSpiculation ? 1 : 0;
  const upper = input.nodule.isUpperLobe ? 1 : 0;
  const noduleCount = resolvedNoduleCount ?? 1;
  const additionalNodules = Math.max(noduleCount - 1, 0);
  const nonsolid = input.nodule.type === "ground-glass" ? 1 : 0;
  const partSolid = input.nodule.type === "part-solid" ? 1 : 0;

  const logOdds =
    BROCK_COEFFICIENTS.intercept +
    BROCK_COEFFICIENTS.age * input.patient.age +
    BROCK_COEFFICIENTS.sexFemale * sexFemale +
    BROCK_COEFFICIENTS.familyHistory * familyHistory +
    BROCK_COEFFICIENTS.emphysema * emphysema +
    BROCK_COEFFICIENTS.diameter * diameter +
    BROCK_COEFFICIENTS.noduleCount * additionalNodules +
    BROCK_COEFFICIENTS.spiculation * spiculation +
    BROCK_COEFFICIENTS.upper * upper +
    BROCK_COEFFICIENTS.nonsolid * nonsolid +
    BROCK_COEFFICIENTS.partSolid * partSolid;

  const probability = logistic(logOdds);

  return {
    id: "brock",
    label: MODEL_LABELS.brock,
    status: "available",
    probability,
    riskBand: toRiskBand(probability),
  };
}

function buildHerderSummary(
  input: AssessmentInput,
  summaries: {
    mayoSummary: PredictiveModelSummary;
    brockSummary: PredictiveModelSummary;
  }
): PredictiveModelSummary {
  const missingFields: string[] = [];
  const diameter = input.nodule.diameterMm;
  const preTestSummary =
    input.clinicalContext === "screening" ? summaries.brockSummary : summaries.mayoSummary;

  if (!input.nodule.hasPet || !hasNumber(diameter) || diameter < 8) {
    return {
      id: "herder",
      label: MODEL_LABELS.herder,
      status: "not_applicable",
      reason: "Requiere PET-CT disponible y nódulo ≥8 mm.",
    };
  }

  if (isMassTooLarge(diameter)) {
    return {
      id: "herder",
      label: MODEL_LABELS.herder,
      status: "not_applicable",
      reason: "No aplicar a masas >30 mm.",
    };
  }

  if (preTestSummary.status === "not_applicable") {
    return {
      id: "herder",
      label: MODEL_LABELS.herder,
      status: "not_applicable",
      reason: "Riesgo pre-test no aplicable para este contexto.",
      preTestModelId: preTestSummary.id,
    };
  }

  if (!input.nodule.petUptake) missingFields.push("Captación FDG");
  if (preTestSummary.status !== "available" || preTestSummary.probability === undefined) {
    missingFields.push("Riesgo pre-test (Mayo/Brock)");
  }

  if (missingFields.length > 0) {
    return {
      id: "herder",
      label: MODEL_LABELS.herder,
      status: "insufficient_data",
      missingFields,
      preTestModelId: preTestSummary.id,
      preTestProbability: preTestSummary.probability,
    };
  }

  const preTestProbability = preTestSummary.probability ?? 0;
  if (preTestProbability < 0.1) {
    return {
      id: "herder",
      label: MODEL_LABELS.herder,
      status: "not_applicable",
      reason: "BTS: usar Herder solo si riesgo pre-test ≥10%.",
      preTestModelId: preTestSummary.id,
      preTestProbability,
    };
  }
  const likelihoodRatio = input.nodule.petUptake
    ? HERDER_LIKELIHOOD_RATIOS[input.nodule.petUptake]
    : undefined;

  if (!likelihoodRatio) {
    return {
      id: "herder",
      label: MODEL_LABELS.herder,
      status: "insufficient_data",
      missingFields: ["Captación FDG"],
      preTestModelId: preTestSummary.id,
      preTestProbability,
    };
  }

  const preTestOdds = preTestProbability / (1 - preTestProbability);
  const postTestOdds = preTestOdds * likelihoodRatio;
  const probability = postTestOdds / (1 + postTestOdds);

  return {
    id: "herder",
    label: MODEL_LABELS.herder,
    status: "available",
    probability,
    riskBand: toRiskBand(probability),
    preTestModelId: preTestSummary.id,
    preTestProbability,
    notes: ["Odds ajustadas con LR de FDG-PET (Herder 2005)."],
  };
}
