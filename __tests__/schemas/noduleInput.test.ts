import { assessmentInputSchema } from '@lib/schemas/noduleInput';

describe('assessmentInputSchema — maxDiameterMm', () => {
  const baseScreening = {
    clinicalContext: 'screening' as const,
    patient: { clinicalContext: 'screening' as const },
    nodule: {
      type: 'solid' as const,
      diameterMm: 15,
      isMultiple: false,
      scanType: 'baseline' as const,
    },
  };

  test('rejects maxDiameterMm smaller than diameterMm', () => {
    const result = assessmentInputSchema.safeParse({
      ...baseScreening,
      nodule: { ...baseScreening.nodule, maxDiameterMm: 10 },
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(
        result.error.issues.some(
          (issue) => issue.path.join('.') === 'nodule.maxDiameterMm',
        ),
      ).toBe(true);
    }
  });

  test('accepts maxDiameterMm greater than or equal to diameterMm', () => {
    const equal = assessmentInputSchema.safeParse({
      ...baseScreening,
      nodule: { ...baseScreening.nodule, maxDiameterMm: 15 },
    });
    const larger = assessmentInputSchema.safeParse({
      ...baseScreening,
      nodule: { ...baseScreening.nodule, maxDiameterMm: 20 },
    });

    expect(equal.success).toBe(true);
    expect(larger.success).toBe(true);
  });

  test('accepts omitted maxDiameterMm', () => {
    const result = assessmentInputSchema.safeParse(baseScreening);
    expect(result.success).toBe(true);
  });

  test('rejects maxDiameterMm outside 1-100 mm', () => {
    const tooSmall = assessmentInputSchema.safeParse({
      ...baseScreening,
      nodule: { ...baseScreening.nodule, maxDiameterMm: 0 },
    });
    const tooLarge = assessmentInputSchema.safeParse({
      ...baseScreening,
      nodule: { ...baseScreening.nodule, maxDiameterMm: 101 },
    });

    expect(tooSmall.success).toBe(false);
    expect(tooLarge.success).toBe(false);
  });
});
