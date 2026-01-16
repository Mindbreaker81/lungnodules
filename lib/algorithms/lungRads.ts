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
    return { category: '3', warnings: ['Solid component size required for part-solid assessment'] };
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
    '0': { timing: '1-3 months', recommendation: 'Additional imaging or LDCT', modality: 'LDCT' },
    '1': { timing: '12 months', recommendation: 'Continue annual LDCT', modality: 'LDCT' },
    '2': { timing: '12 months', recommendation: 'Continue annual LDCT', modality: 'LDCT' },
    '3': { timing: '6 months', recommendation: 'LDCT', modality: 'LDCT' },
    '4A': { timing: '3 months', recommendation: 'LDCT; PET/CT if solid ≥8mm', modality: 'LDCT or PET/CT' },
    '4B': { timing: 'As indicated', recommendation: 'Diagnostic CT; PET/CT; biopsy', modality: 'CT/PET/Biopsy' },
    '4X': { timing: 'As indicated', recommendation: 'Diagnostic CT; PET/CT; biopsy; consider multidisciplinary review', modality: 'CT/PET/Biopsy/MDT' },
    'S': { timing: 'As indicated', recommendation: 'Manage significant findings per clinical judgment', modality: 'As indicated' },
  };

  const follow = followUps[category] ?? {
    timing: 'As indicated',
    recommendation: 'Clinical judgment',
    modality: 'As indicated',
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
      rationale: 'Significant finding flagged; manage per clinical judgment',
    };
  }

  if (nodule.isBenign) {
    return {
      category: '1',
      rationale: 'No nodules or definitely benign findings',
    };
  }

  if (nodule.isInflammatory) {
    const category = nodule.inflammatoryCategory === 'category2' ? '2' : '0';
    return {
      category,
      rationale:
        category === '0'
          ? 'Inflammatory/infectious pattern warrants short-term follow-up'
          : 'Inflammatory/infectious pattern likely benign',
      warnings: nodule.inflammatoryCategory ? undefined : ['Inflammatory category not specified'],
    };
  }

  if (nodule.isAirway) {
    if (nodule.airwayPersistent) {
      return {
        category: '4B',
        rationale: 'Persistent airway nodule on 3-month follow-up',
      };
    }
    if (nodule.airwayLocation === 'segmental-proximal') {
      return {
        category: '4A',
        rationale: 'Segmental or proximal airway nodule',
      };
    }
    if (nodule.airwayLocation === 'subsegmental') {
      return {
        category: '2',
        rationale: 'Subsegmental airway nodule with benign features',
      };
    }
    return {
      category: '4A',
      rationale: 'Airway nodule (location unspecified)',
      warnings: ['Airway location not specified'],
    };
  }

  if (nodule.isAtypicalCyst) {
    const map = {
      category3: { category: '3', rationale: 'Atypical cyst with growing cystic component' },
      category4A: { category: '4A', rationale: 'Atypical cyst with thick wall or multiloculated morphology' },
      category4B: { category: '4B', rationale: 'Atypical cyst with growth or nodularity' },
    } as const;
    if (!nodule.atypicalCystCategory || !map[nodule.atypicalCystCategory]) {
      return {
        category: '3',
        rationale: 'Atypical cyst flagged; pending detailed characterization',
        warnings: ['Atypical cyst category not specified'],
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
        rationale: 'Yuxtapleural/perifissural benign morphology (≤10mm, smooth margins)',
      };
    }
  }

  return null;
}

export function assessLungRads({ patient, nodule, priorCategory, priorStatus }: LungRadsAssessmentInput): AssessmentResult {
  if (patient.clinicalContext !== 'screening') {
    return {
      guideline: GUIDELINE,
      category: 'Not applicable',
      recommendation: 'Use Fleischner or other guidance for incidental findings',
      followUpInterval: 'N/A',
      rationale: 'Lung-RADS applies to screening populations',
      warnings: ['Screening context required for Lung-RADS'],
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
    warnings = [...(warnings ?? []), 'Solid component cannot exceed total diameter'];
  }

  const rationaleParts = [
    `Context: ${nodule.scanType}`,
    isGrowing ? 'Growth >1.5mm/12m detected' : 'No significant growth detected',
    isNew ? 'New nodule' : 'Existing nodule',
  ];
  if (nodule.hasSpiculation && category === '4X') {
    rationaleParts.push('Spiculated margins (4X)');
  }

  return buildResult(category, rationaleParts.join(' | '), warnings);
}

export function calculateLungRadsGrowth(currentDiameter: number, priorDiameter?: number, intervalMonths?: number): boolean {
  return calculateGrowth(currentDiameter, priorDiameter, intervalMonths);
}
