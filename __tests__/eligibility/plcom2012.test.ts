import { computePlcom2012 } from "@lib/eligibility";
import type { Plcom2012Input } from "@lib/eligibility";

describe("PLCOm2012", () => {
  /**
   * Example from resplab/PLCOm2012 R package and research/plcom2012.R:
   * age=62, race='White', education=4, bmi=27, copd=0, cancer_hist=0,
   * family_hist_lung_cancer=0, smoking_status=0 (former), smoking_intensity=80,
   * duration_smoking=27, smoking_quit_time=10 → ~1.7509%
   */
  test("reference example returns probability ~1.75%", () => {
    const input: Plcom2012Input = {
      age: 62,
      race: "white",
      education: 4,
      bmi: 27,
      copd: false,
      cancer_hist: false,
      family_hist_lung_cancer: false,
      smoking_status: "former",
      smoking_intensity: 80,
      duration_smoking: 27,
      smoking_quit_time: 10,
    };
    const p = computePlcom2012(input);
    expect(p).toBeCloseTo(0.017509, 4);
    expect(p).toBeGreaterThanOrEqual(0.017);
    expect(p).toBeLessThanOrEqual(0.018);
  });

  test("smoking_intensity 0 returns NaN", () => {
    const input: Plcom2012Input = {
      age: 62,
      race: "white",
      education: 4,
      bmi: 27,
      copd: false,
      cancer_hist: false,
      family_hist_lung_cancer: false,
      smoking_status: "former",
      smoking_intensity: 0,
      duration_smoking: 27,
      smoking_quit_time: 10,
    };
    const p = computePlcom2012(input);
    expect(Number.isNaN(p)).toBe(true);
  });

  test("race offsets: black increases risk vs white", () => {
    const base: Plcom2012Input = {
      age: 62,
      race: "white",
      education: 4,
      bmi: 27,
      copd: false,
      cancer_hist: false,
      family_hist_lung_cancer: false,
      smoking_status: "former",
      smoking_intensity: 20,
      duration_smoking: 27,
      smoking_quit_time: 10,
    };
    const pWhite = computePlcom2012(base);
    const pBlack = computePlcom2012({ ...base, race: "black" });
    expect(pBlack).toBeGreaterThan(pWhite);
  });

  test("american_indian_alaskan_native uses reference (same as white)", () => {
    const base: Plcom2012Input = {
      age: 62,
      race: "white",
      education: 4,
      bmi: 27,
      copd: false,
      cancer_hist: false,
      family_hist_lung_cancer: false,
      smoking_status: "former",
      smoking_intensity: 30,
      duration_smoking: 27,
      smoking_quit_time: 10,
    };
    const pWhite = computePlcom2012(base);
    const pRef = computePlcom2012({
      ...base,
      race: "american_indian_alaskan_native",
    });
    expect(pRef).toBeCloseTo(pWhite, 10);
  });

  test("probability is in [0, 1]", () => {
    const input: Plcom2012Input = {
      age: 75,
      race: "white",
      education: 1,
      bmi: 22,
      copd: true,
      cancer_hist: true,
      family_hist_lung_cancer: true,
      smoking_status: "current",
      smoking_intensity: 40,
      duration_smoking: 50,
      smoking_quit_time: 0,
    };
    const p = computePlcom2012(input);
    expect(p).toBeGreaterThanOrEqual(0);
    expect(p).toBeLessThanOrEqual(1);
  });
});
