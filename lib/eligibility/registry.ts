import type { EligibilityModel, EligibilityResult, Plcom2012Input } from "./types";
import { computePlcom2012 } from "./plcom2012";
import {
  plcom2012InputSchema,
  PLCOM2012_COHORT_AGE,
  PLCOM2012_DEFAULT_THRESHOLD,
} from "./plcom2012Schema";

/** Schema with safeParse for use in registry. */
type SchemaWithParse<T> = { safeParse: (v: unknown) => { success: true; data: T } | { success: false; error: unknown } };

const plcom2012Model: EligibilityModel<Plcom2012Input, SchemaWithParse<Plcom2012Input>> = {
  id: "plcom2012",
  label: "PLCOm2012",
  inputSchema: plcom2012InputSchema as SchemaWithParse<Plcom2012Input>,
  compute: computePlcom2012,
  defaultThreshold: PLCOM2012_DEFAULT_THRESHOLD,
  citation:
    "Tammemägi et al. NEJM 2013. Selection Criteria for Lung-Cancer Screening. Umbral 1,51%: Tammemägi et al. PLoS Med 2014;11:e1001764.",
  version: "2012",
};

export const eligibilityModels: EligibilityModel[] = [plcom2012Model] as EligibilityModel[];

export function getEligibilityModel(modelId: string): EligibilityModel | undefined {
  return eligibilityModels.find((m) => m.id === modelId);
}

/**
 * Runs the eligibility model and returns probability, eligibility vs threshold, and threshold used.
 */
export function computeEligibility(
  modelId: string,
  input: unknown,
  thresholdOverride?: number
): EligibilityResult | null {
  const model = getEligibilityModel(modelId);
  if (!model) return null;
  // Thresholds are fractions 0–1 (0.0151 = 1.51%), not percentages.
  if (
    thresholdOverride !== undefined &&
    (!Number.isFinite(thresholdOverride) || thresholdOverride < 0 || thresholdOverride > 1)
  ) {
    return null;
  }
  const parsed = (model.inputSchema as SchemaWithParse<Plcom2012Input>).safeParse(input);
  if (!parsed.success || !("data" in parsed)) return null;
  const probability = (model.compute as (i: Plcom2012Input) => number)(parsed.data);
  if (Number.isNaN(probability)) return null;
  const thresholdUsed = thresholdOverride ?? model.defaultThreshold;
  const { age } = parsed.data;
  const warnings =
    age < PLCOM2012_COHORT_AGE.min || age > PLCOM2012_COHORT_AGE.max
      ? [
          `Extrapolación: PLCOm2012 se desarrolló y validó con personas de ${PLCOM2012_COHORT_AGE.min}–${PLCOM2012_COHORT_AGE.max} años; fuera de ese rango el riesgo es menos fiable.`,
        ]
      : [];
  return {
    probability,
    eligible: probability >= thresholdUsed,
    thresholdUsed,
    warnings,
  };
}
