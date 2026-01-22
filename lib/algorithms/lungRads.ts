import {
  AssessmentResult,
  GuidelineId,
  LungRadsAssessmentInput,
} from './types';

const GUIDELINE: GuidelineId = 'lung-rads-2022';
const GROWTH_THRESHOLD_MM_PER_12M = 1.5;

function calculateGrowth(currentDiameter: number, priorDiameter?: number, intervalMonths?: number): boolean {
  if (priorDiameter === undefined || priorDiameter <= 0 || currentDiameter <= 0) return false;
  if (!intervalMonths || intervalMonths <= 0) return false;
  const delta = currentDiameter - priorDiameter;
  if (intervalMonths <= 12) {
    return delta > GROWTH_THRESHOLD_MM_PER_12M;
  }
  const annualizedChange = (delta / intervalMonths) * 12;
  return annualizedChange > GROWTH_THRESHOLD_MM_PER_12M;
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

function classifyGroundGlass(diameter: number): string {
  if (diameter < 30) return '2';
  return '3';
}

function classifyPartSolid(diameter: number, solidComponent?: number): { category: string; warnings?: string[] } {
  if (solidComponent === undefined) {
    return { category: '3', warnings: ['Se requiere tamaño del componente sólido para evaluación parte-sólida'] };
  }
  if (solidComponent >= 6) {
    return { category: '4B' };
  }
  // Baseline heuristic: treat as probably benign unless size large
  if (diameter >= 8) {
    return { category: '4A' };
  }
  return { category: '3' };
}

function applySteppedManagement(currentCategory: string, priorCategory?: string, priorStatus?: 'stable' | 'progression'): string {
  if (!priorCategory || !priorStatus) return currentCategory;

  if (priorCategory === '3' && priorStatus === 'stable') {
    return '2';
  }
  if (priorCategory === '4A' && priorStatus === 'stable') {
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
    'S': { timing: 'Según indicación', recommendation: 'Manejo de hallazgos significativos según juicio clínico', modality: 'Según indicación' },
  };

  const follow = followUps[category] ?? {
    timing: 'As indicated',
    recommendation: 'Juicio clínico',
    modality: 'Según indicación',
  };

  return {
    guideline: GUIDELINE,
    category,
    recommendation: follow.recommendation,
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
  if (nodule.hasSignificantFinding) {
    return {
      category: 'S',
      rationale: 'Hallazgo significativo detectado; manejar según juicio clínico',
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

  if (nodule.isAtypicalCyst) {
    const map = {
      category3: { category: '3', rationale: 'Quiste atípico con componente quístico en crecimiento' },
      category4A: { category: '4A', rationale: 'Quiste atípico con pared gruesa o multiloculado' },
      category4B: { category: '4B', rationale: 'Quiste atípico con crecimiento o nodularidad' },
    } as const;
    if (!nodule.atypicalCystCategory || !map[nodule.atypicalCystCategory]) {
      return {
        category: '3',
        rationale: 'Quiste atípico marcado; pendiente de caracterización detallada',
        warnings: ['Categoría de quiste atípico no especificada'],
      };
    }
    return map[nodule.atypicalCystCategory];
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

  const isGrowing = calculateGrowth(nodule.diameterMm, nodule.priorDiameterMm, nodule.priorScanMonthsAgo);
  const isNew = nodule.isNew ?? false;
  let category: string;
  let warnings: string[] | undefined;

  const specialCategory = getSpecialCategory(nodule);
  if (specialCategory) {
    return buildResult(specialCategory.category, specialCategory.rationale, specialCategory.warnings);
  }

  if (nodule.type === 'solid') {
    category = classifySolidLungRADS({
      diameter: nodule.diameterMm,
      scanType: nodule.scanType,
      isGrowing,
      isNew,
    });
  } else if (nodule.type === 'ground-glass') {
    category = classifyGroundGlass(nodule.diameterMm);
  } else {
    const result = classifyPartSolid(nodule.diameterMm, nodule.solidComponentMm);
    category = result.category;
    warnings = result.warnings;
  }

  if (nodule.hasSpiculation && ['3', '4A', '4B'].includes(category)) {
    category = '4X';
  }

  category = applySteppedManagement(category, priorCategory, priorStatus);

  if (nodule.solidComponentMm !== undefined && nodule.solidComponentMm > nodule.diameterMm) {
    warnings = [...(warnings ?? []), 'El componente sólido no puede exceder el diámetro total'];
  }

  const rationaleParts = [
    `Contexto: ${nodule.scanType}`,
    isGrowing ? 'Crecimiento >1.5mm/12m detectado' : 'Sin crecimiento significativo (>1.5mm/12m)',
    isNew ? 'Nódulo nuevo' : 'Nódulo existente',
  ];
  if (nodule.hasSpiculation && category === '4X') {
    rationaleParts.push('Márgenes espiculados (4X)');
  }

  return buildResult(category, rationaleParts.join(' | '), warnings);
}

export function calculateLungRadsGrowth(currentDiameter: number, priorDiameter?: number, intervalMonths?: number): boolean {
  return calculateGrowth(currentDiameter, priorDiameter, intervalMonths);
}
