import { assessmentInputSchema, lungRadsInputSchema } from '@lib/schemas/noduleInput';

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

describe('assessmentInputSchema — noduleCount', () => {
  const multiple = (noduleCount: number) => ({
    clinicalContext: 'screening' as const,
    patient: { clinicalContext: 'screening' as const },
    nodule: { type: 'solid' as const, diameterMm: 8, isMultiple: true, noduleCount, scanType: 'baseline' as const },
  });

  test('rejects a fractional nodule count', () => {
    const result = assessmentInputSchema.safeParse(multiple(1.5));
    expect(result.success).toBe(false);
  });

  test('accepts an integer nodule count', () => {
    expect(assessmentInputSchema.safeParse(multiple(3)).success).toBe(true);
  });
});

describe('assessmentInputSchema — patient age', () => {
  const withAge = (age: number) => ({
    clinicalContext: 'screening' as const,
    patient: { clinicalContext: 'screening' as const, age },
    nodule: { type: 'solid' as const, diameterMm: 8, isMultiple: false, scanType: 'baseline' as const },
  });

  test('rejects implausible ages above 110', () => {
    expect(assessmentInputSchema.safeParse(withAge(120)).success).toBe(false);
  });

  test('accepts 110', () => {
    expect(assessmentInputSchema.safeParse(withAge(110)).success).toBe(true);
  });
});

describe('assessmentInputSchema — prior measurements on follow-up', () => {
  const followUp = (nodule: Record<string, unknown>) => ({
    clinicalContext: 'screening' as const,
    patient: { clinicalContext: 'screening' as const },
    nodule: { type: 'solid' as const, diameterMm: 8, isMultiple: false, scanType: 'follow-up' as const, ...nodule },
  });

  test('rejects existing follow-up nodule without prior diameter and interval', () => {
    const result = assessmentInputSchema.safeParse(followUp({ isNew: false }));
    expect(result.success).toBe(false);
  });

  test('accepts a new follow-up nodule without prior diameter or interval', () => {
    const result = assessmentInputSchema.safeParse(followUp({ isNew: true }));
    expect(result.success).toBe(true);
  });

  test('accepts existing follow-up nodule with prior diameter and interval', () => {
    const result = assessmentInputSchema.safeParse(
      followUp({ isNew: false, priorDiameterMm: 6, priorScanMonthsAgo: 12 }),
    );
    expect(result.success).toBe(true);
  });

  test('rejects prior solid component greater than prior diameter', () => {
    const result = assessmentInputSchema.safeParse(
      followUp({ priorDiameterMm: 6, priorSolidComponentMm: 8, priorScanMonthsAgo: 12 }),
    );
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(
        result.error.issues.some((issue) => issue.path.join('.') === 'nodule.priorSolidComponentMm'),
      ).toBe(true);
    }
  });
});

describe('assessmentInputSchema — juxtapleural morphology', () => {
  const juxtapleural = (nodule: Record<string, unknown>) => ({
    clinicalContext: 'screening' as const,
    patient: { clinicalContext: 'screening' as const },
    nodule: {
      type: 'solid' as const,
      diameterMm: 8,
      isMultiple: false,
      scanType: 'baseline' as const,
      isJuxtapleural: true,
      ...nodule,
    },
  });

  test('rejects juxtapleural nodule without shape in screening', () => {
    const result = assessmentInputSchema.safeParse(juxtapleural({}));
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(
        result.error.issues.some((issue) => issue.path.join('.') === 'nodule.juxtapleuralShape'),
      ).toBe(true);
    }
  });

  test('accepts juxtapleural nodule with a defined shape', () => {
    expect(
      assessmentInputSchema.safeParse(juxtapleural({ juxtapleuralShape: 'triangular' })).success,
    ).toBe(true);
    expect(
      assessmentInputSchema.safeParse(juxtapleural({ juxtapleuralShape: 'other' })).success,
    ).toBe(true);
  });
});

describe('screening refinements shared by lungRadsInputSchema and assessmentInputSchema', () => {
  const schemas = [
    ['lungRadsInputSchema', (nodule: Record<string, unknown>) =>
      lungRadsInputSchema.safeParse({
        patient: { clinicalContext: 'screening' },
        nodule,
      })],
    ['assessmentInputSchema', (nodule: Record<string, unknown>) =>
      assessmentInputSchema.safeParse({
        clinicalContext: 'screening',
        patient: { clinicalContext: 'screening' },
        nodule,
      })],
  ] as const;

  const followUpNodule = (extra: Record<string, unknown>) => ({
    type: 'part-solid',
    diameterMm: 10,
    solidComponentMm: 4,
    isMultiple: false,
    scanType: 'follow-up',
    priorDiameterMm: 8,
    priorScanMonthsAgo: 12,
    ...extra,
  });

  test.each(schemas)('%s rejects prior solid component greater than prior diameter', (_name, parse) => {
    const result = parse(followUpNodule({ priorSolidComponentMm: 9 }));
    expect(result.success).toBe(false);
  });

  test.each(schemas)('%s rejects juxtapleural nodule without shape', (_name, parse) => {
    const result = parse({
      type: 'solid',
      diameterMm: 8,
      isMultiple: false,
      scanType: 'baseline',
      isJuxtapleural: true,
    });
    expect(result.success).toBe(false);
  });

  test.each(schemas)('%s rejects inflammatory airway nodule without category choice', (_name, parse) => {
    const result = parse({
      type: 'solid',
      diameterMm: 8,
      isMultiple: false,
      scanType: 'baseline',
      isAirway: true,
      airwayLocation: 'subsegmental',
      airwayInflammatoryOrInfectious: true,
    });
    expect(result.success).toBe(false);
  });

  test.each(schemas)('%s accepts a valid screening nodule', (_name, parse) => {
    const result = parse(followUpNodule({ priorSolidComponentMm: 2 }));
    expect(result.success).toBe(true);
  });
});

describe('assessmentInputSchema — airway inflammatory category', () => {
  const airway = (nodule: Record<string, unknown>) => ({
    clinicalContext: 'screening' as const,
    patient: { clinicalContext: 'screening' as const },
    nodule: {
      type: 'solid' as const,
      diameterMm: 8,
      isMultiple: false,
      scanType: 'baseline' as const,
      isAirway: true,
      airwayLocation: 'subsegmental' as const,
      ...nodule,
    },
  });

  test('rejects inflammatory airway nodule without category choice', () => {
    const result = assessmentInputSchema.safeParse(airway({ airwayInflammatoryOrInfectious: true }));
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(
        result.error.issues.some((issue) => issue.path.join('.') === 'nodule.airwayInflammatoryCategory'),
      ).toBe(true);
    }
  });

  test('accepts inflammatory airway nodule with category 0 or 2', () => {
    expect(
      assessmentInputSchema.safeParse(
        airway({ airwayInflammatoryOrInfectious: true, airwayInflammatoryCategory: 'category0' }),
      ).success,
    ).toBe(true);
    expect(
      assessmentInputSchema.safeParse(
        airway({ airwayInflammatoryOrInfectious: true, airwayInflammatoryCategory: 'category2' }),
      ).success,
    ).toBe(true);
  });
});
