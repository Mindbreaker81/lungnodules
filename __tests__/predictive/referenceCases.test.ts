import { computePlcom2012 } from '@lib/eligibility';
import type { Plcom2012Input } from '@lib/eligibility';
import { getPredictiveSummaries } from '@lib/predictive';
import { AssessmentInput } from '@lib/schemas/noduleInput';
import swensenTable3 from './fixtures/swensen-table3.json';

// Reference implementations written from the primary sources, independent of
// lib/predictive and lib/eligibility (recálculo independiente 2026-10-27, LUN-38).
const logistic = (x: number) => 1 / (1 + Math.exp(-x));

// Swensen 1997, p.852, equations (1)–(2).
const refMayo = (p: {
  age: number; smoker: boolean; cancer: boolean; diameterMm: number; spiculation: boolean; upper: boolean;
}) =>
  logistic(-6.8272 + 0.0391 * p.age + 0.7917 * +p.smoker + 1.3388 * +p.cancer
    + 0.1274 * p.diameterMm + 1.0407 * +p.spiculation + 0.7838 * +p.upper);

// McWilliams 2013, Table 2 (full models 2a/2b) and footnote transform.
const refBrock = (p: {
  age: number; female: boolean; family: boolean; emphysema: boolean; sizeMm: number;
  type: 'solid' | 'part-solid' | 'ground-glass'; upper: boolean; count: number; spiculation?: boolean;
}) => {
  const t = Math.pow(p.sizeMm / 10, -0.5) - 1.58113883;
  const gg = p.type === 'ground-glass' ? 1 : 0;
  const ps = p.type === 'part-solid' ? 1 : 0;
  if (p.spiculation === undefined) {
    return logistic(-6.8071 + 0.0321 * (p.age - 62) + 0.5635 * +p.female + 0.3013 * +p.family
      + 0.3462 * +p.emphysema - 5.6693 * t - 0.3005 * gg + 0.3395 * ps + 0.7116 * +p.upper
      - 0.0803 * (p.count - 4));
  }
  return logistic(-6.7892 + 0.0287 * (p.age - 62) + 0.6011 * +p.female + 0.2961 * +p.family
    + 0.2953 * +p.emphysema - 5.3854 * t - 0.1276 * gg + 0.377 * ps + 0.6581 * +p.upper
    - 0.0824 * (p.count - 4) + 0.7729 * +p.spiculation);
};

// Herder 2005, p.2492; P_Mayo as a 0–1 fraction (Figure 3 scale).
const HERDER_FDG = { absent: 0, faint: 2.322, moderate: 4.617, intense: 4.771 } as const;
const refHerder = (pMayo: number, fdg: keyof typeof HERDER_FDG) =>
  logistic(-4.739 + 3.691 * pMayo + HERDER_FDG[fdg]);

// Tammemägi 2013, Table 2 and footnotes (p.731).
const RACE = {
  white: 0, black: 0.3944778, hispanic: -0.7434744, asian: -0.466585,
  american_indian_alaskan_native: 0, native_hawaiian_pacific_islander: 1.027152,
} as const;
const refPlco = (p: Plcom2012Input) =>
  logistic(-4.532506 + 0.0778868 * (p.age - 62) + RACE[p.race as keyof typeof RACE]
    - 0.0812744 * (p.education - 4) - 0.0274194 * (p.bmi - 27) + 0.3553063 * +p.copd
    + 0.4589971 * +p.cancer_hist + 0.587185 * +p.family_hist_lung_cancer
    + 0.2597431 * +(p.smoking_status === 'current')
    - 1.822606 * (Math.pow(p.smoking_intensity / 10, -1) - 0.4021541613)
    + 0.0317321 * (p.duration_smoking - 27) - 0.0308572 * (p.smoking_quit_time - 10));

const buildInput = (c: {
  context: 'incidental' | 'screening'; age: number; female?: boolean; smoker: boolean; cancer: boolean;
  family?: boolean; emphysema?: boolean; diameterMm: number; maxDiameterMm?: number;
  type?: 'solid' | 'part-solid' | 'ground-glass'; spiculation?: boolean; upper: boolean; count?: number;
  fdg?: keyof typeof HERDER_FDG;
}): AssessmentInput => ({
  clinicalContext: c.context,
  patient: {
    clinicalContext: c.context,
    age: c.age,
    riskLevel: 'low',
    hasKnownMalignancy: false,
    isImmunocompromised: false,
    sex: c.female ? 'female' : 'male',
    smokingStatus: c.smoker ? 'current' : 'never',
    extrathoracicCancerHistory: c.cancer ? 'over5y' : 'none',
    hasFamilyHistoryLungCancer: c.family ?? false,
    hasEmphysema: c.emphysema ?? false,
  },
  nodule: {
    type: c.type ?? 'solid',
    diameterMm: c.diameterMm,
    maxDiameterMm: c.maxDiameterMm,
    solidComponentMm: c.type === 'part-solid' ? 2 : undefined,
    isMultiple: (c.count ?? 1) > 1,
    noduleCount: c.count,
    hasSpiculation: c.spiculation,
    isUpperLobe: c.upper,
    hasPet: c.fdg !== undefined,
    petUptake: c.fdg,
  },
} as AssessmentInput);

const summaryOf = (input: AssessmentInput, id: 'mayo' | 'brock' | 'herder') =>
  getPredictiveSummaries(input).find((s) => s.id === id)!;

describe('Published reference cases', () => {
  test('Mayo reproduces all 144 cells of Swensen 1997 Table 3 (rounded to 2 decimals)', () => {
    expect(swensenTable3.rows).toHaveLength(144);
    for (const row of swensenTable3.rows) {
      const summary = summaryOf(
        buildInput({
          context: 'incidental', age: row.age, smoker: row.smoker, cancer: row.extrathoracicCancer,
          diameterMm: row.diameterMm, spiculation: row.spiculation, upper: row.upperLobe,
        }),
        'mayo',
      );
      expect(summary.status).toBe('available');
      // Max observed table-vs-equation gap is ~0.0055 (table rounding / internal inconsistency).
      expect(Math.abs((summary.probability as number) - row.published)).toBeLessThan(0.006);
    }
  });

  test('PLCOm2012 matches Tammemägi 2013 Figure 1 profile (80 cig/day ≈ 1.75%)', () => {
    const p = computePlcom2012({
      age: 62, race: 'white', education: 4, bmi: 27, copd: false, cancer_hist: false,
      family_hist_lung_cancer: false, smoking_status: 'former', smoking_intensity: 80,
      duration_smoking: 27, smoking_quit_time: 10,
    });
    expect(p).toBeCloseTo(0.0175092234, 9);
  });
});

describe('Cross-check against independent reference implementation', () => {
  const ages = [35, 50, 62, 75, 85];
  const diameters = [4, 8, 15, 30];
  const types = ['solid', 'part-solid', 'ground-glass'] as const;
  const spiculations = [undefined, false, true];
  const fdgs = ['absent', 'faint', 'moderate', 'intense'] as const;

  test('Mayo and Herder (incidental) match the reference', () => {
    let compared = 0;
    for (const age of ages) for (const diameterMm of diameters) for (const smoker of [false, true])
      for (const cancer of [false, true]) for (const spiculation of [false, true])
        for (const upper of [false, true]) for (const fdg of fdgs) {
          const input = buildInput({ context: 'incidental', age, smoker, cancer, diameterMm, spiculation, upper, fdg });
          const pMayo = refMayo({ age, smoker, cancer, diameterMm, spiculation, upper });
          expect(summaryOf(input, 'mayo').probability).toBeCloseTo(pMayo, 12);
          expect(summaryOf(input, 'herder').probability).toBeCloseTo(refHerder(pMayo, fdg), 12);
          compared++;
        }
    expect(compared).toBe(1280);
  });

  test('Brock 2a/2b (screening) match the reference, with and without max diameter', () => {
    let compared = 0;
    for (const age of ages) for (const diameterMm of diameters) for (const type of types)
      for (const spiculation of spiculations) for (const female of [false, true])
        for (const count of [1, 3]) for (const extra of [undefined, 2]) {
          const maxDiameterMm = extra === undefined ? undefined : Math.min(30, diameterMm + extra);
          const input = buildInput({
            context: 'screening', age, female, smoker: true, cancer: false, family: female, emphysema: !female,
            diameterMm, maxDiameterMm, type, spiculation, upper: count === 1, count,
          });
          const expected = refBrock({
            age, female, family: female, emphysema: !female, sizeMm: maxDiameterMm ?? diameterMm,
            type, upper: count === 1, count, spiculation,
          });
          expect(summaryOf(input, 'brock').probability).toBeCloseTo(expected, 12);
          compared++;
        }
    expect(compared).toBe(1440);
  });

  test('PLCOm2012 matches the reference', () => {
    let compared = 0;
    for (const age of [55, 62, 74]) for (const race of Object.keys(RACE)) for (const education of [1, 4, 6])
      for (const copd of [false, true]) for (const status of ['former', 'current'] as const)
        for (const intensity of [5, 20, 80]) {
          const input: Plcom2012Input = {
            age, race: race as Plcom2012Input['race'], education: education as Plcom2012Input['education'], bmi: 24, copd, cancer_hist: copd,
            family_hist_lung_cancer: !copd, smoking_status: status, smoking_intensity: intensity,
            duration_smoking: 30, smoking_quit_time: status === 'current' ? 0 : 8,
          };
          expect(computePlcom2012(input)).toBeCloseTo(refPlco(input), 12);
          compared++;
        }
    expect(compared).toBe(648);
  });
});
