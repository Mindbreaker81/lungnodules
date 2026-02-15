/**
 * PLCOm2012 risk prediction model for 6-year lung cancer probability.
 * Coefficients and formula from NEJM 2013 (Tammemägi et al.), Table 2.
 * Reference: research/plcom2012_research.md, research/plcom2012.R (resplab/PLCOm2012).
 *
 * @see https://www.nejm.org/doi/full/10.1056/NEJMoa1211776
 */

import type { Plcom2012Input, Plcom2012Race } from "./types";

const AGE_CENTER = 62;
const EDUCATION_CENTER = 4;
const BMI_CENTER = 27;
const DURATION_SMOKING_CENTER = 27;
const SMOKING_QUIT_TIME_CENTER = 10;
const INTENSITY_CENTER = 0.4021541613;

const COEF_AGE = 0.0778868;
const COEF_EDUCATION = -0.0812744;
const COEF_BMI = -0.0274194;
const COEF_COPD = 0.3553063;
const COEF_CANCER_HIST = 0.4589971;
const COEF_FAMILY_HIST = 0.587185;
const COEF_SMOKING_STATUS = 0.2597431;
const COEF_INTENSITY = -1.822606;
const COEF_DURATION_SMOKING = 0.0317321;
const COEF_QUIT_TIME = -0.0308572;
const INTERCEPT = -4.532506;

const RACE_OFFSET: Record<Plcom2012Race, number> = {
  white: 0,
  american_indian_alaskan_native: 0,
  black: 0.3944778,
  hispanic: -0.7434744,
  asian: -0.466585,
  native_hawaiian_pacific_islander: 1.027152,
};

/**
 * Computes the linear predictor for PLCOm2012. smoking_intensity must be > 0.
 */
function linearPredictor(input: Plcom2012Input): number {
  const intensityTerm =
    Math.pow(input.smoking_intensity / 10, -1) - INTENSITY_CENTER;

  let lp =
    COEF_AGE * (input.age - AGE_CENTER) +
    COEF_EDUCATION * (input.education - EDUCATION_CENTER) +
    COEF_BMI * (input.bmi - BMI_CENTER) +
    COEF_COPD * (input.copd ? 1 : 0) +
    COEF_CANCER_HIST * (input.cancer_hist ? 1 : 0) +
    COEF_FAMILY_HIST * (input.family_hist_lung_cancer ? 1 : 0) +
    COEF_SMOKING_STATUS * (input.smoking_status === "current" ? 1 : 0) +
    COEF_INTENSITY * intensityTerm +
    COEF_DURATION_SMOKING * (input.duration_smoking - DURATION_SMOKING_CENTER) +
    COEF_QUIT_TIME * (input.smoking_quit_time - SMOKING_QUIT_TIME_CENTER) +
    INTERCEPT;

  lp += RACE_OFFSET[input.race];
  return lp;
}

/**
 * Computes 6-year lung cancer probability (0–1) using PLCOm2012.
 * For ever-smokers only. smoking_intensity must be > 0 (use historical cigs/day for former smokers).
 *
 * @param input - Validated PLCOm2012 inputs
 * @returns Probability in [0, 1], or NaN if smoking_intensity <= 0
 */
export function computePlcom2012(input: Plcom2012Input): number {
  if (input.smoking_intensity <= 0) {
    return NaN;
  }
  const lp = linearPredictor(input);
  return Math.exp(lp) / (1 + Math.exp(lp));
}
