/**
 * Types for the screening eligibility module.
 * Supports multiple eligibility models (e.g. PLCOm2012); first implementation is PLCOm2012.
 */

/** Race/ethnicity categories per PLCOm2012 (NEJM 2013, Tammemägi et al.). Reference: White / American Indian / Alaskan Native. */
export type Plcom2012Race =
  | "white"
  | "black"
  | "hispanic"
  | "asian"
  | "native_hawaiian_pacific_islander"
  | "american_indian_alaskan_native";

/** Education level 1–6 per PLCO (1 = less than high school … 6 = postgraduate). */
export type Plcom2012Education = 1 | 2 | 3 | 4 | 5 | 6;

/** Current smoker = 1, former = 0 in the model. */
export type Plcom2012SmokingStatus = "current" | "former";

export interface Plcom2012Input {
  age: number;
  race: Plcom2012Race;
  education: Plcom2012Education;
  bmi: number;
  copd: boolean;
  cancer_hist: boolean;
  family_hist_lung_cancer: boolean;
  smoking_status: Plcom2012SmokingStatus;
  /** Cigarettes per day (when smoking). Must be > 0 (ever-smokers; use historical intensity for former smokers). */
  smoking_intensity: number;
  duration_smoking: number;
  /** Years since quit; 0 if current smoker. */
  smoking_quit_time: number;
}

export interface EligibilityResult {
  probability: number;
  eligible: boolean;
  thresholdUsed: number;
}

/** Generic input for any eligibility model (union or discriminated by model id). */
export type EligibilityInput = { modelId: "plcom2012"; input: Plcom2012Input };

/** Descriptor for an eligibility model so we can add/change scores without changing the flow. */
export interface EligibilityModel<
  TInput = unknown,
  TSchema = unknown
> {
  id: string;
  label: string;
  inputSchema: TSchema;
  compute: (input: TInput) => number;
  defaultThreshold: number;
  citation?: string;
  version?: string;
}
