import { NoduleCharacteristics } from './types';

export type AtypicalCystCategory = '3' | '4A' | '4B';

export type AtypicalCystMorphologyInput = Pick<
  NoduleCharacteristics,
  | 'atypicalCystThickWalled'
  | 'atypicalCystMultilocular'
  | 'atypicalCystPreviouslyStable'
  | 'atypicalCystGrowingCysticComponent'
  | 'atypicalCystWallOrCystGrowing'
  | 'atypicalCystIncreasedLoculationOrDensity'
  | 'atypicalCystManualOverride'
  | 'atypicalCystCategory'
>;

const MANUAL_CATEGORY_MAP = {
  category3: '3',
  category4A: '4A',
  category4B: '4B',
} as const satisfies Record<
  NonNullable<NoduleCharacteristics['atypicalCystCategory']>,
  AtypicalCystCategory
>;

const MANUAL_RATIONALE: Record<AtypicalCystCategory, string> = {
  '3': 'Quiste atípico con componente quístico en crecimiento (override manual)',
  '4A': 'Quiste atípico con pared gruesa o multiloculado (override manual)',
  '4B': 'Quiste atípico con crecimiento o nodularidad (override manual)',
};

const AUTO_RATIONALE: Record<AtypicalCystCategory, string> = {
  '3': 'Quiste atípico previamente estable con componente quístico en crecimiento',
  '4A': 'Quiste atípico con pared gruesa (≥2 mm) o multilocular',
  '4B': 'Quiste atípico con crecimiento de pared/multilocular o aumento de loculación/densidad',
};

export function hasAtypicalCystMorphologyDescriptor(
  nodule: Pick<
    NoduleCharacteristics,
    | 'atypicalCystThickWalled'
    | 'atypicalCystMultilocular'
    | 'atypicalCystPreviouslyStable'
    | 'atypicalCystGrowingCysticComponent'
    | 'atypicalCystWallOrCystGrowing'
    | 'atypicalCystIncreasedLoculationOrDensity'
    | 'atypicalCystUnilocularThinWalled'
    | 'atypicalCystSolidDominant'
  >,
): boolean {
  return (
    Boolean(nodule.atypicalCystUnilocularThinWalled) ||
    Boolean(nodule.atypicalCystSolidDominant) ||
    Boolean(nodule.atypicalCystThickWalled) ||
    Boolean(nodule.atypicalCystMultilocular) ||
    Boolean(nodule.atypicalCystPreviouslyStable) ||
    Boolean(nodule.atypicalCystGrowingCysticComponent) ||
    Boolean(nodule.atypicalCystWallOrCystGrowing) ||
    Boolean(nodule.atypicalCystIncreasedLoculationOrDensity)
  );
}

export function lungRadsCategoryRank(category: string): number {
  const base = category.endsWith('S') && category.length > 1 ? category.slice(0, -1) : category;
  switch (base) {
    case '0':
      return 0;
    case '1':
      return 1;
    case '2':
      return 2;
    case '3':
      return 3;
    case '4A':
      return 4;
    case '4B':
      return 5;
    case '4X':
      return 6;
    default:
      return -1;
  }
}

export function higherLungRadsCategory(categoryA: string, categoryB: string): string {
  return lungRadsCategoryRank(categoryA) >= lungRadsCategoryRank(categoryB) ? categoryA : categoryB;
}

export function classifyAtypicalCyst(
  nodule: AtypicalCystMorphologyInput,
): { category: AtypicalCystCategory; rationale: string } | null {
  const thickWalled = Boolean(nodule.atypicalCystThickWalled);
  const multilocular = Boolean(nodule.atypicalCystMultilocular);
  const previouslyStable = Boolean(nodule.atypicalCystPreviouslyStable);
  const growingCysticComponent = Boolean(nodule.atypicalCystGrowingCysticComponent);
  const wallOrCystGrowing = Boolean(nodule.atypicalCystWallOrCystGrowing);
  const increasedLoculationOrDensity = Boolean(nodule.atypicalCystIncreasedLoculationOrDensity);

  const is4B =
    ((thickWalled || multilocular) && wallOrCystGrowing) ||
    (multilocular && increasedLoculationOrDensity);
  if (is4B) {
    return { category: '4B', rationale: AUTO_RATIONALE['4B'] };
  }

  if (thickWalled || multilocular) {
    return { category: '4A', rationale: AUTO_RATIONALE['4A'] };
  }

  if (previouslyStable && thickWalled && growingCysticComponent) {
    return { category: '3', rationale: AUTO_RATIONALE['3'] };
  }

  if (previouslyStable && growingCysticComponent) {
    return { category: '3', rationale: AUTO_RATIONALE['3'] };
  }

  return null;
}

export function resolveAtypicalCystCategory(
  nodule: AtypicalCystMorphologyInput,
): { category: AtypicalCystCategory; rationale: string; source: 'manual' | 'auto' } | null {
  if (nodule.atypicalCystManualOverride && nodule.atypicalCystCategory) {
    const category = MANUAL_CATEGORY_MAP[nodule.atypicalCystCategory];
    return { category, rationale: MANUAL_RATIONALE[category], source: 'manual' };
  }

  const auto = classifyAtypicalCyst(nodule);
  if (!auto) {
    return null;
  }

  return { ...auto, source: 'auto' };
}

export function previewAtypicalCystCategory(
  nodule: AtypicalCystMorphologyInput,
): { category: AtypicalCystCategory; source: 'manual' | 'auto' } | null {
  const resolved = resolveAtypicalCystCategory(nodule);
  if (!resolved) {
    return null;
  }

  return { category: resolved.category, source: resolved.source };
}
