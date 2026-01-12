# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

## [0.2.0] - 2026-01-12
### Added
- **Regression Tests**: 35 new tests for stepped management and growth calculation (`lungRads.regression.test.ts`)
- **Config/Guidelines**: Comprehensive `config/guidelines.ts` (269 lines) with:
  - Clinical thresholds for Fleischner and Lung-RADS
  - Category definitions with malignancy probabilities
  - Management tables for all nodule types
  - Disclaimers (general, guideline-specific, exportable)
  - UI constants and validation constraints
- **Analytics Module** (`lib/analytics/`):
  - Event tracking: assessment_started, assessment_completed, result_copied, error_displayed
  - Time-to-result measurement
  - Session tracking and metrics aggregation
  - Offline event queuing
- **NPS Modal** (`components/NPSModal.tsx`): In-app Net Promoter Score collection
- **CI/CD Pipeline** (`.github/workflows/`):
  - `ci.yml`: Lint, test, build, E2E tests
  - `deploy-preview.yml`: PR preview deployments
  - `deploy-staging.yml`: Staging deployments (develop branch)
  - `deploy-production.yml`: Production deployments (main branch)
  - Lighthouse CI integration (`lighthouserc.json`)
- **Clinical Validation** (`lib/validation/clinicalCases.ts`):
  - 40+ validation cases for expert panel review
  - Fleischner and Lung-RADS test scenarios
- **GuidelineVersion Component**: Displays guideline version and citation in results
- **Disclaimer Component**: Configurable disclaimer with export capability
- **ExportResults Component**: Export results as TXT, JSON, or clipboard
- **Enhanced OfflineBanner**: Analytics integration, reconnection notification

### Changed
- Fixed `classifySolidLungRADS` to properly classify follow-up existing nodules (not new, not growing)
- ResultsStep now includes working copy button with formatted output
- WizardContainer integrated with analytics tracking

### Fixed
- Stepped management logic for progression cases now correctly maintains category

## [0.1.0] - 2026-01-10
### Added
- Inicialización de TODO general basado en PRD v1.0 (Jan 2026).
- Estructura de dominio y algoritmos completos (Fleischner 2017, Lung-RADS v2022).
- Wizard UI completo (Context, Risk/Scan, Nodule, Results) con validaciones Zod y React Hook Form.
- PWA (manifest, SW cache-first + banner offline, icono SVG) y vercel.json con headers de seguridad.
- Pruebas: unit (algoritmos), integración wizard, smoke E2E Playwright (desktop/móvil).
### Changed
- UI resultados: muestra crecimiento >1.5mm/12m y nota de nódulo dominante/múltiples.
- Tests de flujo wizard envueltos en `act` para evitar warnings y mejorar estabilidad.

