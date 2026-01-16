export type ClinicalContext = 'incidental' | 'screening';
export type NoduleType = 'solid' | 'ground-glass' | 'part-solid';
export type RiskLevel = 'low' | 'high';
export type ScanType = 'baseline' | 'follow-up';

export interface PatientProfile {
  age: number;
  riskLevel?: RiskLevel; // Only for Fleischner
  clinicalContext: ClinicalContext;
  hasKnownMalignancy?: boolean;
  isImmunocompromised?: boolean;
}

export interface NoduleCharacteristics {
  type: NoduleType;
  diameterMm: number;
  solidComponentMm?: number;
  isMultiple: boolean;
  isPerifissural?: boolean;
  hasSpiculation?: boolean;
  isJuxtapleural?: boolean;
  isAirway?: boolean;
  isAtypicalCyst?: boolean;
  isBenign?: boolean;
  hasSignificantFinding?: boolean;
  isInflammatory?: boolean;
  inflammatoryCategory?: 'category0' | 'category2';
  airwayLocation?: 'subsegmental' | 'segmental-proximal';
  airwayPersistent?: boolean;
  atypicalCystCategory?: 'category3' | 'category4A' | 'category4B';
  isNew?: boolean;
}

export interface LungRADSInput extends NoduleCharacteristics {
  scanType: ScanType;
  priorDiameterMm?: number;
  priorScanMonthsAgo?: number;
}

export type GuidelineId = 'fleischner-2017' | 'lung-rads-2022';

export interface AssessmentResult {
  guideline: GuidelineId;
  category: string;
  recommendation: string;
  followUpInterval: string;
  imagingModality?: string;
  malignancyRisk?: string;
  rationale: string;
  warnings?: string[];
}

export interface ApplicabilityResult {
  applicable: boolean;
  reason?: string;
}

export interface FleischnerAssessmentInput {
  patient: PatientProfile;
  nodule: NoduleCharacteristics;
}

export interface LungRadsAssessmentInput {
  patient: PatientProfile;
  nodule: LungRADSInput;
  priorCategory?: string;
  priorStatus?: 'stable' | 'progression';
}
