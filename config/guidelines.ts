export const GUIDELINE_VERSIONS = {
  fleischner: {
    id: 'fleischner-2017',
    label: 'Fleischner Society 2017',
    version: '2017',
  },
  lungRads: {
    id: 'lung-rads-2022',
    label: 'Lung-RADS v2022',
    version: '2022',
  },
};

export const RISK_FACTOR_TOOLTIP = `HIGH RISK Factors (any of):
• Age >65 years
• Heavy smoking history (≥30 pack-years)
• Current smoker or quit <15 years ago
• Family history of lung cancer
• Emphysema or pulmonary fibrosis on imaging
• Known carcinogen exposure (asbestos, radon, uranium)

LOW RISK: Absence of above factors, younger age, minimal/no smoking`;

export const LUNGRADS_MANAGEMENT = {
  '0': { timing: '1-3 months', recommendation: 'Additional imaging or LDCT' },
  '1': { timing: '12 months', recommendation: 'Continue annual LDCT' },
  '2': { timing: '12 months', recommendation: 'Continue annual LDCT' },
  '3': { timing: '6 months', recommendation: 'LDCT' },
  '4A': { timing: '3 months', recommendation: 'LDCT; PET/CT if solid ≥8mm' },
  '4B': { timing: 'As indicated', recommendation: 'Diagnostic CT; PET/CT; biopsy' },
  '4X': { timing: 'As indicated', recommendation: 'Diagnostic CT; PET/CT; biopsy; consider multidisciplinary review' },
} as const;
