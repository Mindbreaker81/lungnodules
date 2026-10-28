import { computeEligibility, plcom2012InputSchema } from "@lib/eligibility";
import type { Plcom2012Input } from "@lib/eligibility";

const reference: Plcom2012Input = {
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

describe("PLCOm2012 input domain (LUN-21, LUN-22, LUN-24)", () => {
  test("rejects a smoking history longer than the patient's life", () => {
    const result = plcom2012InputSchema.safeParse({
      ...reference,
      age: 40,
      duration_smoking: 70,
      smoking_quit_time: 60,
    });
    expect(result.success).toBe(false);
    expect(computeEligibility("plcom2012", { ...reference, age: 40, duration_smoking: 70, smoking_quit_time: 60 })).toBeNull();
  });

  test("rejects a current smoker who smoked longer than their age", () => {
    const result = plcom2012InputSchema.safeParse({
      ...reference,
      age: 45,
      smoking_status: "current",
      duration_smoking: 50,
      smoking_quit_time: 0,
    });
    expect(result.success).toBe(false);
  });

  test("accepts a consistent history", () => {
    expect(plcom2012InputSchema.safeParse(reference).success).toBe(true);
  });

  test("no warning inside the 55–74 development cohort", () => {
    const result = computeEligibility("plcom2012", reference);
    expect(result?.warnings).toEqual([]);
    expect(result?.thresholdUsed).toBe(0.0151);
  });

  test.each([45, 80])("warns about extrapolation at age %i", (age) => {
    const result = computeEligibility("plcom2012", { ...reference, age });
    expect(result).not.toBeNull();
    expect(result?.warnings.some((w) => w.includes("55–74"))).toBe(true);
  });

  test.each([-1, 2, Number.NaN, Number.POSITIVE_INFINITY])(
    "rejects invalid threshold override %p",
    (threshold) => {
      expect(computeEligibility("plcom2012", reference, threshold)).toBeNull();
    },
  );

  test("accepts a threshold override expressed as a fraction", () => {
    const result = computeEligibility("plcom2012", reference, 0.02);
    expect(result?.thresholdUsed).toBe(0.02);
    expect(result?.eligible).toBe(false);
  });
});
