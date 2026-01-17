export type ClinicalContext = 'incidental' | 'screening';
export type NoduleType = 'solid' | 'ground-glass' | 'part-solid';
export type RiskLevel = 'low' | 'high';
export type ScanType = 'baseline' | 'follow-up';
export type Sex = 'female' | 'male';
export type SmokingStatus = 'never' | 'former' | 'current';
export type ExtrathoracicCancerHistory = 'none' | 'over5y' | 'recent';
export type PetUptake = 'absent' | 'faint' | 'moderate' | 'intense';

export interface PatientProfile {
  age: number;
  riskLevel?: RiskLevel; // Only for Fleischner
  clinicalContext: ClinicalContext;
  hasKnownMalignancy?: boolean;
  isImmunocompromised?: boolean;
  sex?: Sex;
  smokingStatus?: SmokingStatus;
  extrathoracicCancerHistory?: ExtrathoracicCancerHistory;
  hasFamilyHistoryLungCancer?: boolean;
  hasEmphysema?: boolean;
}

export interface NoduleCharacteristics {
  type: NoduleType;
  diameterMm: number;
  solidComponentMm?: number;
  isMultiple: boolean;
  isPerifissural?: boolean;
  hasSpiculation?: boolean;
  isUpperLobe?: boolean;
  noduleCount?: number;
  hasPet?: boolean;
  petUptake?: PetUptake;
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
