## [1.0.2] - 2026-02-06

### Added
- **Landing**: Aviso visible de que la aplicación está en proceso de desarrollo; se recomienda usar siempre criterio clínico y guías oficiales.
- **Documentación**: Estado "en desarrollo" en README y versión actualizada (1.0.2).

### Bug Fixes

- remove unused riskLevel from assessSubsolidMultiple (599ee7d)
- correct algorithm logic errors and rename parte-sólido to semi-sólido (c34b01b)
- prevent form freeze when subsolid nodule has empty solid diameter (670b7ce)
- stabilize e2e and update app (9fca358)
- improve CI artifact handling and icons (3b73a9a)

### Chore

- add tsbuildinfo to gitignore (250fcbd)
- update next types (da699eb)

### Other

- Merge pull request #2 from Mindbreaker81/claude/fix-fleischner-nodule-form-1Whqp (528f3c3)
- Reject solid component 0mm for part-solid nodules (fecabe8)
- Add depth limit to extractFirstError to guard against circular refs (47e7af4)

## [1.0.1] - 2026-01-31

### Features

- add MIT License with medical disclaimer (eac44ea)
- feat(security): harden repo for public release - add security policies & documentation (2f70573)
- release v1.0.0 - full spanish localization, clinical adjustments & tests (9157b29)
- feat(ui): add footer with copyright and GitHub profile link (af1ca49)
- feat(predictive): implement Mayo/Brock/Herder malignancy calculators with UI integration (c6bb32d)

### Bug Fixes

- fix(build): remove unused variables causing eslint error (2a18dbd)
- wizard UI bugs and navigation improvements (6129a9d)

### Other

- Remove multi-region deployment configuration from Vercel (e74ab0b)
- Responsive layout improvements (tablet/desktop) (0c07b45)
- ``` test(wizard): improve assessment flow validation and UI state testing (d972f10)

# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Added
- **UI/Footer**: Added footer with copyright notice © 2026 and GitHub attribution link (mindbreaker81)

### Changed
- **Responsive Layout**: Updated global layout container widths for better tablet/desktop experience
- **Home UI**: Adjusted hero heading typography for improved scaling across breakpoints
- **Results UI**: Improved disclaimer + copy button layout to avoid text compression on small/medium screens

### Fixed
- **Mobile Inputs**: Set `inputMode="decimal"` by default on numeric inputs to improve mobile keyboard behavior
- **Vercel Deploy**: Removed multi-region `regions` setting from `vercel.json` to avoid Pro/Enterprise restriction
## [1.0.0] - 2026-01-22
### Added
- **Localization (i18n)**: Traducción completa al Español de algoritmos clínicos, configuración y resultados (Fleischner + Lung-RADS).
- **Clinical Tests**: Nueva suite de pruebas clínicas automatizadas (`__tests__/clinical_scenarios.test.ts`) para validar salidas en español.
- **UI Constants**: Centralización de textos de interfaz en `config/i18n.ts`.

### Changed
- **Config**: Unificación de terminología "Vidrio deslustrado" (antes "Vidrio esmerilado") en toda la aplicación.
- **Herder Model**: Se añadió una advertencia explícita cuando se usa Herder con Brock (screening) debido a la limitación de evidencia clínica.
- **Validation**: Se ajustó la edad mínima permitida en el input a 18 años, manteniendo la validación de negocio de Fleischner (>=35).


## [0.2.1] - 2026-01-18
### Fixed
- **Wizard UI**: Fixed single/multiple nodule toggle not responding to clicks in Fleischner flow
- **Form Validation**: Fixed boolean coercion for risk factors checkboxes (z.coerce.boolean)
- **Navigation**: Added "Nueva evaluación" button alongside "Recalcular" in results view
- **UX**: Improved error logging for form validation failures via onInvalid handler

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

