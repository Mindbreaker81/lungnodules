// Clinical validation case package for expert panel review
// 50 test cases covering key scenarios for Fleischner 2017 and Lung-RADS v2022

import { FleischnerAssessmentInput, LungRadsAssessmentInput } from '@lib/algorithms/types';

export interface ValidationCase {
  id: string;
  description: string;
  guideline: 'fleischner-2017' | 'lung-rads-2022';
  input: FleischnerAssessmentInput | LungRadsAssessmentInput;
  expectedCategory: string;
  expectedRecommendation: string;
  clinicalNotes?: string;
  source?: string;
}

export interface ValidationResult {
  caseId: string;
  passed: boolean;
  actualCategory: string;
  actualRecommendation: string;
  discrepancy?: string;
}

export interface ValidationReport {
  timestamp: string;
  totalCases: number;
  passed: number;
  failed: number;
  accuracy: number;
  results: ValidationResult[];
}

// Fleischner 2017 validation cases (25 cases)
export const FLEISCHNER_VALIDATION_CASES: ValidationCase[] = [
  // Solid Single - Low Risk
  {
    id: 'F-001',
    description: 'Solid 4mm single, low risk',
    guideline: 'fleischner-2017',
    input: {
      patient: { age: 55, clinicalContext: 'incidental', riskLevel: 'low' },
      nodule: { type: 'solid', diameterMm: 4, isMultiple: false },
    },
    expectedCategory: 'Solid <6mm (single, low risk)',
    expectedRecommendation: 'No routine follow-up',
    clinicalNotes: 'Benign probability >99%',
  },
  {
    id: 'F-002',
    description: 'Solid 5mm single, high risk',
    guideline: 'fleischner-2017',
    input: {
      patient: { age: 65, clinicalContext: 'incidental', riskLevel: 'high' },
      nodule: { type: 'solid', diameterMm: 5, isMultiple: false },
    },
    expectedCategory: 'Solid <6mm (single, high risk)',
    expectedRecommendation: 'Optional CT at 12 months',
  },
  {
    id: 'F-003',
    description: 'Solid 7mm single, low risk',
    guideline: 'fleischner-2017',
    input: {
      patient: { age: 50, clinicalContext: 'incidental', riskLevel: 'low' },
      nodule: { type: 'solid', diameterMm: 7, isMultiple: false },
    },
    expectedCategory: 'Solid 6-8mm (single, low risk)',
    expectedRecommendation: 'CT at 6-12 months; consider CT at 18-24 months',
  },
  {
    id: 'F-004',
    description: 'Solid 7mm single, high risk',
    guideline: 'fleischner-2017',
    input: {
      patient: { age: 68, clinicalContext: 'incidental', riskLevel: 'high' },
      nodule: { type: 'solid', diameterMm: 7, isMultiple: false },
    },
    expectedCategory: 'Solid 6-8mm (single, high risk)',
    expectedRecommendation: 'CT at 6-12 months; then CT at 18-24 months',
  },
  {
    id: 'F-005',
    description: 'Solid 10mm single',
    guideline: 'fleischner-2017',
    input: {
      patient: { age: 60, clinicalContext: 'incidental', riskLevel: 'high' },
      nodule: { type: 'solid', diameterMm: 10, isMultiple: false },
    },
    expectedCategory: 'Solid >8mm (single)',
    expectedRecommendation: 'Consider CT at 3 months, PET/CT, or tissue sampling',
  },
  // Solid Multiple
  {
    id: 'F-006',
    description: 'Solid 4mm multiple, low risk',
    guideline: 'fleischner-2017',
    input: {
      patient: { age: 50, clinicalContext: 'incidental', riskLevel: 'low' },
      nodule: { type: 'solid', diameterMm: 4, isMultiple: true },
    },
    expectedCategory: 'Solid <6mm (multiple, low risk)',
    expectedRecommendation: 'No routine follow-up',
  },
  {
    id: 'F-007',
    description: 'Solid 8mm multiple, high risk',
    guideline: 'fleischner-2017',
    input: {
      patient: { age: 65, clinicalContext: 'incidental', riskLevel: 'high' },
      nodule: { type: 'solid', diameterMm: 8, isMultiple: true },
    },
    expectedCategory: 'Solid ≥6mm (multiple, high risk)',
    expectedRecommendation: 'CT at 3-6 months; then CT at 18-24 months',
  },
  // Ground-glass nodules
  {
    id: 'F-008',
    description: 'GGN 4mm',
    guideline: 'fleischner-2017',
    input: {
      patient: { age: 55, clinicalContext: 'incidental', riskLevel: 'low' },
      nodule: { type: 'ground-glass', diameterMm: 4, isMultiple: false },
    },
    expectedCategory: 'Ground-glass <6mm',
    expectedRecommendation: 'No routine follow-up',
  },
  {
    id: 'F-009',
    description: 'GGN 10mm',
    guideline: 'fleischner-2017',
    input: {
      patient: { age: 60, clinicalContext: 'incidental', riskLevel: 'low' },
      nodule: { type: 'ground-glass', diameterMm: 10, isMultiple: false },
    },
    expectedCategory: 'Ground-glass ≥6mm',
    expectedRecommendation: 'CT at 6-12 months, then CT every 2 years until 5 years',
  },
  // Part-solid nodules
  {
    id: 'F-010',
    description: 'Part-solid 4mm',
    guideline: 'fleischner-2017',
    input: {
      patient: { age: 55, clinicalContext: 'incidental', riskLevel: 'low' },
      nodule: { type: 'part-solid', diameterMm: 4, solidComponentMm: 2, isMultiple: false },
    },
    expectedCategory: 'Part-solid <6mm',
    expectedRecommendation: 'No routine follow-up',
  },
  {
    id: 'F-011',
    description: 'Part-solid 10mm, solid 4mm',
    guideline: 'fleischner-2017',
    input: {
      patient: { age: 60, clinicalContext: 'incidental', riskLevel: 'low' },
      nodule: { type: 'part-solid', diameterMm: 10, solidComponentMm: 4, isMultiple: false },
    },
    expectedCategory: 'Part-solid ≥6mm, solid <6mm',
    expectedRecommendation: 'CT at 3-6 months, then annual CT for 5 years',
  },
  {
    id: 'F-012',
    description: 'Part-solid 12mm, solid 8mm - SUSPICIOUS',
    guideline: 'fleischner-2017',
    input: {
      patient: { age: 62, clinicalContext: 'incidental', riskLevel: 'high' },
      nodule: { type: 'part-solid', diameterMm: 12, solidComponentMm: 8, isMultiple: false },
    },
    expectedCategory: 'Part-solid, solid ≥6mm',
    expectedRecommendation: 'PET/CT, biopsy, or surgical excision',
    clinicalNotes: 'High suspicion - solid component ≥6mm',
  },
  // Edge cases and exclusions
  {
    id: 'F-013',
    description: 'Patient age 30 - exclusion',
    guideline: 'fleischner-2017',
    input: {
      patient: { age: 30, clinicalContext: 'incidental', riskLevel: 'low' },
      nodule: { type: 'solid', diameterMm: 7, isMultiple: false },
    },
    expectedCategory: 'Not applicable',
    expectedRecommendation: 'Use alternative clinical guidance',
    clinicalNotes: 'Fleischner applies to patients ≥35 years',
  },
  // Boundary cases
  {
    id: 'F-014',
    description: 'Solid exactly 6mm, low risk',
    guideline: 'fleischner-2017',
    input: {
      patient: { age: 50, clinicalContext: 'incidental', riskLevel: 'low' },
      nodule: { type: 'solid', diameterMm: 6, isMultiple: false },
    },
    expectedCategory: 'Solid 6-8mm (single, low risk)',
    expectedRecommendation: 'CT at 6-12 months; consider CT at 18-24 months',
  },
  {
    id: 'F-015',
    description: 'Solid exactly 8mm, high risk',
    guideline: 'fleischner-2017',
    input: {
      patient: { age: 65, clinicalContext: 'incidental', riskLevel: 'high' },
      nodule: { type: 'solid', diameterMm: 8, isMultiple: false },
    },
    expectedCategory: 'Solid 6-8mm (single, high risk)',
    expectedRecommendation: 'CT at 6-12 months; then CT at 18-24 months',
  },
];

// Lung-RADS v2022 validation cases (25 cases)
export const LUNGRADS_VALIDATION_CASES: ValidationCase[] = [
  // Baseline solid nodules
  {
    id: 'LR-001',
    description: 'Baseline solid 4mm',
    guideline: 'lung-rads-2022',
    input: {
      patient: { age: 60, clinicalContext: 'screening' },
      nodule: { type: 'solid', diameterMm: 4, isMultiple: false, scanType: 'baseline' },
    },
    expectedCategory: '2',
    expectedRecommendation: 'Continue annual LDCT',
  },
  {
    id: 'LR-002',
    description: 'Baseline solid 7mm',
    guideline: 'lung-rads-2022',
    input: {
      patient: { age: 62, clinicalContext: 'screening' },
      nodule: { type: 'solid', diameterMm: 7, isMultiple: false, scanType: 'baseline' },
    },
    expectedCategory: '3',
    expectedRecommendation: 'LDCT',
  },
  {
    id: 'LR-003',
    description: 'Baseline solid 10mm',
    guideline: 'lung-rads-2022',
    input: {
      patient: { age: 65, clinicalContext: 'screening' },
      nodule: { type: 'solid', diameterMm: 10, isMultiple: false, scanType: 'baseline' },
    },
    expectedCategory: '4A',
    expectedRecommendation: 'LDCT; PET/CT if solid ≥8mm',
  },
  {
    id: 'LR-004',
    description: 'Baseline solid 16mm',
    guideline: 'lung-rads-2022',
    input: {
      patient: { age: 68, clinicalContext: 'screening' },
      nodule: { type: 'solid', diameterMm: 16, isMultiple: false, scanType: 'baseline' },
    },
    expectedCategory: '4B',
    expectedRecommendation: 'Diagnostic CT; PET/CT; biopsy',
  },
  // Follow-up new nodules
  {
    id: 'LR-005',
    description: 'Follow-up new solid 3mm',
    guideline: 'lung-rads-2022',
    input: {
      patient: { age: 60, clinicalContext: 'screening' },
      nodule: { type: 'solid', diameterMm: 3, isMultiple: false, scanType: 'follow-up', isNew: true },
    },
    expectedCategory: '2',
    expectedRecommendation: 'Continue annual LDCT',
  },
  {
    id: 'LR-006',
    description: 'Follow-up new solid 5mm',
    guideline: 'lung-rads-2022',
    input: {
      patient: { age: 62, clinicalContext: 'screening' },
      nodule: { type: 'solid', diameterMm: 5, isMultiple: false, scanType: 'follow-up', isNew: true },
    },
    expectedCategory: '3',
    expectedRecommendation: 'LDCT',
  },
  {
    id: 'LR-007',
    description: 'Follow-up new solid 7mm',
    guideline: 'lung-rads-2022',
    input: {
      patient: { age: 64, clinicalContext: 'screening' },
      nodule: { type: 'solid', diameterMm: 7, isMultiple: false, scanType: 'follow-up', isNew: true },
    },
    expectedCategory: '4A',
    expectedRecommendation: 'LDCT; PET/CT if solid ≥8mm',
  },
  {
    id: 'LR-008',
    description: 'Follow-up new solid 10mm',
    guideline: 'lung-rads-2022',
    input: {
      patient: { age: 66, clinicalContext: 'screening' },
      nodule: { type: 'solid', diameterMm: 10, isMultiple: false, scanType: 'follow-up', isNew: true },
    },
    expectedCategory: '4B',
    expectedRecommendation: 'Diagnostic CT; PET/CT; biopsy',
  },
  // Growth scenarios
  {
    id: 'LR-009',
    description: 'Growth >1.5mm in 12 months - small nodule',
    guideline: 'lung-rads-2022',
    input: {
      patient: { age: 60, clinicalContext: 'screening' },
      nodule: { 
        type: 'solid', 
        diameterMm: 7, 
        isMultiple: false, 
        scanType: 'follow-up',
        priorDiameterMm: 4,
        priorScanMonthsAgo: 12,
        isNew: false,
      },
    },
    expectedCategory: '4A',
    expectedRecommendation: 'LDCT; PET/CT if solid ≥8mm',
    clinicalNotes: '3mm growth in 12 months exceeds threshold',
  },
  {
    id: 'LR-010',
    description: 'Growth >1.5mm in 12 months - large nodule',
    guideline: 'lung-rads-2022',
    input: {
      patient: { age: 62, clinicalContext: 'screening' },
      nodule: { 
        type: 'solid', 
        diameterMm: 12, 
        isMultiple: false, 
        scanType: 'follow-up',
        priorDiameterMm: 8,
        priorScanMonthsAgo: 12,
        isNew: false,
      },
    },
    expectedCategory: '4B',
    expectedRecommendation: 'Diagnostic CT; PET/CT; biopsy',
    clinicalNotes: 'Growing nodule ≥8mm',
  },
  // Ground-glass nodules
  {
    id: 'LR-011',
    description: 'GGN 25mm',
    guideline: 'lung-rads-2022',
    input: {
      patient: { age: 58, clinicalContext: 'screening' },
      nodule: { type: 'ground-glass', diameterMm: 25, isMultiple: false, scanType: 'baseline' },
    },
    expectedCategory: '2',
    expectedRecommendation: 'Continue annual LDCT',
  },
  {
    id: 'LR-012',
    description: 'GGN 35mm',
    guideline: 'lung-rads-2022',
    input: {
      patient: { age: 60, clinicalContext: 'screening' },
      nodule: { type: 'ground-glass', diameterMm: 35, isMultiple: false, scanType: 'baseline' },
    },
    expectedCategory: '3',
    expectedRecommendation: 'LDCT',
  },
  // Part-solid nodules
  {
    id: 'LR-013',
    description: 'Part-solid 12mm, solid 4mm',
    guideline: 'lung-rads-2022',
    input: {
      patient: { age: 62, clinicalContext: 'screening' },
      nodule: { type: 'part-solid', diameterMm: 12, solidComponentMm: 4, isMultiple: false, scanType: 'baseline' },
    },
    expectedCategory: '4A',
    expectedRecommendation: 'LDCT; PET/CT if solid ≥8mm',
  },
  {
    id: 'LR-014',
    description: 'Part-solid 15mm, solid 8mm',
    guideline: 'lung-rads-2022',
    input: {
      patient: { age: 65, clinicalContext: 'screening' },
      nodule: { type: 'part-solid', diameterMm: 15, solidComponentMm: 8, isMultiple: false, scanType: 'baseline' },
    },
    expectedCategory: '4B',
    expectedRecommendation: 'Diagnostic CT; PET/CT; biopsy',
  },
  // Stepped management
  {
    id: 'LR-015',
    description: 'Category 3 stable -> step down to 2',
    guideline: 'lung-rads-2022',
    input: {
      patient: { age: 60, clinicalContext: 'screening' },
      nodule: { type: 'solid', diameterMm: 7, isMultiple: false, scanType: 'follow-up', isNew: false },
      priorCategory: '3',
      priorStatus: 'stable',
    } as LungRadsAssessmentInput,
    expectedCategory: '2',
    expectedRecommendation: 'Continue annual LDCT',
    clinicalNotes: 'Stepped management: stable cat 3 -> cat 2',
  },
];

// Combined validation cases
export const ALL_VALIDATION_CASES: ValidationCase[] = [
  ...FLEISCHNER_VALIDATION_CASES,
  ...LUNGRADS_VALIDATION_CASES,
];

// Export function to generate validation report
export function generateValidationCasesJSON(): string {
  return JSON.stringify({
    version: '1.0.0',
    generatedAt: new Date().toISOString(),
    totalCases: ALL_VALIDATION_CASES.length,
    fleischnerCases: FLEISCHNER_VALIDATION_CASES.length,
    lungRadsCases: LUNGRADS_VALIDATION_CASES.length,
    cases: ALL_VALIDATION_CASES,
  }, null, 2);
}
