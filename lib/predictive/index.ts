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
  herder: "Herder (2005)",
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

// Mayo Clinic model (Swensen et al., Arch Intern Med 1997;157:849-855).
// x = -6.8272 + 0.0391·age + 0.7917·smoking + 1.3388·cancer + 0.1274·diameter
//     + 1.0407·spiculation + 0.7838·upperLobe
const MAYO_COEFFICIENTS = {
  intercept: -6.8272,
  age: 0.0391,
  smoking: 0.7917,
  cancer: 1.3388,
  diameter: 0.1274,
  spiculation: 1.0407,
  upper: 0.7838,
} as const;

// Brock/PanCan Model 2b — full model with spiculation (McWilliams et al., NEJM 2013;369:910-919).
// Note the non-linear size transform, age centered at 62 and nodule count centered at 4:
// x = -6.7892 + 0.0287·(age-62) + 0.6011·female + 0.2961·familyHistory + 0.2953·emphysema
//     - 5.3854·[(size/10)^-0.5 - 1.58113883] + type + 0.6581·upperLobe
//     - 0.0824·(count-4) + 0.7729·spiculation
const BROCK_COEFFICIENTS = {
  intercept: -6.7892,
  age: 0.0287,
  ageCenter: 62,
  sexFemale: 0.6011,
  familyHistory: 0.2961,
  emphysema: 0.2953,
  size: -5.3854,
  sizeOffset: 1.58113883,
  noduleCount: -0.0824,
  noduleCountCenter: 4,
  spiculation: 0.7729,
  upper: 0.6581,
  nonsolid: -0.1276,
  partSolid: 0.377,
} as const;

// Brock/PanCan Model 2a — full model without spiculation (McWilliams et al., NEJM 2013;369:910-919).
// Used when spiculation has not been evaluated (hasSpiculation === undefined).
// x = -6.8071 + 0.0321·(age-62) + 0.5635·female + 0.3013·familyHistory + 0.3462·emphysema
//     - 5.6693·[(size/10)^-0.5 - 1.58113883] + type + 0.7116·upperLobe
//     - 0.0803·(count-4)
const BROCK_COEFFICIENTS_NO_SPIC = {
  intercept: -6.8071,
  age: 0.0321,
  ageCenter: 62,
  sexFemale: 0.5635,
  familyHistory: 0.3013,
  emphysema: 0.3462,
  size: -5.6693,
  sizeOffset: 1.58113883,
  noduleCount: -0.0803,
  noduleCountCenter: 4,
  upper: 0.7116,
  nonsolid: -0.3005,
  partSolid: 0.3395,
} as const;

// Herder/Leiden logistic regression model (Herder et al., Chest 2005;128:2490-2496).
// Published formula (single multivariable model in the paper):
//   x = -4.739 + 3.691·P_pretest + βFDG
//   P = 1/(1+e^-x)
// P_pretest is the Mayo/Swensen probability entered as a FRACTION 0–1 (not 0–100):
// e.g. P_pretest=0.187 + intense → x = -4.739 + 0.690 + 4.771 = 0.722 → P≈0.673.
// FDG uptake is the 4-point visual scale of the paper (absent/faint/moderate/intense).
const HERDER_COEFFICIENTS = {
  intercept: -4.739,
  preTest: 3.691,
} as const;

const HERDER_FDG: Record<string, number> = {
  absent: 0,
  faint: 2.322,
  moderate: 4.617,
  intense: 4.771,
};

/** Mayo/Herder valid diameter range (Swensen 1997; MDCalc uses 4–30 mm). */
const MAYO_MIN_DIAMETER_MM = 4;

/** Below this size, FDG-PET uptake is less reliable; shown as a caution note. */
const HERDER_SMALL_NODULE_CAUTION_MM = 8;

export function getRecommendedPredictiveModel(
  input: AssessmentInput | null,
): PredictiveModelId | null {
  if (!input) return null;
  const herder = getPredictiveSummaries(input).find((summary) => summary.id === "herder");
  if (herder?.status === "available") return "herder";
  return input.clinicalContext === "screening" ? "brock" : "mayo";
}

export function getPredictiveSummaries(
  input: AssessmentInput | null,
): PredictiveModelSummary[] {
  if (!input) return [];

  const mayoComputation = computeMayo(input);
  const mayoSummary = buildMayoSummary(input, mayoComputation);
  const brockSummary = buildBrockSummary(input);
  const eligibility = evaluateHerderEligibility(input, mayoComputation);
  const herderSummary = buildHerderSummary(input, eligibility);

  return [mayoSummary, brockSummary, herderSummary];
}

type MayoComputation =
  | { status: "available"; probability: number }
  | { status: "insufficient_data"; missingFields: string[] }
  | { status: "not_applicable"; reason: string };

function computeMayo(input: AssessmentInput): MayoComputation {
  const missingFields: string[] = [];
  const age = input.patient.age;
  const diameter = input.nodule.diameterMm;

  if (isMassTooLarge(diameter)) {
    return { status: "not_applicable", reason: "No aplicar a masas >30 mm." };
  }

  if (input.patient.hasKnownMalignancy) {
    return { status: "not_applicable", reason: "No aplica con cáncer conocido." };
  }

  if (input.patient.extrathoracicCancerHistory === "recent") {
    return {
      status: "not_applicable",
      reason: "No aplica si cáncer extratorácico fue <5 años.",
    };
  }

  if (!hasNumber(age)) missingFields.push("Edad");
  if (!input.patient.smokingStatus) missingFields.push("Tabaquismo");
  if (!input.patient.extrathoracicCancerHistory) missingFields.push("Cáncer extratorácico (>5 años)");
  if (!hasNumber(diameter)) missingFields.push("Diámetro");
  if (!hasBoolean(input.nodule.isUpperLobe)) missingFields.push("Lóbulo superior");
  if (!hasBoolean(input.nodule.hasSpiculation)) missingFields.push("Espiculación");

  if (missingFields.length > 0) {
    return { status: "insufficient_data", missingFields };
  }

  const resolvedAge = age as number;
  const resolvedDiameter = diameter as number;

  const smoking = input.patient.smokingStatus === "current" || input.patient.smokingStatus === "former" ? 1 : 0;
  const cancer = input.patient.extrathoracicCancerHistory === "over5y" ? 1 : 0;
  const spiculation = input.nodule.hasSpiculation ? 1 : 0;
  const upper = input.nodule.isUpperLobe ? 1 : 0;

  const logOdds =
    MAYO_COEFFICIENTS.intercept +
    MAYO_COEFFICIENTS.age * resolvedAge +
    MAYO_COEFFICIENTS.smoking * smoking +
    MAYO_COEFFICIENTS.cancer * cancer +
    MAYO_COEFFICIENTS.diameter * resolvedDiameter +
    MAYO_COEFFICIENTS.spiculation * spiculation +
    MAYO_COEFFICIENTS.upper * upper;

  return { status: "available", probability: logistic(logOdds) };
}

function buildMayoSummary(
  input: AssessmentInput,
  mayo: MayoComputation,
): PredictiveModelSummary {
  if (input.clinicalContext !== "incidental") {
    return {
      id: "mayo",
      label: MODEL_LABELS.mayo,
      status: "not_applicable",
      reason: "Recomendado para hallazgos incidentales; usa Brock en screening.",
    };
  }

  if (mayo.status === "not_applicable") {
    return {
      id: "mayo",
      label: MODEL_LABELS.mayo,
      status: "not_applicable",
      reason: mayo.reason,
    };
  }

  if (mayo.status === "insufficient_data") {
    return {
      id: "mayo",
      label: MODEL_LABELS.mayo,
      status: "insufficient_data",
      missingFields: mayo.missingFields,
    };
  }

  const notes =
    input.nodule.hasPet && input.nodule.petUptake
      ? [
          "Probabilidad pre-PET (modelo Mayo). No incorpora captación FDG; ver Herder para riesgo post-PET.",
        ]
      : undefined;

  return {
    id: "mayo",
    label: MODEL_LABELS.mayo,
    status: "available",
    probability: mayo.probability,
    riskBand: toRiskBand(mayo.probability),
    notes,
  };
}

function buildBrockSummary(input: AssessmentInput): PredictiveModelSummary {
  const missingFields: string[] = [];
  const age = input.patient.age;
  // McWilliams 2013 was developed on the maximum transverse diameter;
  // fall back to the mean diameter when it was not recorded.
  const usesMaxDiameter = hasNumber(input.nodule.maxDiameterMm);
  const brockDiameter = usesMaxDiameter
    ? (input.nodule.maxDiameterMm as number)
    : input.nodule.diameterMm;
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

  if (isMassTooLarge(brockDiameter)) {
    return {
      id: "brock",
      label: MODEL_LABELS.brock,
      status: "not_applicable",
      reason: "No aplicar a masas >30 mm.",
    };
  }

  if (!hasNumber(age)) missingFields.push("Edad");
  if (!input.patient.sex) missingFields.push("Sexo");
  if (!hasBoolean(input.patient.hasFamilyHistoryLungCancer)) missingFields.push("Historia familiar");
  if (!hasBoolean(input.patient.hasEmphysema)) missingFields.push("Enfisema");
  if (!hasNumber(brockDiameter)) missingFields.push("Diámetro");
  if (!input.nodule.type) missingFields.push("Tipo de nódulo");
  if (!hasBoolean(input.nodule.isUpperLobe)) missingFields.push("Lóbulo superior");
  if (!resolvedNoduleCount) missingFields.push("Número de nódulos");

  if (missingFields.length > 0) {
    return {
      id: "brock",
      label: MODEL_LABELS.brock,
      status: "insufficient_data",
      missingFields,
    };
  }

  const resolvedAge = age as number;
  const resolvedDiameter = brockDiameter as number;

  // Model 2b (with spiculation) when spiculation is evaluated;
  // Model 2a (without spiculation) when it is not.
  const useSpiculation = hasBoolean(input.nodule.hasSpiculation);
  const coeffs = useSpiculation ? BROCK_COEFFICIENTS : BROCK_COEFFICIENTS_NO_SPIC;

  const sexFemale = input.patient.sex === "female" ? 1 : 0;
  const familyHistory = input.patient.hasFamilyHistoryLungCancer ? 1 : 0;
  const emphysema = input.patient.hasEmphysema ? 1 : 0;
  const spiculation = input.nodule.hasSpiculation ? 1 : 0;
  const upper = input.nodule.isUpperLobe ? 1 : 0;
  const noduleCount = resolvedNoduleCount ?? 1;
  const nonsolid = input.nodule.type === "ground-glass" ? 1 : 0;
  const partSolid = input.nodule.type === "part-solid" ? 1 : 0;

  // Brock enters nodule size through a non-linear transform, not linearly.
  const sizeTerm =
    Math.pow(resolvedDiameter / 10, -0.5) - coeffs.sizeOffset;

  const logOdds =
    coeffs.intercept +
    coeffs.age * (resolvedAge - coeffs.ageCenter) +
    coeffs.sexFemale * sexFemale +
    coeffs.familyHistory * familyHistory +
    coeffs.emphysema * emphysema +
    coeffs.size * sizeTerm +
    coeffs.noduleCount * (noduleCount - coeffs.noduleCountCenter) +
    (useSpiculation ? BROCK_COEFFICIENTS.spiculation * spiculation : 0) +
    coeffs.upper * upper +
    coeffs.nonsolid * nonsolid +
    coeffs.partSolid * partSolid;

  const probability = logistic(logOdds);

  const notes = [
    ...(useSpiculation
      ? []
      : ["Variante sin espiculación (Model 2a): la espiculación no se evaluó."]),
    ...(!usesMaxDiameter
      ? [
          "Brock se desarrolló con el diámetro máximo transversal; se está usando el diámetro medio, lo que puede infraestimar el riesgo.",
        ]
      : []),
  ];

  return {
    id: "brock",
    label: MODEL_LABELS.brock,
    status: "available",
    probability,
    riskBand: toRiskBand(probability),
    notes: notes.length > 0 ? notes : undefined,
  };
}

/** Herder eligibility: PET available and a calculable Mayo pre-test probability. */
type HerderEligibility =
  | { kind: "blocked"; fields: Omit<PredictiveModelSummary, "id" | "label"> }
  | { kind: "ok"; preTestProbability: number; preTestModelId: PredictiveModelId };

function evaluateHerderEligibility(
  input: AssessmentInput,
  mayo: MayoComputation,
): HerderEligibility {
  const diameter = input.nodule.diameterMm;

  // Absent diameter is not an exclusion: it falls through to the Mayo result,
  // which reports it as a missing field (insufficient_data).
  if (
    !input.nodule.hasPet ||
    (hasNumber(diameter) && diameter < MAYO_MIN_DIAMETER_MM)
  ) {
    return {
      kind: "blocked",
      fields: {
        status: "not_applicable",
        reason: `Requiere PET-CT disponible y nódulo ≥${MAYO_MIN_DIAMETER_MM} mm.`,
      },
    };
  }

  if (isMassTooLarge(diameter)) {
    return {
      kind: "blocked",
      fields: { status: "not_applicable", reason: "No aplicar a masas >30 mm." },
    };
  }

  // The published regression was fitted on the Mayo pre-test probability;
  // Herder always uses Mayo in both contexts (never Brock).
  if (mayo.status === "not_applicable") {
    return {
      kind: "blocked",
      fields: {
        status: "not_applicable",
        reason: `Pre-test Mayo no aplicable: ${mayo.reason}`,
        preTestModelId: "mayo",
      },
    };
  }

  const missingFields: string[] = [];
  if (!input.nodule.petUptake) missingFields.push("Captación FDG");
  if (mayo.status === "insufficient_data") {
    missingFields.push(...mayo.missingFields);
  }

  if (missingFields.length > 0) {
    return {
      kind: "blocked",
      fields: {
        status: "insufficient_data",
        missingFields,
        preTestModelId: "mayo",
        preTestProbability: mayo.status === "available" ? mayo.probability : undefined,
      },
    };
  }

  return {
    kind: "ok",
    preTestProbability: mayo.status === "available" ? mayo.probability : 0,
    preTestModelId: "mayo",
  };
}

// Herder 2005: multivariable logistic regression on Mayo pre-test + FDG uptake.
function buildHerderSummary(
  input: AssessmentInput,
  eligibility: HerderEligibility,
): PredictiveModelSummary {
  if (eligibility.kind === "blocked") {
    return { id: "herder", label: MODEL_LABELS.herder, ...eligibility.fields };
  }

  const { preTestProbability, preTestModelId } = eligibility;
  const diameter = input.nodule.diameterMm;

  const fdgTerm = input.nodule.petUptake
    ? HERDER_FDG[input.nodule.petUptake]
    : undefined;

  if (fdgTerm === undefined) {
    return {
      id: "herder",
      label: MODEL_LABELS.herder,
      status: "insufficient_data",
      missingFields: ["Captación FDG"],
      preTestModelId,
      preTestProbability,
    };
  }

  const x =
    HERDER_COEFFICIENTS.intercept +
    HERDER_COEFFICIENTS.preTest * preTestProbability +
    fdgTerm;
  const probability = logistic(x);

  return {
    id: "herder",
    label: MODEL_LABELS.herder,
    status: "available",
    probability,
    riskBand: toRiskBand(probability),
    preTestModelId,
    preTestProbability,
    notes: [
      "Regresión logística multivariable publicada en Herder 2005.",
      "Cálculo: x = -4.739 + 3.691·P_pre + βFDG (faint 2.322 · moderate 4.617 · intense 4.771); P = 1/(1+e^-x).",
      "P_pre es la probabilidad Mayo como fracción 0–1; captación FDG en escala visual de 4 puntos.",
      "Fuente: Herder GJ et al., Chest 2005;128:2490-2496 (fórmula reproducida en Mourato 2020, PMC7159041).",
      ...(hasNumber(diameter) && diameter < HERDER_SMALL_NODULE_CAUTION_MM
        ? [
            `Precaución: la captación FDG-PET es menos sensible en nódulos <${HERDER_SMALL_NODULE_CAUTION_MM} mm; interpretar el resultado con cautela.`,
          ]
        : []),
      ...(preTestProbability < 0.1
        ? [
            "Nota informativa: la guía BTS 2015 recomienda PET-CT (y por tanto Herder) cuando el riesgo pre-test es ≥10%; no es una restricción del modelo.",
          ]
        : []),
    ],
  };
}
