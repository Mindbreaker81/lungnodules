import {
  ApplicabilityResult,
  AssessmentResult,
  FleischnerAssessmentInput,
  GuidelineId,
  NoduleCharacteristics,
  PatientProfile,
  RiskLevel,
} from './types';

const GUIDELINE: GuidelineId = 'fleischner-2017';

const roundToNearestMm = (value: number) => Math.round(value);

export function checkFleischnerApplicability(patient: PatientProfile): ApplicabilityResult {
  if (patient.age < 35) {
    return { applicable: false, reason: 'Fleischner guidelines apply to patients ≥35 years' };
  }
  if (patient.hasKnownMalignancy) {
    return { applicable: false, reason: 'Known malignancy — use disease-specific guidance' };
  }
  if (patient.isImmunocompromised) {
    return { applicable: false, reason: 'Immunocompromised — guideline not applicable' };
  }
  return { applicable: true };
}

function assessSubsolidMultiple(options: {
  type: 'ground-glass' | 'part-solid';
  diameter: number;
  solidComponent?: number;
  riskLevel: RiskLevel;
}): AssessmentResult {
  const { type, diameter, solidComponent, riskLevel } = options;
  const highRiskFollowup = 'CT at 3-6 months; if stable consider CT at 2 and 4 years';
  const lowRiskFollowup = 'CT at 3-6 months to confirm persistence; no routine follow-up if stable';

  if (diameter < 6) {
    return {
      guideline: GUIDELINE,
      category: `${type === 'ground-glass' ? 'Ground-glass' : 'Part-solid'} <6mm (multiple)`,
      recommendation: riskLevel === 'high' ? highRiskFollowup : lowRiskFollowup,
      followUpInterval: riskLevel === 'high' ? '3-6 months (consider 2 & 4 years)' : '3-6 months',
      rationale: 'Multiple subsolid nodules <6mm warrant short-term confirmation; consider infectious causes',
    };
  }

  if (type === 'ground-glass') {
    return {
      guideline: GUIDELINE,
      category: 'Ground-glass ≥6mm (multiple)',
      recommendation: 'CT at 3-6 months; subsequent management based on most suspicious nodule',
      followUpInterval: '3-6 months',
      rationale: 'Dominant nodule guides management; persistent multiple GGNs may represent multifocal disease',
    };
  }

  if (solidComponent === undefined) {
    return {
      guideline: GUIDELINE,
      category: 'Part-solid ≥6mm (multiple, solid unknown)',
      recommendation: 'Measure solid component; CT at 3-6 months; manage based on dominant nodule',
      followUpInterval: '3-6 months',
      rationale: 'Solid component size drives risk stratification for part-solid nodules',
      warnings: ['Solid component size required for part-solid assessment'],
    };
  }

  if (solidComponent < 6) {
    return {
      guideline: GUIDELINE,
      category: 'Part-solid ≥6mm, solid <6mm (multiple)',
      recommendation: 'CT at 3-6 months; if persistent, annual CT for 5 years (dominant nodule)',
      followUpInterval: '3-6 months; then annual x5y',
      rationale: 'Persistent part-solid nodules with small solid components need long-term surveillance',
    };
  }

  return {
    guideline: GUIDELINE,
    category: 'Part-solid ≥6mm, solid ≥6mm (multiple)',
    recommendation: 'CT at 3-6 months; consider PET/CT, biopsy, or surgical excision if persistent',
    followUpInterval: '3-6 months (then diagnostic workup)',
    malignancyRisk: 'High suspicion',
    rationale: 'Solid component ≥6mm is highly suspicious even in multiple nodules',
    warnings: ['HIGHLY SUSPICIOUS — consider tissue diagnosis'],
  };
}

function assessSolidSingle(diameter: number, riskLevel: RiskLevel): AssessmentResult {
  if (diameter < 6) {
    return riskLevel === 'low'
      ? {
          guideline: GUIDELINE,
          category: 'Solid <6mm (single, low risk)',
          recommendation: 'No routine follow-up',
          followUpInterval: 'None',
          rationale: 'Malignancy risk <1% in low-risk patients',
        }
      : {
          guideline: GUIDELINE,
          category: 'Solid <6mm (single, high risk)',
          recommendation: 'Optional CT at 12 months',
          followUpInterval: '12 months (optional)',
          rationale: 'Higher pretest probability — consider if suspicious morphology',
        };
  }

  if (diameter >= 6 && diameter <= 8) {
    return riskLevel === 'low'
      ? {
          guideline: GUIDELINE,
          category: 'Solid 6-8mm (single, low risk)',
          recommendation: 'CT at 6-12 months; consider CT at 18-24 months',
          followUpInterval: '6-12 months (consider 18-24)',
          rationale: 'Establish stability; malignancy risk ~0.5-2%',
        }
      : {
          guideline: GUIDELINE,
          category: 'Solid 6-8mm (single, high risk)',
          recommendation: 'CT at 6-12 months; then CT at 18-24 months',
          followUpInterval: '6-12 months; then 18-24 months',
          rationale: 'Higher risk warrants two follow-up scans',
        };
  }

  return {
    guideline: GUIDELINE,
    category: 'Solid >8mm (single)',
    recommendation: 'Consider CT at 3 months, PET/CT, or tissue sampling',
    followUpInterval: '3 months (or as indicated)',
    malignancyRisk: '~3%',
    rationale: 'Larger solid nodules merit aggressive evaluation',
  };
}

function assessSolidMultiple(diameter: number, riskLevel: RiskLevel): AssessmentResult {
  if (diameter < 6) {
    return riskLevel === 'low'
      ? {
          guideline: GUIDELINE,
          category: 'Solid <6mm (multiple, low risk)',
          recommendation: 'No routine follow-up',
          followUpInterval: 'None',
          rationale: 'Very low malignancy risk in low-risk patients',
        }
      : {
          guideline: GUIDELINE,
          category: 'Solid <6mm (multiple, high risk)',
          recommendation: 'Optional CT at 12 months',
          followUpInterval: '12 months (optional)',
          rationale: 'Higher baseline risk; consider if suspicious morphology',
        };
  }

  return riskLevel === 'low'
    ? {
        guideline: GUIDELINE,
        category: 'Solid ≥6mm (multiple, low risk)',
        recommendation: 'CT at 3-6 months; consider CT at 18-24 months',
        followUpInterval: '3-6 months (consider 18-24)',
        rationale: 'Multiple nodules need short-term follow-up to assess stability',
      }
    : {
        guideline: GUIDELINE,
        category: 'Solid ≥6mm (multiple, high risk)',
        recommendation: 'CT at 3-6 months; then CT at 18-24 months',
        followUpInterval: '3-6 months; then 18-24 months',
        rationale: 'High-risk patients need two follow-up scans',
      };
}

function assessGroundGlass(diameter: number): AssessmentResult {
  if (diameter < 6) {
    return {
      guideline: GUIDELINE,
      category: 'Ground-glass <6mm',
      recommendation: 'No routine follow-up',
      followUpInterval: 'None',
      rationale: 'Very low malignancy risk; overtreatment to be avoided',
    };
  }
  return {
    guideline: GUIDELINE,
    category: 'Ground-glass ≥6mm',
    recommendation: 'CT at 6-12 months, then CT every 2 years until 5 years',
    followUpInterval: '6-12 months; then q2y until 5y',
    rationale: 'Persistent GGNs ≥6mm warrant surveillance',
  };
}

function assessPartSolid(diameter: number, solidComponent?: number): AssessmentResult {
  if (diameter < 6) {
    return {
      guideline: GUIDELINE,
      category: 'Part-solid <6mm',
      recommendation: 'No routine follow-up',
      followUpInterval: 'None',
      rationale: 'Small part-solid nodules rarely malignant',
    };
  }

  if (solidComponent === undefined) {
    return {
      guideline: GUIDELINE,
      category: 'Part-solid (solid component unknown)',
      recommendation: 'Measure solid component; management depends on solid size',
      followUpInterval: 'Pending measurement',
      rationale: 'Solid component size drives risk stratification',
      warnings: ['Solid component size required for part-solid assessment'],
    };
  }

  if (solidComponent < 6) {
    return {
      guideline: GUIDELINE,
      category: 'Part-solid ≥6mm, solid <6mm',
      recommendation: 'CT at 3-6 months, then annual CT for 5 years',
      followUpInterval: '3-6 months; then annual x5y',
      rationale: 'Risk rises with persistence; annual surveillance advised',
    };
  }

  return {
    guideline: GUIDELINE,
    category: 'Part-solid, solid ≥6mm',
    recommendation: 'PET/CT, biopsy, or surgical excision',
    followUpInterval: 'As indicated',
    malignancyRisk: 'High suspicion',
    rationale: 'Solid component ≥6mm is highly suspicious',
    warnings: ['HIGHLY SUSPICIOUS — consider tissue diagnosis'],
  };
}

export function assessFleischner({ patient, nodule }: FleischnerAssessmentInput): AssessmentResult {
  const applicability = checkFleischnerApplicability(patient);
  if (!applicability.applicable) {
    return {
      guideline: GUIDELINE,
      category: 'Not applicable',
      recommendation: 'Use alternative clinical guidance',
      followUpInterval: 'N/A',
      rationale: applicability.reason ?? 'Guideline exclusions apply',
      warnings: applicability.reason ? [applicability.reason] : undefined,
    };
  }

  const riskLevel: RiskLevel = patient.riskLevel ?? 'low';
  const { type, diameterMm, solidComponentMm, isMultiple, isPerifissural } = nodule;
  const roundedDiameter = roundToNearestMm(diameterMm);
  const roundedSolidComponent = solidComponentMm === undefined ? undefined : roundToNearestMm(solidComponentMm);

  if (type === 'solid' && isPerifissural) {
    return {
      guideline: GUIDELINE,
      category: 'Perifissural nodule (benign morphology)',
      recommendation: 'No routine follow-up',
      followUpInterval: 'None',
      rationale: 'Perifissural nodules with typical benign morphology rarely malignant',
    };
  }

  if (type === 'solid') {
    return isMultiple ? assessSolidMultiple(roundedDiameter, riskLevel) : assessSolidSingle(roundedDiameter, riskLevel);
  }

  if (type === 'ground-glass') {
    return isMultiple
      ? assessSubsolidMultiple({ type, diameter: roundedDiameter, riskLevel })
      : assessGroundGlass(roundedDiameter);
  }

  if (type === 'part-solid') {
    return isMultiple
      ? assessSubsolidMultiple({ type, diameter: roundedDiameter, solidComponent: roundedSolidComponent, riskLevel })
      : assessPartSolid(roundedDiameter, roundedSolidComponent);
  }

  return {
    guideline: GUIDELINE,
    category: 'Unsupported nodule type',
    recommendation: 'Review input data',
    followUpInterval: 'N/A',
    rationale: 'Type not recognized',
    warnings: ['Unknown nodule type'],
  };
}

export function getFleischnerWarnings(nodule: NoduleCharacteristics): string[] {
  const warnings: string[] = [];
  if (nodule.solidComponentMm !== undefined && nodule.solidComponentMm > nodule.diameterMm) {
    warnings.push('Solid component cannot exceed total diameter');
  }
  return warnings;
}
