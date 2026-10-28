import {
  AssessmentResult,
  GuidelineId,
  LungRadsAssessmentInput,
} from './types';
import { higherLungRadsCategory, resolveAtypicalCystCategory } from './atypicalCyst';

const GUIDELINE: GuidelineId = 'lung-rads-2022';
// ACR v2022 notes 4 and 6: mean diameter is reported to one decimal and growth
// is an increase of >1.5 mm within a 12-month interval. Diameters are compared
// in whole tenths so that an exact +1.5 mm decimal pair does not cross the
// threshold through binary floating-point error (e.g. 2.9 -> 4.4 mm)
const GROWTH_THRESHOLD_TENTHS = 15;
const GROWTH_INTERVAL_MONTHS = 12;

interface GrowthResult {
  // ACR v2022 note 6: increase >1.5 mm within a 12-month interval
  isGrowing: boolean;
  // Increase observed over an interval >12 months does not meet the note 6
  // definition and, by itself, does not document the slow-growth pattern of
  // notes 7-8 (which requires growth over multiple screening exams)
  isIntervalGrowth: boolean;
}

function calculateGrowth(currentDiameter: number, priorDiameter?: number, intervalMonths?: number, allowZeroPrior = false): GrowthResult {
  if (priorDiameter === undefined || currentDiameter <= 0) return { isGrowing: false, isIntervalGrowth: false };
  if (allowZeroPrior ? priorDiameter < 0 : priorDiameter <= 0) return { isGrowing: false, isIntervalGrowth: false };
  if (!intervalMonths || intervalMonths <= 0) return { isGrowing: false, isIntervalGrowth: false };
  const deltaTenths = Math.round(currentDiameter * 10) - Math.round(priorDiameter * 10);
  if (intervalMonths <= GROWTH_INTERVAL_MONTHS) {
    return { isGrowing: deltaTenths > GROWTH_THRESHOLD_TENTHS, isIntervalGrowth: false };
  }
  return { isGrowing: false, isIntervalGrowth: deltaTenths > 0 };
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
  isIntervalGrowth: boolean;
}): { category: string; warnings?: string[] } {
  const { diameter, scanType, isNew, isGrowing, isIntervalGrowth } = options;

  if (diameter < 30) return { category: '2' };

  // ACR v2022: GGN >=30mm stable or slowly growing in follow-up -> Cat 2;
  // baseline or new -> Cat 3
  if (scanType === 'follow-up' && !isNew && !isGrowing) {
    if (isIntervalGrowth) {
      // An increase observed over an interval >12 months is neither confirmed
      // ACR growth (note 6) nor documented stability/slow growth (note 7):
      // provisional Cat 3 by size (note 5) pending the intermediate exams
      return {
        category: '3',
        warnings: [
          'GGN ≥30 mm con aumento en intervalo >12 meses: no se puede acreditar estabilidad ni crecimiento lento. Categoría 3 provisional por tamaño; revise los estudios intermedios para confirmar la trayectoria.',
        ],
      };
    }
    return { category: '2' };
  }
  return { category: '3' };
}

function classifyPartSolid(options: {
  diameter: number;
  solidComponent?: number;
  scanType: 'baseline' | 'follow-up';
  isNew: boolean;
  isSolidComponentGrowing: boolean;
  isSolidComponentNew: boolean;
}): { category: string; warnings?: string[] } {
  const { diameter, solidComponent, scanType, isNew, isSolidComponentGrowing, isSolidComponentNew } = options;

  // ACR v2022: a new or growing solid component escalates an existing nodule
  // before the <6mm total criterion applies (4A <4mm, 4B >=4mm)
  if (
    scanType === 'follow-up' &&
    !isNew &&
    solidComponent !== undefined &&
    (isSolidComponentGrowing || isSolidComponentNew)
  ) {
    return { category: solidComponent >= 4 ? '4B' : '4A' };
  }

  if (diameter < 6) {
    // New part-solid <6mm in follow-up -> Cat 3 (more conservative than baseline)
    if (scanType === 'follow-up' && isNew) return { category: '3' };
    return { category: '2' };
  }
  if (solidComponent === undefined) {
    return { category: '3', warnings: ['Se requiere tamaño del componente sólido para evaluación semi-sólida'] };
  }

  // ACR v2022: follow-up escalation uses the solid component
  // (new or growing <4mm -> 4A; new or growing >=4mm -> 4B)
  if (scanType === 'follow-up' && (isNew || isSolidComponentGrowing || isSolidComponentNew)) {
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

function getSpecialCategory(
  nodule: LungRadsAssessmentInput['nodule'],
  growth: Pick<GrowthResult, 'isGrowing' | 'isIntervalGrowth'>,
  collectedWarnings: string[],
): {
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
    if (nodule.airwayInflammatoryOrInfectious) {
      const category = nodule.airwayInflammatoryCategory === 'category2' ? '2' : '0';
      return {
        category,
        rationale:
          category === '0'
            ? 'Anomalía tubular/múltiple de vía aérea probablemente infecciosa o inflamatoria sin nódulo obstructivo'
            : 'Anomalía tubular/múltiple de vía aérea con características benignas',
        warnings: [
          ...(category === '0'
            ? ['Categoría 0: considerar TCBD de control en 1-3 meses para confirmar resolución']
            : []),
          ...(nodule.airwayInflammatoryCategory ? [] : ['Categoría de vía aérea inflamatoria no especificada (0 o 2)']),
        ],
      };
    }
    if (nodule.airwayLocation === 'segmental-proximal') {
      if (nodule.airwayPersistent) {
        return {
          category: '4B',
          rationale: 'Nódulo de vía aérea segmentario o proximal persistente en control a 3 meses',
        };
      }
      return {
        category: '4A',
        rationale: 'Nódulo de vía aérea segmental o proximal',
      };
    }
    if (nodule.airwayLocation === 'subsegmental') {
      return {
        category: '2',
        rationale: 'Nódulo de vía aérea subsegmental',
        warnings: nodule.airwayPersistent
          ? ['Persistencia en vía aérea subsegmentaria no escala a 4B (reservado a lesiones 4A segmentarias o proximales)']
          : undefined,
      };
    }
    return {
      category: '4A',
      rationale: 'Nódulo de vía aérea (localización no especificada)',
      warnings: ['Localización de vía aérea no especificada'],
    };
  }

  if (nodule.isJuxtapleural || nodule.isPerifissural) {
    const shapeOk =
      nodule.juxtapleuralShape === 'triangular' ||
      nodule.juxtapleuralShape === 'lentiform' ||
      nodule.juxtapleuralShape === 'ovoid';
    const morphologyOk =
      nodule.hasSmoothMargins === true && shapeOk && !nodule.hasSpiculation;
    const baselineOrNew = nodule.scanType === 'baseline' || nodule.isNew === true;
    if (nodule.type === 'solid' && nodule.diameterMm < 10) {
      if (baselineOrNew && !growth.isGrowing && morphologyOk) {
        return {
          category: '2',
          rationale: 'Nódulo yuxtapleural/perifisural sólido <10mm, márgenes lisos y forma triangular, lentiforme u ovoide (basal o nuevo)',
        };
      }
      if (!baselineOrNew) {
        collectedWarnings.push('La regla yuxtapleural (Cat 2) aplica solo en estudio basal o nódulo nuevo');
      } else if (growth.isGrowing) {
        collectedWarnings.push('Nódulo yuxtapleural en crecimiento: no aplica categoría 2 por morfología benigna');
      } else {
        collectedWarnings.push('Regla yuxtapleural no aplicada: requiere márgenes lisos y forma triangular, lentiforme u ovoide');
      }
    } else if (nodule.type === 'solid' && nodule.diameterMm !== undefined) {
      collectedWarnings.push('Regla yuxtapleural no aplicada: requiere diámetro medio <10 mm');
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
  growth: Pick<GrowthResult, 'isGrowing' | 'isIntervalGrowth'>;
  isNew: boolean;
  priorCategory?: string;
  priorStatus?: 'stable' | 'decreasing' | 'progression';
  initialWarnings?: string[];
}): StandardClassification {
  const { nodule, growth, isNew, priorCategory, priorStatus, initialWarnings } = input;
  const { isGrowing, isIntervalGrowth } = growth;
  let category: string;
  let warnings: string[] | undefined = initialWarnings;

  // A solid component that appears in an existing nodule (prior 0 -> >0) is
  // a "new solid component" per the 4A/4B rows; it does not need to meet the
  // >1.5mm growth threshold
  const isSolidComponentNew =
    nodule.type === 'part-solid' &&
    !isNew &&
    nodule.priorSolidComponentMm === 0 &&
    (nodule.solidComponentMm ?? 0) > 0;

  // Slow growth (ACR v2022 notes 7-8): growth demonstrated over multiple
  // screening exams without meeting the >1.5mm threshold in any 12-month
  // interval. A single interval >12 months does not document that pattern, so
  // the pathway applies only when flagged by the reader (isSlowGrowing).
  // A new nodule has no documented multi-exam trajectory: the flag is ignored
  const slowGrowingApplies = !isNew && Boolean(nodule.isSlowGrowing);
  const isSlowGrowingSuspicious =
    slowGrowingApplies && (nodule.type === 'solid' || nodule.type === 'part-solid');

  if (isSlowGrowingSuspicious) {
    category = '4B';
    warnings = [
      ...(warnings ?? []),
      'Crecimiento lento en múltiples cribados sin superar >1,5 mm en ningún intervalo de 12 meses: Lung-RADS permite clasificar sólido/semi-sólido como 4B',
    ];
  } else if (slowGrowingApplies && nodule.type === 'ground-glass') {
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
    const result = classifyGroundGlass({
      diameter: nodule.diameterMm,
      scanType: nodule.scanType,
      isNew,
      isGrowing,
      isIntervalGrowth,
    });
    category = result.category;
    warnings = [...(warnings ?? []), ...(result.warnings ?? [])];
  } else {
    const result = classifyPartSolid({
      diameter: nodule.diameterMm,
      solidComponent: nodule.solidComponentMm,
      scanType: nodule.scanType,
      isNew,
      isSolidComponentGrowing: isGrowing,
      isSolidComponentNew,
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

  const growthRationale = isGrowing
    ? nodule.type === 'part-solid'
      ? 'Crecimiento del componente sólido >1,5 mm en 12 meses'
      : 'Crecimiento >1,5 mm en 12 meses detectado'
    : isIntervalGrowth
      ? 'Aumento de tamaño en intervalo >12 meses (no cumple la definición de crecimiento ACR)'
      : 'Sin crecimiento significativo (>1,5 mm en 12 meses)';
  const rationaleParts = [
    `Contexto: ${nodule.scanType}`,
    growthRationale,
    isNew ? 'Nódulo nuevo' : 'Nódulo existente',
  ];
  if (isSolidComponentNew) {
    rationaleParts.push('Componente sólido nuevo (0 → >0 mm)');
  }
  if (slowGrowingApplies) {
    rationaleParts.push('Crecimiento lento en múltiples cribados');
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
  growth: Pick<GrowthResult, 'isGrowing' | 'isIntervalGrowth'>;
  isNew: boolean;
  priorCategory?: string;
  priorStatus?: 'stable' | 'decreasing' | 'progression';
  initialWarnings?: string[];
}): AssessmentResult | 'use-standard' {
  const { nodule, growth, isNew, priorCategory, priorStatus, initialWarnings } = input;
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

  let category: string = resolved.category;
  let rationale = resolved.rationale;
  let warnings = exitWarnings.length > 0 ? exitWarnings : undefined;

  if (resolved.source === 'auto') {
    rationale = `${rationale} (clasificación automática ACR Lung-RADS v2022 § I.A)`;
  }

  if (nodule.atypicalCystAdjacentNodule) {
    const standard = classifyStandardLungRads({
      nodule,
      growth,
      isNew,
      priorCategory,
      priorStatus,
    });
    const cystCategory = category;
    category = higherLungRadsCategory(cystCategory, standard.category);
    rationale = `${rationale} | Nódulo adyacente: quiste ${cystCategory}, nódulo ${standard.category} → ${category}`;
    warnings = [...(warnings ?? []), ...(standard.warnings ?? [])];
  }

  if (nodule.hasSignificantFinding && !category.endsWith('S')) {
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

  const isNew = nodule.isNew ?? false;
  // A new nodule has no prior measurement or category: ignore any prior
  // values sent by callers (a new lesion cannot step down from a prior one)
  const priorDiameter = isNew ? undefined : nodule.priorDiameterMm;
  const priorSolidComponent = isNew ? undefined : nodule.priorSolidComponentMm;
  const effectivePriorCategory = isNew ? undefined : priorCategory;
  const effectivePriorStatus = isNew ? undefined : priorStatus;

  const diameterGrowth = calculateGrowth(nodule.diameterMm, priorDiameter, nodule.priorScanMonthsAgo);
  // ACR v2022: part-solid escalation is driven by the solid component, not the
  // total diameter. A prior solid component of 0 is valid (previous pure GGN).
  const solidComponentGrowth = calculateGrowth(
    nodule.solidComponentMm ?? Number.NaN,
    priorSolidComponent,
    nodule.priorScanMonthsAgo,
    true,
  );
  const growth: GrowthResult =
    nodule.type === 'part-solid'
      ? {
          isGrowing: solidComponentGrowth.isGrowing,
          isIntervalGrowth: solidComponentGrowth.isIntervalGrowth || diameterGrowth.isIntervalGrowth,
        }
      : diameterGrowth;

  // ACR v2022 note 14: a GGN that doubles in size in 1 year is an additional
  // finding that increases suspicion (4X applies to category 3 or 4 nodules).
  // It is surfaced as a warning; the category is not changed automatically
  const ggnDoublesInOneYear =
    nodule.type === 'ground-glass' &&
    !isNew &&
    priorDiameter !== undefined &&
    priorDiameter > 0 &&
    nodule.priorScanMonthsAgo !== undefined &&
    nodule.priorScanMonthsAgo > 0 &&
    nodule.priorScanMonthsAgo <= GROWTH_INTERVAL_MONTHS &&
    Math.round(nodule.diameterMm * 10) >= 2 * Math.round(priorDiameter * 10);

  let warnings: string[] | undefined;

  if (growth.isIntervalGrowth) {
    warnings = [
      ...(warnings ?? []),
      'Intervalo >12 meses: no se puede aplicar la definición de crecimiento ACR (>1,5 mm en 12 meses). Si el nódulo ha crecido en varios cribados sin superar ese umbral en ningún intervalo de 12 meses, marque "crecimiento lento".',
    ];
  }

  if (
    nodule.type === 'part-solid' &&
    nodule.scanType === 'follow-up' &&
    !isNew &&
    !nodule.isIncompleteStudy &&
    priorSolidComponent === undefined
  ) {
    warnings = [
      ...(warnings ?? []),
      'Componente sólido previo no indicado: el escalado 4A/4B por crecimiento usa el componente sólido',
    ];
  }

  const collectedWarnings: string[] = [];
  const specialCategory = getSpecialCategory(nodule, growth, collectedWarnings);
  if (collectedWarnings.length > 0) {
    warnings = [...(warnings ?? []), ...collectedWarnings];
  }
  if (specialCategory) {
    let category = specialCategory.category;
    let rationale = specialCategory.rationale;
    const specialWarnings = [...(warnings ?? []), ...(specialCategory.warnings ?? [])];
    if (nodule.hasSignificantFinding && !category.endsWith('S')) {
      category = `${category}S`;
      rationale = `${rationale} | Hallazgo significativo (modificador S)`;
      specialWarnings.push('Hallazgo clínicamente significativo (modificador S)');
    }
    return buildResult(
      category,
      rationale,
      specialWarnings.length > 0 ? specialWarnings : undefined,
    );
  }

  if (nodule.isAtypicalCyst) {
    const atypicalResult = assessAtypicalCyst({
      nodule,
      growth,
      isNew,
      priorCategory: effectivePriorCategory,
      priorStatus: effectivePriorStatus,
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
    growth,
    isNew,
    priorCategory: effectivePriorCategory,
    priorStatus: effectivePriorStatus,
    initialWarnings: warnings,
  });

  let standardWarnings = standard.warnings;
  if (ggnDoublesInOneYear && !standard.category.startsWith('4X')) {
    standardWarnings = [
      ...(standardWarnings ?? []),
      'GGN que duplica su tamaño en un año (ACR Lung-RADS v2022, nota 14): aumenta la sospecha de malignidad; considerar categoría 4X si la clasificación es 3 o 4',
    ];
  }

  return buildResult(standard.category, standard.rationale, standardWarnings);
}

export function calculateLungRadsGrowth(currentDiameter: number, priorDiameter?: number, intervalMonths?: number): boolean {
  return calculateGrowth(currentDiameter, priorDiameter, intervalMonths).isGrowing;
}

export function calculateLungRadsGrowthResult(
  currentDiameter: number,
  priorDiameter?: number,
  intervalMonths?: number,
  allowZeroPrior = false,
): GrowthResult {
  return calculateGrowth(currentDiameter, priorDiameter, intervalMonths, allowZeroPrior);
}
