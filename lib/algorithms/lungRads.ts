import {
  AssessmentResult,
  GuidelineId,
  LungRadsAssessmentInput,
} from './types';
import { higherLungRadsCategory, resolveAtypicalCystCategory } from './atypicalCyst';

const GUIDELINE: GuidelineId = 'lung-rads-2022';
const GROWTH_THRESHOLD_MM_PER_12M = 1.5;

const LONG_INTERVAL_THRESHOLD_MONTHS = 18;

interface GrowthResult {
  isGrowing: boolean;
  isLongInterval: boolean;
}

function calculateGrowth(currentDiameter: number, priorDiameter?: number, intervalMonths?: number): GrowthResult {
  if (priorDiameter === undefined || priorDiameter <= 0 || currentDiameter <= 0) return { isGrowing: false, isLongInterval: false };
  if (!intervalMonths || intervalMonths <= 0) return { isGrowing: false, isLongInterval: false };
  const delta = currentDiameter - priorDiameter;
  const isLongInterval = intervalMonths > LONG_INTERVAL_THRESHOLD_MONTHS;
  // Lung-RADS v2022: growth defined as absolute increase >1.5mm (not annualized)
  return { isGrowing: delta > GROWTH_THRESHOLD_MM_PER_12M, isLongInterval };
}

function classifySolidLungRADS(options: {
  diameter: number;
  scanType: 'baseline' | 'follow-up';
  isGrowing: boolean;
  isNew: boolean;
}): string {
  const { diameter, scanType, isGrowing, isNew } = options;

  // Category 2
  if (scanType === 'baseline' && diameter < 6) return '2';
  if (scanType === 'follow-up' && isNew && diameter < 4) return '2';

  // Category 3
  if (scanType === 'baseline' && diameter >= 6 && diameter < 8) return '3';
  if (scanType === 'follow-up' && isNew && diameter >= 4 && diameter < 6) return '3';

  // Category 4A
  if (scanType === 'baseline' && diameter >= 8 && diameter < 15) return '4A';
  if (isGrowing && diameter < 8) return '4A';
  if (scanType === 'follow-up' && isNew && diameter >= 6 && diameter < 8) return '4A';

  // Category 4B
  if (scanType === 'baseline' && diameter >= 15) return '4B';
  if ((isNew || isGrowing) && diameter >= 8) return '4B';

  // Follow-up existing nodules (not new, not growing) - classify by size like baseline
  if (scanType === 'follow-up' && !isNew && !isGrowing) {
    if (diameter < 6) return '2';
    if (diameter >= 6 && diameter < 8) return '3';
    if (diameter >= 8 && diameter < 15) return '4A';
    if (diameter >= 15) return '4B';
  }

  // Default conservative
  return '2';
}

function classifyGroundGlass(options: {
  diameter: number;
  scanType: 'baseline' | 'follow-up';
  isNew: boolean;
  isGrowing: boolean;
}): string {
  const { diameter, scanType, isNew, isGrowing } = options;

  if (diameter < 30) return '2';

  // GGN >=30mm: Cat 3 at baseline or if new/growing; stable follow-up handled by stepped management
  if (scanType === 'follow-up' && !isNew && !isGrowing) {
    // Stable large GGN — keep Cat 3 but stepped management will handle downgrade
    return '3';
  }
  return '3';
}

function classifyPartSolid(options: {
  diameter: number;
  solidComponent?: number;
  scanType: 'baseline' | 'follow-up';
  isNew: boolean;
  isGrowing: boolean;
}): { category: string; warnings?: string[] } {
  const { diameter, solidComponent, scanType, isNew, isGrowing } = options;

  if (diameter < 6) {
    // New part-solid <6mm in follow-up -> Cat 3 (more conservative than baseline)
    if (scanType === 'follow-up' && isNew) return { category: '3' };
    return { category: '2' };
  }
  if (solidComponent === undefined) {
    return { category: '3', warnings: ['Se requiere tamaño del componente sólido para evaluación semi-sólida'] };
  }

  // Follow-up: new or growing part-solid -> escalate
  if (scanType === 'follow-up' && (isNew || isGrowing)) {
    if (solidComponent >= 4) return { category: '4B' };
    return { category: '4A' };
  }

  // Baseline or stable follow-up: classify by solid component size
  if (solidComponent >= 8) {
    return { category: '4B' };
  }
  if (solidComponent >= 6) {
    return { category: '4A' };
  }
  return { category: '3' };
}

function applySteppedManagement(
  currentCategory: string,
  priorCategory?: string,
  priorStatus?: 'stable' | 'decreasing' | 'progression',
): string {
  if (!priorCategory || !priorStatus) return currentCategory;
  const canStepDown = priorStatus === 'stable' || priorStatus === 'decreasing';

  if (currentCategory === '3' && priorCategory === '3' && canStepDown) {
    return '2';
  }
  if (currentCategory === '4A' && priorCategory === '4A' && canStepDown) {
    return '3';
  }
  return currentCategory;
}

function buildResult(category: string, rationale: string, warnings?: string[]): AssessmentResult {
  const followUps: Record<string, { timing: string; recommendation: string; modality: string }> = {
    '0': { timing: '1-3 meses', recommendation: 'Imagen adicional o TCBD (LDCT)', modality: 'TCBD' },
    '1': { timing: '12 meses', recommendation: 'Continuar detección anual con TCBD', modality: 'TCBD' },
    '2': { timing: '12 meses', recommendation: 'Continuar detección anual con TCBD', modality: 'TCBD' },
    '3': { timing: '6 meses', recommendation: 'TCBD (LDCT)', modality: 'TCBD' },
    '4A': { timing: '3 meses', recommendation: 'TCBD; PET/CT si sólido ≥8mm', modality: 'TCBD o PET/CT' },
    '4B': { timing: 'Según indicación', recommendation: 'TC diagnóstico; PET/CT; biopsia', modality: 'TC/PET/Biopsia' },
    '4X': { timing: 'Según indicación', recommendation: 'TC diagnóstico; PET/CT; biopsia; considerar revisión multidisciplinar', modality: 'TC/PET/Biopsia/Comité' },
  };

  // For S-suffixed categories (e.g. "2S", "4AS"), look up the base category
  const baseCategory = category.endsWith('S') ? category.slice(0, -1) : category;
  const isModifierS = category.endsWith('S') && baseCategory !== '';

  const follow = followUps[baseCategory] ?? followUps[category] ?? {
    timing: 'As indicated',
    recommendation: 'Juicio clínico',
    modality: 'Según indicación',
  };

  const recommendation = isModifierS
    ? `${follow.recommendation}; además, manejo de hallazgos significativos según juicio clínico`
    : follow.recommendation;

  return {
    guideline: GUIDELINE,
    category,
    recommendation,
    followUpInterval: follow.timing,
    imagingModality: follow.modality,
    rationale,
    warnings,
  };
}

function getSpecialCategory(nodule: LungRadsAssessmentInput['nodule']): {
  category: string;
  rationale: string;
  warnings?: string[];
} | null {
  // Note: hasSignificantFinding is handled as the "S" modifier in assessLungRads(),
  // not as a standalone category. See Lung-RADS v2022: S is an additive modifier.
  // Atypical cyst is handled separately in assessLungRads().

  if (nodule.isIncompleteStudy) {
    return {
      category: '0',
      rationale: 'Estudio incompleto o técnicamente inadecuado; requiere imagen adicional para clasificación',
      warnings: ['Categoría 0: estudio incompleto — se requiere evaluación adicional'],
    };
  }

  if (nodule.isBenign) {
    return {
      category: '1',
      rationale: 'Sin nódulos o hallazgos definitivamente benignos',
    };
  }

  if (nodule.isInflammatory) {
    const category = nodule.inflammatoryCategory === 'category2' ? '2' : '0';
    return {
      category,
      rationale:
        category === '0'
          ? 'Patrón inflamatorio/infeccioso justifica seguimiento a corto plazo'
          : 'Patrón inflamatorio/infeccioso probablemente benigno',
      warnings: nodule.inflammatoryCategory ? undefined : ['Categoría inflamatoria no especificada'],
    };
  }

  if (nodule.isAirway) {
    if (nodule.airwayPersistent) {
      return {
        category: '4B',
        rationale: 'Nódulo de vía aérea persistente en seguimiento a 3 meses',
      };
    }
    if (nodule.airwayInflammatoryOrInfectious) {
      return {
        category: '0',
        rationale: 'Anomalía tubular/múltiple de vía aérea probablemente infecciosa o inflamatoria sin nódulo obstructivo',
        warnings: ['Categoría 0: considerar TCBD de control en 1-3 meses para confirmar resolución'],
      };
    }
    if (nodule.airwayLocation === 'segmental-proximal') {
      return {
        category: '4A',
        rationale: 'Nódulo de vía aérea segmental o proximal',
      };
    }
    if (nodule.airwayLocation === 'subsegmental') {
      return {
        category: '2',
        rationale: 'Nódulo de vía aérea subsegmental con características benignas',
      };
    }
    return {
      category: '4A',
      rationale: 'Nódulo de vía aérea (localización no especificada)',
      warnings: ['Localización de vía aérea no especificada'],
    };
  }

  if (nodule.isJuxtapleural || nodule.isPerifissural) {
    const isBenignJuxta =
      nodule.type === 'solid' && nodule.diameterMm <= 10 && !nodule.hasSpiculation;
    if (isBenignJuxta) {
      return {
        category: '2',
        rationale: 'Morfología benigna yuxtapleural/perifisural (≤10mm, márgenes lisos)',
      };
    }
  }

  return null;
}

interface StandardClassification {
  category: string;
  rationale: string;
  warnings?: string[];
}

function classifyStandardLungRads(input: {
  nodule: LungRadsAssessmentInput['nodule'];
  isGrowing: boolean;
  isNew: boolean;
  priorCategory?: string;
  priorStatus?: 'stable' | 'decreasing' | 'progression';
  initialWarnings?: string[];
}): StandardClassification {
  const { nodule, isGrowing, isNew, priorCategory, priorStatus, initialWarnings } = input;
  let category: string;
  let warnings: string[] | undefined = initialWarnings;

  const isSlowGrowingSuspicious =
    nodule.isSlowGrowing && (nodule.type === 'solid' || nodule.type === 'part-solid');

  if (isSlowGrowingSuspicious) {
    category = '4B';
    warnings = [
      ...(warnings ?? []),
      'Crecimiento lento en múltiples estudios: Lung-RADS permite clasificar sólido/semi-sólido como 4B',
    ];
  } else if (nodule.isSlowGrowing && nodule.type === 'ground-glass') {
    category = '2';
    warnings = [
      ...(warnings ?? []),
      'GGN de crecimiento lento: puede mantenerse como categoría 2 hasta cumplir criterios de otra categoría',
    ];
  } else if (nodule.type === 'solid') {
    category = classifySolidLungRADS({
      diameter: nodule.diameterMm,
      scanType: nodule.scanType,
      isGrowing,
      isNew,
    });
  } else if (nodule.type === 'ground-glass') {
    category = classifyGroundGlass({
      diameter: nodule.diameterMm,
      scanType: nodule.scanType,
      isNew,
      isGrowing,
    });
  } else {
    const result = classifyPartSolid({
      diameter: nodule.diameterMm,
      solidComponent: nodule.solidComponentMm,
      scanType: nodule.scanType,
      isNew,
      isGrowing,
    });
    category = result.category;
    warnings = [...(warnings ?? []), ...(result.warnings ?? [])];
  }

  category = applySteppedManagement(category, priorCategory, priorStatus);

  if (nodule.hasSpiculation && ['3', '4A', '4B'].includes(category)) {
    category = '4X';
  }

  if (nodule.solidComponentMm !== undefined && nodule.solidComponentMm > nodule.diameterMm) {
    warnings = [...(warnings ?? []), 'El componente sólido no puede exceder el diámetro total'];
  }

  if (nodule.hasSignificantFinding) {
    category = `${category}S`;
    warnings = [...(warnings ?? []), 'Hallazgo clínicamente significativo (modificador S)'];
  }

  const rationaleParts = [
    `Contexto: ${nodule.scanType}`,
    isGrowing ? 'Crecimiento >1.5mm/12m detectado' : 'Sin crecimiento significativo (>1.5mm/12m)',
    isNew ? 'Nódulo nuevo' : 'Nódulo existente',
  ];
  if (nodule.isSlowGrowing) {
    rationaleParts.push('Crecimiento lento en múltiples estudios');
  }
  if (nodule.hasSpiculation && category.startsWith('4X')) {
    rationaleParts.push('Márgenes espiculados (4X)');
  }
  if (nodule.hasSignificantFinding) {
    rationaleParts.push('Hallazgo significativo (modificador S)');
  }

  return {
    category,
    rationale: rationaleParts.join(' | '),
    warnings,
  };
}

function assessAtypicalCyst(input: {
  nodule: LungRadsAssessmentInput['nodule'];
  isGrowing: boolean;
  isNew: boolean;
  priorCategory?: string;
  priorStatus?: 'stable' | 'decreasing' | 'progression';
  initialWarnings?: string[];
}): AssessmentResult | 'use-standard' {
  const { nodule, isGrowing, isNew, priorCategory, priorStatus, initialWarnings } = input;
  const exitWarnings: string[] = [...(initialWarnings ?? [])];

  if (nodule.atypicalCystUnilocularThinWalled) {
    exitWarnings.push(
      'Quiste unilocular de pared fina: Lung-RADS no clasifica quistes atípicos; se aplican criterios de nódulo',
    );
  }
  if (nodule.atypicalCystSolidDominant) {
    exitWarnings.push(
      'Nódulo cavitado con componente sólido dominante: se aplican criterios de nódulo sólido (ACR Lung-RADS v2022 § I.A)',
    );
  }

  if (nodule.atypicalCystUnilocularThinWalled || nodule.atypicalCystSolidDominant) {
    return 'use-standard';
  }

  const resolved = resolveAtypicalCystCategory(nodule);
  if (!resolved) {
    return buildResult(
      '3',
      'Quiste atípico marcado; descriptores morfológicos insuficientes para clasificación automática',
      [...exitWarnings, 'Descriptores de quiste atípico insuficientes; revisar caracterización'],
    );
  }

  let category = resolved.category;
  let rationale = resolved.rationale;
  let warnings = exitWarnings.length > 0 ? exitWarnings : undefined;

  if (resolved.source === 'auto') {
    rationale = `${rationale} (clasificación automática ACR Lung-RADS v2022 § I.A)`;
  }

  if (nodule.atypicalCystAdjacentNodule) {
    const standard = classifyStandardLungRads({
      nodule,
      isGrowing,
      isNew,
      priorCategory,
      priorStatus,
    });
    const cystCategory = category;
    category = higherLungRadsCategory(cystCategory, standard.category);
    rationale = `${rationale} | Nódulo adyacente: quiste ${cystCategory}, nódulo ${standard.category} → ${category}`;
    warnings = [...(warnings ?? []), ...(standard.warnings ?? [])];
  }

  if (nodule.hasSignificantFinding) {
    category = `${category}S`;
    warnings = [...(warnings ?? []), 'Hallazgo clínicamente significativo (modificador S)'];
  }

  return buildResult(category, rationale, warnings);
}

export function assessLungRads({ patient, nodule, priorCategory, priorStatus }: LungRadsAssessmentInput): AssessmentResult {
  if (patient.clinicalContext !== 'screening') {
    return {
      guideline: GUIDELINE,
      category: 'No aplicable',
      recommendation: 'Usar Fleischner u otra guía para hallazgos incidentales',
      followUpInterval: 'N/A',
      rationale: 'Lung-RADS aplica a poblaciones de screening',
      warnings: ['Se requiere contexto de screening para Lung-RADS'],
    };
  }

  const growthResult = calculateGrowth(nodule.diameterMm, nodule.priorDiameterMm, nodule.priorScanMonthsAgo);
  const isGrowing = growthResult.isGrowing;
  const isNew = nodule.isNew ?? false;
  let warnings: string[] | undefined;

  if (growthResult.isGrowing && growthResult.isLongInterval) {
    warnings = [...(warnings ?? []), 'Intervalo de seguimiento prolongado (>18 meses); interpretar crecimiento con cautela'];
  }

  const specialCategory = getSpecialCategory(nodule);
  if (specialCategory) {
    return buildResult(specialCategory.category, specialCategory.rationale, specialCategory.warnings);
  }

  if (nodule.isAtypicalCyst) {
    const atypicalResult = assessAtypicalCyst({
      nodule,
      isGrowing,
      isNew,
      priorCategory,
      priorStatus,
      initialWarnings: warnings,
    });

    if (atypicalResult !== 'use-standard') {
      return atypicalResult;
    }

    if (nodule.atypicalCystUnilocularThinWalled) {
      warnings = [
        ...(warnings ?? []),
        'Quiste unilocular de pared fina: Lung-RADS no clasifica quistes atípicos; se aplican criterios de nódulo',
      ];
    }
    if (nodule.atypicalCystSolidDominant) {
      warnings = [
        ...(warnings ?? []),
        'Nódulo cavitado con componente sólido dominante: se aplican criterios de nódulo sólido (ACR Lung-RADS v2022 § I.A)',
      ];
    }
  }

  const standard = classifyStandardLungRads({
    nodule,
    isGrowing,
    isNew,
    priorCategory,
    priorStatus,
    initialWarnings: warnings,
  });

  return buildResult(standard.category, standard.rationale, standard.warnings);
}

export function calculateLungRadsGrowth(currentDiameter: number, priorDiameter?: number, intervalMonths?: number): boolean {
  return calculateGrowth(currentDiameter, priorDiameter, intervalMonths).isGrowing;
}
