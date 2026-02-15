/**
 * Screening eligibility module.
 * Provides 6-year lung cancer risk scores for eligibility (e.g. PLCOm2012).
 * Kept separate from nodule management algorithms (Fleischner / Lung-RADS).
 */

export type {
  Plcom2012Race,
  Plcom2012Education,
  Plcom2012SmokingStatus,
  Plcom2012Input,
  EligibilityResult,
  EligibilityInput,
  EligibilityModel,
} from "./types";

export { computePlcom2012 } from "./plcom2012";

export {
  plcom2012InputSchema,
  plcom2012RaceSchema,
  plcom2012EducationSchema,
  plcom2012SmokingStatusSchema,
  PLCOM2012_DEFAULT_THRESHOLD,
} from "./plcom2012Schema";
export type { Plcom2012InputSchemaType } from "./plcom2012Schema";

export {
  eligibilityModels,
  computeEligibility,
  getEligibilityModel,
} from "./registry";
