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
  const followUps: Record<string, { timing: string; recommendation: string }> = {
    '0': { timing: '1-3 months', recommendation: 'Additional imaging or LDCT' },
    '1': { timing: '12 months', recommendation: 'Continue annual LDCT' },
    '2': { timing: '12 months', recommendation: 'Continue annual LDCT' },
    '3': { timing: '6 months', recommendation: 'LDCT' },
    '4A': { timing: '3 months', recommendation: 'LDCT; PET/CT if solid ≥8mm' },
    '4B': { timing: 'As indicated', recommendation: 'Diagnostic CT; PET/CT; biopsy' },
    '4X': { timing: 'As indicated', recommendation: 'Diagnostic CT; PET/CT; biopsy; consider multidisciplinary review' },
  };

  const follow = followUps[category] ?? { timing: 'As indicated', recommendation: 'Clinical judgment' };

  return {
    guideline: GUIDELINE,
    category,
    recommendation: follow.recommendation,
    followUpInterval: follow.timing,
    imagingModality: 'LDCT',
    rationale,
    warnings,
  };
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

  category = applySteppedManagement(category, priorCategory, priorStatus);

  if (nodule.solidComponentMm !== undefined && nodule.solidComponentMm > nodule.diameterMm) {
    warnings = [...(warnings ?? []), 'Solid component cannot exceed total diameter'];
  }

  const rationaleParts = [
    `Context: ${nodule.scanType}`,
    isGrowing ? 'Growth >1.5mm/12m detected' : 'No significant growth detected',
    isNew ? 'New nodule' : 'Existing nodule',
  ];

  return buildResult(category, rationaleParts.join(' | '), warnings);
}

export function calculateLungRadsGrowth(currentDiameter: number, priorDiameter?: number, intervalMonths?: number): boolean {
  return calculateGrowth(currentDiameter, priorDiameter, intervalMonths);
}
