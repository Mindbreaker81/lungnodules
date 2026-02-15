import type { EligibilityModel, EligibilityResult, Plcom2012Input } from "./types";
import { computePlcom2012 } from "./plcom2012";
import { plcom2012InputSchema, PLCOM2012_DEFAULT_THRESHOLD } from "./plcom2012Schema";

/** Schema with safeParse for use in registry. */
type SchemaWithParse<T> = { safeParse: (v: unknown) => { success: true; data: T } | { success: false; error: unknown } };

const plcom2012Model: EligibilityModel<Plcom2012Input, SchemaWithParse<Plcom2012Input>> = {
  id: "plcom2012",
  label: "PLCOm2012",
  inputSchema: plcom2012InputSchema as SchemaWithParse<Plcom2012Input>,
  compute: computePlcom2012,
  defaultThreshold: PLCOM2012_DEFAULT_THRESHOLD,
  citation: "Tammemägi et al. NEJM 2013. Selection Criteria for Lung-Cancer Screening.",
  version: "2012",
};

export const eligibilityModels: EligibilityModel[] = [plcom2012Model];

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
  const parsed = (model.inputSchema as SchemaWithParse<Plcom2012Input>).safeParse(input);
  if (!parsed.success || !("data" in parsed)) return null;
  const probability = (model.compute as (i: Plcom2012Input) => number)(parsed.data);
  if (Number.isNaN(probability)) return null;
  const thresholdUsed = thresholdOverride ?? model.defaultThreshold;
  return {
    probability,
    eligible: probability >= thresholdUsed,
    thresholdUsed,
  };
}
