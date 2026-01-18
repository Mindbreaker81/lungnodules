// =============================================================================
// GUIDELINE VERSIONS & METADATA
// =============================================================================

export const GUIDELINE_VERSIONS = {
  fleischner: {
    id: 'fleischner-2017',
    label: 'Fleischner Society 2017',
    version: '2017',
    citation: 'MacMahon H, et al. Radiology 2017;284(1):228-243',
    doi: '10.1148/radiol.2017161659',
  },
  lungRads: {
    id: 'lung-rads-2022',
    label: 'Lung-RADS v2022',
    version: '2022',
    citation: 'American College of Radiology. Lung-RADS v2022',
    url: 'https://www.acr.org/Clinical-Resources/Reporting-and-Data-Systems/Lung-Rads',
  },
} as const;

export const APP_VERSION = '1.0.0';

// =============================================================================
// CLINICAL THRESHOLDS
// =============================================================================

export const THRESHOLDS = {
  fleischner: {
    minAge: 35,
    smallNodule: 6, // mm
    mediumNodule: 8, // mm
    largeNodule: 8, // mm (>8mm triggers aggressive workup)
    solidComponentSuspicious: 6, // mm (part-solid)
  },
  lungRads: {
    baseline: {
      category2Max: 6, // <6mm
      category3Max: 8, // 6-<8mm
      category4AMax: 15, // 8-<15mm
      category4BMin: 15, // ≥15mm
    },
    followUpNew: {
      category2Max: 4, // <4mm
      category3Max: 6, // 4-<6mm
      category4AMax: 8, // 6-<8mm
      category4BMin: 8, // ≥8mm
    },
    growthThresholdMmPer12m: 1.5,
    ggnThreshold: 30, // mm for category 3
    partSolidSuspiciousComponent: 6, // mm
  },
} as const;

// =============================================================================
// RISK FACTORS
// =============================================================================

export const RISK_FACTOR_TOOLTIP = `FACTORES DE ALTO RIESGO (cualquiera):
• Edad >65 años
• Tabaquismo intenso (≥30 paquetes-año)
• Fumador actual o dejó hace <15 años
• Antecedentes familiares de cáncer de pulmón
• Enfisema o fibrosis pulmonar en imagen
• Exposición a carcinógenos conocidos (asbesto, radón, uranio)

RIESGO BAJO: ausencia de los factores anteriores, menor edad, tabaquismo mínimo o nulo`;

export const RISK_FACTORS = {
  high: [
    { id: 'age65', label: 'Edad >65 años' },
    { id: 'smoking30', label: 'Tabaquismo intenso (≥30 paquetes-año)' },
    { id: 'currentSmoker', label: 'Fumador actual o dejó hace <15 años' },
    { id: 'familyHistory', label: 'Antecedentes familiares de cáncer de pulmón' },
    { id: 'emphysema', label: 'Enfisema o fibrosis pulmonar en imagen' },
    { id: 'carcinogenExposure', label: 'Exposición a carcinógenos conocidos (asbesto, radón, uranio)' },
  ],
  morphologic: [
    { id: 'spiculation', label: 'Márgenes espiculados' },
    { id: 'upperLobe', label: 'Localización en lóbulo superior' },
    { id: 'partSolid', label: 'Morfología parte-sólida' },
    { id: 'growing', label: 'Nódulo en crecimiento' },
  ],
} as const;

// =============================================================================
// LUNG-RADS CATEGORY DEFINITIONS
// =============================================================================

export const LUNGRADS_CATEGORIES = {
  '0': {
    name: 'Incomplete',
    description: 'Prior CT not available or incomplete exam',
    malignancyProbability: 'N/A',
    color: 'gray',
  },
  '1': {
    name: 'Negative',
    description: 'No pulmonary nodules or definitely benign nodules',
    malignancyProbability: '<1%',
    color: 'green',
  },
  '2': {
    name: 'Benign Appearance',
    description: 'Nodules with a very low likelihood of becoming clinically active cancer',
    malignancyProbability: '<1%',
    color: 'green',
  },
  '3': {
    name: 'Probably Benign',
    description: 'Probably benign finding; short-term follow-up suggested',
    malignancyProbability: '1-2%',
    color: 'yellow',
  },
  '4A': {
    name: 'Suspicious',
    description: 'Finding for which additional diagnostic testing is recommended',
    malignancyProbability: '5-15%',
    color: 'orange',
  },
  '4B': {
    name: 'Very Suspicious',
    description: 'Finding for which tissue sampling or surgical excision is recommended',
    malignancyProbability: '>15%',
    color: 'red',
  },
  '4X': {
    name: 'Very Suspicious with Additional Features',
    description: 'Category 3 or 4 nodule with additional features suspicious for malignancy',
    malignancyProbability: 'Variable, higher concern',
    color: 'red',
  },
  'S': {
    name: 'Significant Findings',
    description: 'Clinically significant or potentially significant findings unrelated to lung cancer',
    malignancyProbability: 'Variable',
    color: 'gray',
  },
} as const;

export const LUNGRADS_MANAGEMENT = {
  '0': { timing: '1-3 months', recommendation: 'Additional imaging or LDCT', modality: 'LDCT' },
  '1': { timing: '12 months', recommendation: 'Continue annual LDCT', modality: 'LDCT' },
  '2': { timing: '12 months', recommendation: 'Continue annual LDCT', modality: 'LDCT' },
  '3': { timing: '6 months', recommendation: 'LDCT', modality: 'LDCT' },
  '4A': { timing: '3 months', recommendation: 'LDCT; PET/CT if solid ≥8mm', modality: 'LDCT or PET/CT' },
  '4B': { timing: 'As indicated', recommendation: 'Diagnostic CT; PET/CT; biopsy', modality: 'CT/PET/Biopsy' },
  '4X': { timing: 'As indicated', recommendation: 'Diagnostic CT; PET/CT; biopsy; consider multidisciplinary review', modality: 'CT/PET/Biopsy/MDT' },
  'S': { timing: 'As indicated', recommendation: 'Manage significant findings per clinical judgment', modality: 'As indicated' },
} as const;

// =============================================================================
// FLEISCHNER MANAGEMENT TABLES
// =============================================================================

export const FLEISCHNER_SOLID_SINGLE = {
  '<6mm': {
    low: { followUp: 'None', recommendation: 'No routine follow-up', rationale: 'Malignancy risk <1%' },
    high: { followUp: '12 months (optional)', recommendation: 'Optional CT at 12 months', rationale: 'Consider if suspicious morphology' },
  },
  '6-8mm': {
    low: { followUp: '6-12 months', recommendation: 'CT at 6-12 months; consider CT at 18-24 months', rationale: 'Malignancy risk 0.5-2%' },
    high: { followUp: '6-12 months; then 18-24 months', recommendation: 'CT at 6-12 months; then CT at 18-24 months', rationale: 'Two scans to establish stability' },
  },
  '>8mm': {
    low: { followUp: '3 months or as indicated', recommendation: 'Consider CT at 3 months, PET/CT, or tissue sampling', rationale: 'Malignancy risk ~3%', malignancyRisk: '~3%' },
    high: { followUp: '3 months or as indicated', recommendation: 'Consider CT at 3 months, PET/CT, or tissue sampling', rationale: 'Larger solid nodules merit aggressive evaluation', malignancyRisk: '~3%' },
  },
} as const;

export const FLEISCHNER_SOLID_MULTIPLE = {
  '<6mm': {
    low: { followUp: 'None', recommendation: 'No routine follow-up', rationale: 'Very low malignancy risk' },
    high: { followUp: '12 months (optional)', recommendation: 'Optional CT at 12 months', rationale: 'Consider if suspicious morphology' },
  },
  '≥6mm': {
    low: { followUp: '3-6 months; consider 18-24 months', recommendation: 'CT at 3-6 months; consider CT at 18-24 months', rationale: 'Multiple nodules need short-term follow-up' },
    high: { followUp: '3-6 months; then 18-24 months', recommendation: 'CT at 3-6 months; then CT at 18-24 months', rationale: 'High-risk patients need two follow-up scans' },
  },
} as const;

export const FLEISCHNER_SUBSOLID = {
  ggn: {
    '<6mm': { followUp: 'None', recommendation: 'No routine follow-up', rationale: 'Very low malignancy risk; avoid overtreatment' },
    '≥6mm': { followUp: '6-12 months; then q2y until 5y', recommendation: 'CT at 6-12 months, then CT every 2 years until 5 years', rationale: 'Persistent GGNs ≥6mm warrant surveillance' },
  },
  partSolid: {
    '<6mm': { followUp: 'None', recommendation: 'No routine follow-up', rationale: 'Small part-solid nodules rarely malignant' },
    '≥6mm_solid<6mm': { followUp: '3-6 months; then annual x 5y', recommendation: 'CT at 3-6 months, then annual CT for 5 years', rationale: 'Risk rises with persistence; annual surveillance advised' },
    '≥6mm_solid≥6mm': { followUp: 'As indicated', recommendation: 'PET/CT, biopsy, or surgical excision', rationale: 'Solid component ≥6mm is highly suspicious', malignancyRisk: 'High suspicion', warning: 'HIGHLY SUSPICIOUS — consider tissue diagnosis' },
  },
} as const;

// =============================================================================
// DISCLAIMERS & LEGAL
// =============================================================================

export const DISCLAIMERS = {
  general: `This tool provides decision support based on published clinical guidelines. 
It does not replace clinical judgment or the physician-patient relationship. 
Always consider the complete clinical picture when making management decisions.`,
  
  fleischner: `Fleischner Society guidelines apply to incidental pulmonary nodules in patients ≥35 years 
without known malignancy or immunocompromise. They are not intended for lung cancer screening populations.`,
  
  lungRads: `Lung-RADS is designed for lung cancer screening programs in high-risk populations. 
It should not be applied to incidentally detected nodules or non-screening populations.`,
  
  export: `CLINICAL DECISION SUPPORT OUTPUT
Generated by Lung Nodule Follow-Up Decision Support Tool v${APP_VERSION}
Guidelines: Fleischner Society 2017 / Lung-RADS v2022

DISCLAIMER: This output is for informational purposes only and does not constitute medical advice. 
Clinical decisions should be made by qualified healthcare professionals considering all relevant patient factors.`,
} as const;

// =============================================================================
// UI CONSTANTS
// =============================================================================

export const UI_COLORS = {
  categories: {
    benign: '#10B981', // green
    probablyBenign: '#F59E0B', // amber
    suspicious: '#F97316', // orange
    verySuspicious: '#EF4444', // red
    notApplicable: '#6B7280', // gray
  },
  risk: {
    low: '#10B981',
    high: '#EF4444',
  },
} as const;

export const NODULE_TYPE_LABELS = {
  solid: 'Solid',
  'ground-glass': 'Ground-Glass (GGN)',
  'part-solid': 'Part-Solid',
} as const;

export const SCAN_TYPE_LABELS = {
  baseline: 'Baseline (first LDCT screening)',
  'follow-up': 'Follow-up (prior LDCT available)',
} as const;

export const CONTEXT_LABELS = {
  incidental: 'Incidental Finding (Fleischner)',
  screening: 'Lung Cancer Screening (Lung-RADS)',
} as const;

// =============================================================================
// VALIDATION CONSTRAINTS
// =============================================================================

export const VALIDATION = {
  diameter: {
    min: 1,
    max: 100,
    step: 0.1,
  },
  solidComponent: {
    min: 0,
    max: 100,
    step: 0.1,
  },
  age: {
    min: 18,
    max: 120,
    fleischnerMin: 35,
  },
  priorScanMonths: {
    min: 1,
    max: 120,
  },
} as const;
