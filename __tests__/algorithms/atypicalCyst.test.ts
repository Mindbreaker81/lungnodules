import { classifyAtypicalCyst, resolveAtypicalCystCategory } from '@lib/algorithms';

describe('Atypical cyst classification', () => {
  test('thick-walled only -> 4A', () => {
    expect(
      classifyAtypicalCyst({
        atypicalCystThickWalled: true,
      }),
    ).toEqual({
      category: '4A',
      rationale: expect.stringContaining('pared gruesa'),
    });
  });

  test('multilocular without growth -> 4A', () => {
    expect(classifyAtypicalCyst({ atypicalCystMultilocular: true })?.category).toBe('4A');
  });

  test('multilocular with increased loculation -> 4B', () => {
    expect(
      classifyAtypicalCyst({
        atypicalCystMultilocular: true,
        atypicalCystIncreasedLoculationOrDensity: true,
      })?.category,
    ).toBe('4B');
  });

  test('thick-walled with cyst growth -> 4B', () => {
    expect(
      classifyAtypicalCyst({
        atypicalCystThickWalled: true,
        atypicalCystWallOrCystGrowing: true,
      })?.category,
    ).toBe('4B');
  });

  test('previously stable with growing cystic component -> 3', () => {
    expect(
      classifyAtypicalCyst({
        atypicalCystPreviouslyStable: true,
        atypicalCystGrowingCysticComponent: true,
      })?.category,
    ).toBe('3');
  });

  test('manual override takes precedence over auto 4A', () => {
    expect(
      resolveAtypicalCystCategory({
        atypicalCystManualOverride: true,
        atypicalCystCategory: 'category3',
        atypicalCystThickWalled: true,
      }),
    ).toEqual({
      category: '3',
      rationale: expect.stringContaining('override manual'),
      source: 'manual',
    });
  });
});
