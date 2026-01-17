import { AssessmentInput } from "@lib/schemas/noduleInput";
import { PredictiveModelId, PredictiveModelSummary } from "./types";

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

  return [
    buildMayoSummary(input),
    buildBrockSummary(input),
    buildHerderSummary(input),
  ];
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

  return {
    id: "mayo",
    label: MODEL_LABELS.mayo,
    status: "pending",
    notes: ["Fórmula pendiente de validación con coeficientes oficiales."],
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

  return {
    id: "brock",
    label: MODEL_LABELS.brock,
    status: "pending",
    notes: ["Fórmula pendiente de validación con coeficientes oficiales."],
  };
}

function buildHerderSummary(input: AssessmentInput): PredictiveModelSummary {
  const missingFields: string[] = [];
  const diameter = input.nodule.diameterMm;

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

  if (!input.nodule.petUptake) missingFields.push("Captación FDG");
  missingFields.push("Riesgo pre-test (Mayo/Brock)");

  if (missingFields.length > 0) {
    return {
      id: "herder",
      label: MODEL_LABELS.herder,
      status: "insufficient_data",
      missingFields,
      notes: ["Se calculará una vez estén disponibles Mayo/Brock."],
    };
  }

  return {
    id: "herder",
    label: MODEL_LABELS.herder,
    status: "pending",
    notes: ["Fórmula pendiente de validación con coeficientes oficiales."],
  };
}
