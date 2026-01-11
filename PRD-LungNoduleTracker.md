# Product Requirements Document (PRD)
# Lung Nodule Follow-Up Decision Support Tool

**Version:** 1.0  
**Date:** January 2026  
**Author:** Clinical Decision Support Team  
**Status:** Draft for Development Review

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Product Vision & Goals](#2-product-vision--goals)
3. [User Personas & User Stories](#3-user-personas--user-stories)
4. [Functional Requirements](#4-functional-requirements)
5. [Non-Functional Requirements](#5-non-functional-requirements)
6. [User Interface/UX Requirements](#6-user-interfaceux-requirements)
7. [Technical Architecture](#7-technical-architecture)
8. [Algorithm Logic](#8-algorithm-logic)
9. [Testing & Validation Strategy](#9-testing--validation-strategy)
10. [Deployment Strategy](#10-deployment-strategy)
11. [Success Metrics](#11-success-metrics)
12. [Risks & Mitigations](#12-risks--mitigations)
13. [Timeline & Milestones](#13-timeline--milestones)
14. [Appendix](#14-appendix)

---

## 1. Executive Summary

### 1.1 Problem Statement

Pulmonary nodules are frequent findings in clinical practice. Between 2006 and 2012, over 4.8 million individuals underwent at least one chest CT, identifying more than 1.5 million nodules. Critically, **51% of indicated follow-up examinations are not obtained**, potentially leading to untreated cancers progressing to inoperable stages.

Two primary guideline systems exist for nodule management:
- **Fleischner Society Guidelines (2017)**: For incidental findings in general population
- **Lung-RADS v2022**: For lung cancer screening programs

Clinicians must navigate complex decision trees considering nodule size, morphology, patient risk factors, and clinical context.

### 1.2 Proposed Solution

A web-based clinical decision support tool that:
- Accepts nodule characteristics and patient risk factors as input
- Automatically determines the appropriate guideline system (Fleischner vs. Lung-RADS)
- Calculates the corresponding category and follow-up recommendation
- Provides clear, actionable guidance with supporting rationale

### 1.3 Key Benefits

| Benefit | Description |
|---------|-------------|
| **Reduced Decision Time** | Instant categorization vs. manual guideline lookup |
| **Improved Adherence** | Clear recommendations reduce missed follow-ups |
| **Standardization** | Consistent application of guidelines across practitioners |
| **Education** | Provides rationale, helping clinicians learn the guidelines |
| **Accessibility** | Browser-based, no installation required |

### 1.4 Scope

**In Scope:**
- Fleischner Society 2017 guidelines implementation
- Lung-RADS v2022 assessment categories implementation
- Solid, sub-solid (ground-glass), and part-solid nodule classification
- Single and multiple nodule scenarios
- Risk stratification (low/high risk)
- PWA capability for offline access

**Out of Scope:**
- Patient data storage/persistence
- EHR/PACS integration
- Image analysis or measurement automation
- Pediatric nodules (patients <35 years)
- Immunocompromised patient management
- Known malignancy scenarios

---

## 2. Product Vision & Goals

### 2.1 Vision Statement

> *"To be the trusted, go-to digital companion for pulmonologists making lung nodule follow-up decisions, ensuring every patient receives guideline-concordant care."*

### 2.2 Strategic Goals

| Goal | Description | Success Indicator |
|------|-------------|-------------------|
| **G1** | Improve clinical decision accuracy | >95% agreement with expert panel decisions |
| **G2** | Reduce time to decision | <30 seconds from input to recommendation |
| **G3** | Increase guideline adherence | User surveys show >80% report improved adherence |
| **G4** | Broad accessibility | Support desktop and mobile, offline capability |

### 2.3 Design Principles

1. **Clinical Precision First**: Accuracy of recommendations is non-negotiable
2. **Simplicity Over Complexity**: Minimize cognitive load in a high-stakes environment
3. **Transparency**: Always show the reasoning behind recommendations
4. **Defensive Design**: Guide users away from errors, validate all inputs
5. **Accessibility**: Work on any device, any network condition

---

## 3. User Personas & User Stories

### 3.1 Primary Persona: Dr. María García (Pulmonologist)

| Attribute | Description |
|-----------|-------------|
| **Role** | Staff Pulmonologist, Hospital General |
| **Experience** | 12 years in pulmonology |
| **Context** | Sees 25-30 patients/day, reviews CT reports |
| **Pain Points** | Time pressure, guideline complexity, keeping up with updates |
| **Goals** | Quick, reliable recommendations; document rationale |
| **Tech Comfort** | Moderate; uses smartphone and desktop |

### 3.2 Secondary Persona: Dr. Carlos Méndez (Radiology Resident)

| Attribute | Description |
|-----------|-------------|
| **Role** | Radiology Resident (R3) |
| **Experience** | 3 years in training |
| **Context** | Interprets chest CTs, needs to apply correct guidelines |
| **Pain Points** | Uncertainty about which system to apply, edge cases |
| **Goals** | Learn guidelines, avoid errors in reports |
| **Tech Comfort** | High; prefers mobile access |

### 3.3 User Stories

#### Epic 1: Nodule Assessment

| ID | User Story | Priority |
|----|------------|----------|
| US-1.1 | As a pulmonologist, I want to select the clinical context (incidental vs. screening) so the correct guideline is applied | P0 |
| US-1.2 | As a pulmonologist, I want to input nodule size in mm so the system can categorize appropriately | P0 |
| US-1.3 | As a pulmonologist, I want to specify nodule type (solid/GGN/part-solid) so correct criteria are applied | P0 |
| US-1.4 | As a pulmonologist, I want to indicate single vs. multiple nodules so the system handles appropriately | P0 |
| US-1.5 | As a pulmonologist, I want to input my patient's risk factors so the recommendation is personalized | P0 |

#### Epic 2: Results & Recommendations

| ID | User Story | Priority |
|----|------------|----------|
| US-2.1 | As a pulmonologist, I want to see the assigned category clearly displayed | P0 |
| US-2.2 | As a pulmonologist, I want specific follow-up timing and study type | P0 |
| US-2.3 | As a pulmonologist, I want to understand why this recommendation was made | P1 |
| US-2.4 | As a pulmonologist, I want to copy/export the recommendation for documentation | P1 |

#### Epic 3: Usability & Access

| ID | User Story | Priority |
|----|------------|----------|
| US-3.1 | As a clinician, I want to use this on my phone during rounds | P0 |
| US-3.2 | As a clinician in a rural area, I want offline access | P1 |
| US-3.3 | As a new user, I want guided input so I don't make errors | P0 |

---

## 4. Functional Requirements

### 4.1 Input Module

#### FR-1: Clinical Context Selection

| Requirement | Specification |
|-------------|---------------|
| **FR-1.1** | System SHALL present binary choice: "Incidental Finding" vs. "Lung Cancer Screening" |
| **FR-1.2** | "Incidental Finding" selection SHALL trigger Fleischner 2017 algorithm |
| **FR-1.3** | "Lung Cancer Screening" selection SHALL trigger Lung-RADS v2022 algorithm |

#### FR-2: Patient Information

| Requirement | Specification |
|-------------|---------------|
| **FR-2.1** | System SHALL collect age confirmation (≥35 years for Fleischner applicability) |
| **FR-2.2** | For Fleischner: System SHALL collect risk level (Low Risk / High Risk) |
| **FR-2.3** | System SHALL provide tooltip explaining risk factors for stratification |

**Risk Factor Guidance:**

```
HIGH RISK Factors (any of):
• Age >65 years
• Heavy smoking history (≥30 pack-years)
• Current smoker or quit <15 years ago
• Family history of lung cancer
• Emphysema or pulmonary fibrosis on imaging
• Known carcinogen exposure (asbestos, radon, uranium)

LOW RISK: Absence of above factors, younger age, minimal/no smoking
```

#### FR-3: Nodule Characteristics

| Requirement | Specification |
|-------------|---------------|
| **FR-3.1** | System SHALL collect nodule type: Solid / Ground-Glass (GGN) / Part-Solid |
| **FR-3.2** | System SHALL collect average diameter in mm (mean of long and short axis) |
| **FR-3.3** | For Part-Solid: System SHALL collect solid component size separately |
| **FR-3.4** | System SHALL collect nodule count: Single / Multiple |
| **FR-3.5** | For multiple nodules: System SHALL instruct user to enter dominant (most suspicious) nodule |

**Input Validation Rules:**

| Field | Validation | Error Message |
|-------|------------|---------------|
| Diameter | 1-100 mm, numeric, 1 decimal | "Enter diameter between 1-100 mm" |
| Solid component | ≤ Total diameter | "Solid component cannot exceed total diameter" |
| Age | ≥35 for Fleischner | "Fleischner guidelines apply to patients ≥35 years" |

#### FR-4: Lung-RADS Specific Inputs

| Requirement | Specification |
|-------------|---------------|
| **FR-4.1** | System SHALL collect whether this is baseline or follow-up scan |
| **FR-4.2** | For follow-up: System SHALL collect prior nodule size for growth calculation |
| **FR-4.3** | System SHALL calculate growth (>1.5mm in 12 months threshold) |
| **FR-4.4** | System SHALL collect special features: Juxtapleural / Airway nodule / Atypical cyst |

### 4.2 Processing Module

#### FR-6: Algorithm Selection

| Requirement | Specification |
|-------------|---------------|
| **FR-6.1** | System SHALL automatically select Fleischner or Lung-RADS based on clinical context |
| **FR-6.2** | System SHALL validate all inputs before processing |

#### FR-7: Category Calculation

| Requirement | Specification |
|-------------|---------------|
| **FR-7.1** | System SHALL implement complete Fleischner 2017 decision tree |
| **FR-7.2** | System SHALL implement complete Lung-RADS v2022 categories 0-4X, S |
| **FR-7.3** | System SHALL handle all edge cases defined in guidelines |
| **FR-7.4** | System SHALL apply stepped management rules for Lung-RADS reclassification |

### 4.3 Output Module

#### FR-9: Primary Recommendation Display

| Requirement | Specification |
|-------------|---------------|
| **FR-9.1** | System SHALL display category name prominently |
| **FR-9.2** | System SHALL display specific follow-up interval |
| **FR-9.3** | System SHALL display recommended imaging modality |
| **FR-9.4** | System SHALL display malignancy probability estimate when available |

#### FR-10: Exclusions & Warnings

| Requirement | Specification |
|-------------|---------------|
| **FR-10.1** | System SHALL display warning if patient may be excluded from guidelines |
| **FR-10.2** | Exclusion criteria: <35 years, immunocompromised, known cancer |

---

## 5. Non-Functional Requirements

### 5.1 Performance

| Requirement | Target |
|-------------|--------|
| Time from submission to recommendation | <500ms |
| Initial page load (FCP) | <1.5s |
| Time to Interactive | <2.5s |
| Lighthouse Performance Score | >90 |

### 5.2 Security & Privacy

| Requirement | Specification |
|-------------|---------------|
| **NFR-3.1** | NO patient identifiable information (PII) shall be collected |
| **NFR-3.2** | NO data shall be stored server-side |
| **NFR-3.3** | All connections SHALL use HTTPS |

### 5.3 Compatibility

| Requirement | Specification |
|-------------|---------------|
| Desktop browsers | Chrome, Firefox, Safari, Edge (latest 2 versions) |
| Mobile browsers | iOS Safari, Chrome for Android |
| Minimum viewport | 320px width |
| Accessibility | WCAG 2.1 Level AA compliance |

---

## 6. User Interface/UX Requirements

### 6.1 Design Philosophy

- **Medical Professional Context**: Clean, authoritative aesthetic
- **Minimal Cognitive Load**: One decision per screen in wizard flow
- **Trust Indicators**: Clear sourcing, version display, disclaimer visibility

### 6.2 Color Scheme

| Element | Color | Usage |
|---------|-------|-------|
| Primary | Deep Blue (#1E40AF) | Headers, primary buttons |
| Success | Emerald (#10B981) | Benign/low-risk indicators |
| Warning | Amber (#F59E0B) | Moderate risk |
| Danger | Red (#EF4444) | High suspicion |
| Background | Off-white (#F8FAFC) | Page background |

### 6.3 Wizard Flow Structure

**Step 1: Clinical Context** → Select Incidental vs. Screening  
**Step 2: Patient Risk** → Age, risk level (Fleischner) or scan type (Lung-RADS)  
**Step 3: Nodule Characteristics** → Type, size, count, special features  
**Step 4: Results** → Category, recommendation, rationale, disclaimer

### 6.4 Mobile Responsive Design

- Stack all elements vertically below 768px
- Touch targets minimum 44x44px
- Full-width buttons on mobile
- Bottom-fixed navigation on mobile wizard

---

## 7. Technical Architecture

### 7.1 Technology Stack

| Layer | Technology | Rationale |
|-------|------------|-----------|
| **Framework** | Next.js 14+ (App Router) | SSG/SSR flexibility, Vercel optimization |
| **Language** | TypeScript | Type safety critical for medical calculations |
| **Styling** | Tailwind CSS | Rapid responsive development |
| **UI Components** | shadcn/ui | Accessible, customizable, professional |
| **Form Handling** | React Hook Form | Performance, validation integration |
| **Validation** | Zod | Runtime type checking, schema validation |
| **Testing** | Jest + React Testing Library | Algorithm validation |
| **E2E Testing** | Playwright | Critical path testing |
| **Deployment** | Vercel | Serverless, edge functions, CDN |

### 7.2 Project Structure

```
lung-nodule-tracker/
├── app/
│   ├── layout.tsx
│   ├── page.tsx                    # Landing page
│   ├── assessment/
│   │   └── page.tsx                # Assessment wizard
├── components/
│   ├── ui/                         # shadcn/ui components
│   ├── wizard/
│   │   ├── WizardContainer.tsx
│   │   ├── ContextStep.tsx
│   │   ├── RiskStep.tsx
│   │   ├── NoduleStep.tsx
│   │   └── ResultsStep.tsx
├── lib/
│   ├── algorithms/
│   │   ├── fleischner.ts           # Fleischner 2017 logic
│   │   ├── lungRads.ts             # Lung-RADS v2022 logic
│   │   ├── types.ts                # Shared types
│   │   └── index.ts
│   ├── schemas/
│   │   └── noduleInput.ts          # Zod schemas
├── __tests__/
│   ├── algorithms/
│   │   ├── fleischner.test.ts
│   │   └── lungRads.test.ts
├── public/
│   └── manifest.json               # PWA manifest
└── config/
    └── guidelines.ts               # Externalized parameters
```

### 7.3 Core Data Types

```typescript
// lib/algorithms/types.ts

export type ClinicalContext = 'incidental' | 'screening';
export type NoduleType = 'solid' | 'ground-glass' | 'part-solid';
export type RiskLevel = 'low' | 'high';
export type ScanType = 'baseline' | 'follow-up';

export interface PatientProfile {
  age: number;
  riskLevel: RiskLevel;
  clinicalContext: ClinicalContext;
}

export interface NoduleCharacteristics {
  type: NoduleType;
  diameterMm: number;
  solidComponentMm?: number;
  isMultiple: boolean;
  isPerifissural?: boolean;
  hasSpiculation?: boolean;
}

export interface LungRADSInput extends NoduleCharacteristics {
  scanType: ScanType;
  priorDiameterMm?: number;
  priorScanMonthsAgo?: number;
}

export interface AssessmentResult {
  guideline: 'fleischner-2017' | 'lung-rads-2022';
  category: string;
  recommendation: string;
  followUpInterval: string;
  imagingModality: string;
  malignancyRisk?: string;
  rationale: string;
  warnings?: string[];
}
```

---

## 8. Algorithm Logic

### 8.1 Fleischner Society 2017 Guidelines

#### 8.1.1 Applicability Check

```
FUNCTION checkFleischnerApplicability(patient):
    IF patient.age < 35:
        RETURN {applicable: false, reason: "Patient <35 years"}
    IF patient.hasKnownMalignancy:
        RETURN {applicable: false, reason: "Known malignancy"}
    IF patient.isImmunocompromised:
        RETURN {applicable: false, reason: "Immunocompromised"}
    RETURN {applicable: true}
```

#### 8.1.2 Solid Nodule Algorithm - Single

```
FUNCTION assessSolidSingle(diameter, riskLevel):
    
    IF diameter < 6:
        IF riskLevel == "low":
            RETURN {
                category: "Solid <6mm, Low Risk",
                recommendation: "No routine follow-up",
                rationale: "Malignancy risk <1%"
            }
        ELSE:
            RETURN {
                category: "Solid <6mm, High Risk",
                recommendation: "Optional CT at 12 months",
                rationale: "Consider if suspicious morphology"
            }
    
    ELSE IF diameter >= 6 AND diameter <= 8:
        IF riskLevel == "low":
            RETURN {
                category: "Solid 6-8mm, Low Risk",
                recommendation: "CT at 6-12 months, then consider CT at 18-24 months",
                rationale: "Malignancy risk 0.5-2%"
            }
        ELSE:
            RETURN {
                category: "Solid 6-8mm, High Risk",
                recommendation: "CT at 6-12 months, then CT at 18-24 months",
                rationale: "Two scans to establish stability"
            }
    
    ELSE:  // diameter > 8mm
        RETURN {
            category: "Solid >8mm",
            recommendation: "Consider CT at 3 months, PET/CT, or tissue sampling",
            malignancyRisk: "~3%"
        }
```

#### 8.1.3 Sub-Solid Nodule Algorithms

```
FUNCTION assessGroundGlass(diameter):
    IF diameter < 6:
        RETURN {
            category: "GGN <6mm",
            recommendation: "No routine follow-up"
        }
    ELSE:
        RETURN {
            category: "GGN ≥6mm",
            recommendation: "CT at 6-12 months, then CT every 2 years until 5 years"
        }

FUNCTION assessPartSolid(diameter, solidComponent):
    IF diameter < 6:
        RETURN {
            category: "Part-Solid <6mm",
            recommendation: "No routine follow-up"
        }
    ELSE IF solidComponent < 6:
        RETURN {
            category: "Part-Solid ≥6mm, Solid <6mm",
            recommendation: "CT at 3-6 months, then annual CT for 5 years"
        }
    ELSE:
        RETURN {
            category: "Part-Solid, Solid ≥6mm",
            recommendation: "PET/CT, biopsy, or surgical excision",
            warning: "HIGHLY SUSPICIOUS"
        }
```

### 8.2 Lung-RADS v2022 Algorithm

#### 8.2.1 Category Definitions

| Category | Name | Malignancy Probability |
|----------|------|------------------------|
| 0 | Incomplete | N/A |
| 1 | Negative | <1% |
| 2 | Benign | <1% |
| 3 | Probably Benign | 1-2% |
| 4A | Suspicious | 5-15% |
| 4B | Very Suspicious | >15% |
| 4X | Additional Features | Variable |

#### 8.2.2 Solid Nodule Classification

```
FUNCTION classifySolidLungRADS(diameter, scanType, isGrowing, isNew):
    
    // Category 2 - Benign
    IF scanType == "baseline" AND diameter < 6:
        RETURN Category2
    IF scanType == "follow-up" AND isNew AND diameter < 4:
        RETURN Category2
    
    // Category 3 - Probably Benign
    IF scanType == "baseline" AND diameter >= 6 AND diameter < 8:
        RETURN Category3
    IF scanType == "follow-up" AND isNew AND diameter >= 4 AND diameter < 6:
        RETURN Category3
    
    // Category 4A - Suspicious
    IF scanType == "baseline" AND diameter >= 8 AND diameter < 15:
        RETURN Category4A
    IF isGrowing AND diameter < 8:
        RETURN Category4A
    IF scanType == "follow-up" AND isNew AND diameter >= 6 AND diameter < 8:
        RETURN Category4A
    
    // Category 4B - Very Suspicious
    IF scanType == "baseline" AND diameter >= 15:
        RETURN Category4B
    IF (isNew OR isGrowing) AND diameter >= 8:
        RETURN Category4B
```

#### 8.2.3 Growth Calculation

```
FUNCTION calculateGrowth(currentDiameter, priorDiameter, intervalMonths):
    // Threshold: >1.5mm in mean diameter within 12 months
    
    diameterChange = currentDiameter - priorDiameter
    
    IF intervalMonths <= 12:
        RETURN diameterChange > 1.5
    ELSE:
        annualizedChange = (diameterChange / intervalMonths) * 12
        RETURN annualizedChange > 1.5
```

#### 8.2.4 Stepped Management

```
FUNCTION applySteppedManagement(currentCat, priorCat, status):
    // Category 3 stable at 6mo → Reclassify to 2
    IF priorCat == "3" AND status == "stable":
        RETURN {newCategory: "2", followUp: "12 months"}
    
    // Category 4A stable at 3mo → Reclassify to 3
    IF priorCat == "4A" AND status == "stable":
        RETURN {newCategory: "3", followUp: "6 months"}
    
    RETURN currentCat
```

### 8.3 Management Summary Tables

#### Fleischner 2017 - Follow-up Intervals

| Nodule Type | Size | Low Risk | High Risk |
|-------------|------|----------|-----------|
| Solid Single | <6mm | No follow-up | Optional CT 12mo |
| Solid Single | 6-8mm | CT 6-12mo, consider 18-24mo | CT 6-12mo, then 18-24mo |
| Solid Single | >8mm | CT 3mo/PET/biopsy | CT 3mo/PET/biopsy |
| Solid Multiple | <6mm | No follow-up | Optional CT 12mo |
| Solid Multiple | ≥6mm | CT 3-6mo, consider 18-24mo | CT 3-6mo, then 18-24mo |
| GGN | <6mm | No follow-up | Consider 2y and 4y |
| GGN | ≥6mm | CT 6-12mo, then q2y x 5y | CT 6-12mo, then q2y x 5y |
| Part-Solid | <6mm | No follow-up | No follow-up |
| Part-Solid | ≥6mm, solid <6mm | CT 3-6mo, annual x 5y | CT 3-6mo, annual x 5y |
| Part-Solid | Solid ≥6mm | PET/biopsy/resection | PET/biopsy/resection |

#### Lung-RADS v2022 - Management by Category

| Category | Management | Timing |
|----------|------------|--------|
| 0 | Additional imaging or LDCT | 1-3 months |
| 1 | Continue annual LDCT | 12 months |
| 2 | Continue annual LDCT | 12 months |
| 3 | LDCT | 6 months |
| 4A | LDCT; PET/CT if solid ≥8mm | 3 months |
| 4B | Diagnostic CT; PET/CT; biopsy | As indicated |

---

## 9. Testing & Validation Strategy

### 9.1 Testing Pyramid

- **Unit Tests (70%)**: Algorithm logic, utility functions
- **Integration Tests (20%)**: Component interactions
- **E2E Tests (10%)**: Critical user paths

### 9.2 Algorithm Validation Test Cases

#### Fleischner Test Cases

| Test ID | Input | Expected Output |
|---------|-------|-----------------|
| TC-F-001 | Solid 4mm, Low Risk | No routine follow-up |
| TC-F-002 | Solid 5mm, High Risk | Optional CT 12 months |
| TC-F-003 | Solid 7mm, Low Risk | CT 6-12 months |
| TC-F-004 | Solid 7mm, High Risk | CT 6-12mo, then 18-24mo |
| TC-F-005 | Solid 10mm | CT 3mo/PET/biopsy |
| TC-F-006 | GGN 4mm | No routine follow-up |
| TC-F-007 | GGN 8mm | CT 6-12mo, then q2y x 5y |
| TC-F-008 | Part-Solid 8mm, solid 4mm | CT 3-6mo, annual x 5y |
| TC-F-009 | Part-Solid 10mm, solid 7mm | PET/biopsy/resection |

#### Lung-RADS Test Cases

| Test ID | Input | Expected Category |
|---------|-------|-------------------|
| TC-LR-001 | Baseline, Solid 4mm | Category 2 |
| TC-LR-002 | Baseline, Solid 7mm | Category 3 |
| TC-LR-003 | Baseline, Solid 10mm | Category 4A |
| TC-LR-004 | Baseline, Solid 16mm | Category 4B |
| TC-LR-005 | Follow-up, New 5mm | Category 3 |
| TC-LR-006 | Follow-up, Growth >1.5mm | Category 4A/4B |
| TC-LR-007 | GGN 25mm | Category 2 |
| TC-LR-008 | GGN 35mm | Category 3 |

### 9.3 Clinical Validation Plan

1. **Expert Panel Review**: 3 pulmonologists validate 50 test cases
2. **Edge Case Collection**: Document ambiguous scenarios from guidelines
3. **Regression Testing**: Re-run all tests on any algorithm change
4. **Version Tracking**: Document guideline version in every result

---

## 10. Deployment Strategy

### 10.1 Vercel Configuration

```javascript
// vercel.json
{
  "framework": "nextjs",
  "regions": ["iad1", "cdg1", "syd1"],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "DENY" }
      ]
    }
  ]
}
```

### 10.2 Deployment Pipeline

1. **Development**: Feature branches → PR preview deployments
2. **Staging**: `develop` branch → staging.lungnodule.app
3. **Production**: `main` branch → lungnodule.app

### 10.3 PWA Configuration

- Service worker for offline algorithm caching
- App manifest for "Add to Home Screen"
- Cache strategy: Network-first for HTML, cache-first for assets

---

## 11. Success Metrics

### 11.1 Key Performance Indicators

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Accuracy** | >95% match with expert decisions | Quarterly validation |
| **Time to Result** | <30 seconds | Analytics timing |
| **User Satisfaction** | NPS >50 | In-app survey |
| **Mobile Usage** | >40% of sessions | Analytics |
| **Return Users** | >30% weekly | Analytics |

### 11.2 Analytics Events

- `assessment_started`: Context selected
- `assessment_completed`: Result displayed
- `result_copied`: Recommendation copied
- `error_displayed`: Validation or processing error

---

## 12. Risks & Mitigations

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| **Algorithm Error** | High | Low | Extensive testing, expert validation, clear disclaimers |
| **Guideline Updates** | Medium | Medium | Modular algorithm design, version tracking, update monitoring |
| **Misuse (non-excluded patients)** | Medium | Medium | Clear exclusion warnings, acknowledgment requirement |
| **Offline Data Stale** | Low | Low | Version check on reconnect, clear offline indicator |
| **Regulatory Concerns** | Medium | Low | "Decision support only" framing, no diagnosis claims |

---

## 13. Timeline & Milestones

### 13.1 Phase 1: Foundation (Weeks 1-3)

- [ ] Project setup (Next.js, TypeScript, Tailwind, shadcn/ui)
- [ ] Core type definitions and Zod schemas
- [ ] Fleischner algorithm implementation
- [ ] Unit tests for Fleischner (all test cases)

### 13.2 Phase 2: Lung-RADS (Weeks 4-5)

- [ ] Lung-RADS algorithm implementation
- [ ] Growth calculation logic
- [ ] Stepped management logic
- [ ] Unit tests for Lung-RADS

### 13.3 Phase 3: UI Development (Weeks 6-8)

- [ ] Wizard component architecture
- [ ] All step components (Context, Risk, Nodule, Results)
- [ ] Responsive design implementation
- [ ] Accessibility audit and fixes

### 13.4 Phase 4: Polish & Validation (Weeks 9-10)

- [ ] Expert panel validation (50 cases)
- [ ] E2E tests with Playwright
- [ ] PWA configuration
- [ ] Performance optimization

### 13.5 Phase 5: Launch (Week 11-12)

- [ ] Staging deployment and testing
- [ ] Production deployment
- [ ] Analytics setup
- [ ] Documentation finalization

**Estimated Total: 12 weeks**

---

## 14. Appendix

### 14.1 Guideline References

| Guideline | Version | Year | Citation |
|-----------|---------|------|----------|
| Fleischner Society | 2017 | 2017 | MacMahon H, et al. "Guidelines for Management of Incidental Pulmonary Nodules Detected on CT Images: From the Fleischner Society 2017". *Radiology*. 2017;284(1):228-243 |
| Lung-RADS | v2022 | 2022 | American College of Radiology. "Lung-RADS® v2022 Assessment Categories". ACR. November 2022 |

### 14.2 Key Differences Between Guidelines

| Aspect | Fleischner 2017 | Lung-RADS v2022 |
|--------|-----------------|-----------------|
| **Context** | Incidental findings | Screening programs |
| **Population** | Adults ≥35, no known cancer | High-risk screening candidates |
| **Growth Definition** | ≥2mm change (Radiopaedia) | >1.5mm in 12 months |
| **GGN Threshold** | ≥6mm needs follow-up | <30mm is Category 2 |
| **Measurement** | Round to nearest mm | One decimal precision |

### 14.3 Medical Disclaimer Template

```
⚠️ MEDICAL DISCLAIMER

This tool is designed for clinical decision support only and does 
not replace professional medical judgment.

- Results are based on Fleischner Society 2017 and Lung-RADS v2022 guidelines
- Final management decisions must consider individual patient factors
- These guidelines do NOT apply to: patients <35 years, immunocompromised 
  patients, or patients with known malignancy
- Always verify recommendations against current published guidelines

Version: 1.0 | Fleischner 2017 | Lung-RADS v2022
```

### 14.4 Glossary

| Term | Definition |
|------|------------|
| **GGN** | Ground-Glass Nodule - nodule with hazy opacity not obscuring underlying structures |
| **Part-Solid** | Nodule with both ground-glass and solid components |
| **LDCT** | Low-Dose Computed Tomography |
| **PET/CT** | Positron Emission Tomography with CT |
| **Perifissural** | Nodule adjacent to a lung fissure |
| **Juxtapleural** | Nodule adjacent to pleural surface |
| **AIS** | Adenocarcinoma in situ |
| **MIA** | Minimally Invasive Adenocarcinoma |

---

*Document prepared based on analysis of Fleischner Society 2017 guidelines and ACR Lung-RADS v2022.*
```
