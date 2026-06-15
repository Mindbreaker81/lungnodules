## [1.6.2] - 2026-06-16

### Changed
- **CI/CD:** eliminados workflows redundantes de deploy vía Vercel CLI (`deploy-production.yml`, `deploy-preview.yml`, `deploy-staging.yml`). El despliegue lo gestiona la integración Git nativa de Vercel; la validación queda en `ci.yml` (lint, tests, build, E2E, Lighthouse en PR).

## [1.6.1] - 2026-06-16

### Fixed
- **CI build:** error de TypeScript en `assessAtypicalCyst` al combinar categoría de quiste con nódulo adyacente (`string` vs `AtypicalCystCategory`); evita duplicar modificador `S` si la categoría estándar ya lo incluye.

## [1.6.0] - 2026-06-15

### Added
- **Lung-RADS quiste atípico (híbrido):** descriptores morfológicos → categoría sugerida 3/4A/4B (`classifyAtypicalCyst` en `lib/algorithms/atypicalCyst.ts`), override manual radiológico, exclusiones ACR (unilocular pared fina / cavitado sólido dominante) y regla de nódulo adyacente (categoría más preocupante). UI ampliada en `NoduleStep.tsx` con badge de sugerencia.
- **Anexo A** en `variables_y_coeficientes.md`: tabla maestra wizard ↔ modelos predictivos.
- **PDF Swensen 1997** en `research/pdf/` y test de regresión Mayo vs Tabla 3 del paper.

### Changed
- **`coefficients.md`** sincronizado con doc largo (exclusiones app, bandas, Herder dual).
- **Mayo:** verificación **primaria** de coeficientes contra PDF Swensen 1997 (§1, ítem #7 cerrado).
- **`assessLungRads`:** refactor con `classifyStandardLungRads` y rama `assessAtypicalCyst`; quiste atípico ya no es passthrough manual único.

### Tests
- `atypicalCyst.test.ts` y ampliación `lungRads.test.ts` (TC-LR-016b–016i).
- `Mayo matches Swensen 1997 Table 3 baseline case` en `predictive.test.ts`.

## [1.5.2] - 2026-06-15

### Changed
- **Documentación predictiva alineada:** `variables_y_coeficientes.md` y `ESTADO_Y_PENDIENTES.md` sincronizados (Herder cerrado en §6, desfase actualizado, referencias §7 → `config/references.ts`, nomenclatura Brock 2a/2b, Mayo 4–30 mm, bandas UI, constantes Herder).

## [1.5.1] - 2026-06-15

### Added
- **Página de referencias bibliográficas** (`/references`): listado de guías, modelos predictivos, PLCOm2012 y fuentes secundarias con enlaces verificados a PubMed, PMC, DOI o sitios oficiales (ACR, BTS, MDCalc). Datos centralizados en `config/references.ts`.
- Enlace «Referencias» en el pie legal (`LegalFooter`).

## [1.5.0] - 2026-06-15

### Added
- **Herder — segunda variante (regresión logística Herder 2005)**: implementado el modelo logístico original del paper (`id: "herder-logistic"`): `x = −4.739 + 3.691·P_pre + βFDG`, `P = 1/(1+e^−x)`, con βFDG faint +2.322 / moderate +4.617 / intense +4.771. Se expone junto a la variante BTS (LR) en igualdad de condiciones, cada tarjeta con su fuente y cálculo.
- **Helper de elegibilidad compartido** `evaluateHerderEligibility` en `lib/predictive/index.ts`, reutilizado por ambas variantes Herder.
- **PDF de referencia** Herder 2005 (Chest) en `research/pdf/` para verificación primaria de la fórmula logística (reproducida también en Mourato 2020, PMC7159041).

### Changed
- **Etiquetas de modelo**: `herder` → "Herder (BTS · LR)" y nueva `herder-logistic` → "Herder (logístico · 2005)" en `lib/predictive/index.ts`, `ResultsStep.tsx` y `ExportResults.tsx`.
- **Texto UI** (`config/i18n.ts`): disclaimer de modelos predictivos describe ahora las dos variantes Herder y su diferencia metodológica.
- **Documentación predictiva**: `variables_y_coeficientes.md` §3 reescrita (corregido el etiquetado invertido: §3a = BTS, §3b = logística publicada y verificada como PRIMARIA), `coefficients.md` Step 5 corregido y `ESTADO_Y_PENDIENTES.md` actualizado con el mapa de las dos variantes.

### Fixed
- **Coeficientes Herder logístico**: eliminados de `coefficients.md` los valores erróneos faint +1.439 / moderate +3.893 / intense +5.534; sustituidos por los verificados contra el PDF (+2.322 / +4.617 / +4.771), sumados al intercepto −4.739 (no al log-odds Mayo).
- **Documentación Herder**: corregida la afirmación de que el método LR (BTS) era "el método original del paper"; el paper publica la regresión logística. Eliminada la cita inexistente a una "Tabla 4" de Herder 2005.

### Tests
- Variante logística Herder 2005 (~67.3 % en caso 18.7 % pre-test + PET intenso) y verificación de la escala 0–1 de `P_pre`.
- Coexistencia de ambas variantes Herder con probabilidades distintas para el mismo nódulo.
- Snapshot de `getPredictiveSummaries` actualizado para incluir la cuarta variante.

## [1.4.0] - 2026-06-15

### Added
- **Brock/PanCan Model 2a (sin espiculación)**: implementada la variante sin espiculación de McWilliams 2013 (Tabla 2) para cuando la espiculación no es evaluable (`hasSpiculation === undefined`). Se selecciona automáticamente entre Model 2b (con espiculación) y Model 2a (sin espiculación).
- **UI de espiculación en 3 estados**: el checkbox de espiculación en `NoduleStep.tsx` se reemplazó por botones "Presente / Ausente / No evaluable", con texto de ayuda contextual (Brock 2a vs Mayo / Lung-RADS).
- **Documento operativo** `research/predictive_model/ESTADO_Y_PENDIENTES.md`: estado de pendientes, mapa de las 4 variantes Brock y casos de regresión.
- **PDF de referencia** McWilliams 2013 en `research/pdf/` para verificación primaria de coeficientes.

### Changed
- **Coeficientes Brock**: añadido bloque `BROCK_COEFFICIENTS_NO_SPIC` en `lib/predictive/index.ts` con intercepto −6.8071, edad 0.0321, sexo 0.5635, historia familiar 0.3013, enfisema 0.3462, tamaño −5.6693, parte-sólido 0.3395, no sólido −0.3005, lóbulo superior 0.7116 y recuento −0.0803.
- **Documentación predictiva**: actualizados `variables_y_coeficientes.md`, `ESTADO_Y_PENDIENTES.md` y `coefficients.md` con la variante 2a implementada, verificación primaria vs PDF y nota Lung-RADS con espiculación no evaluable.
- **Textos UI predictivos** (`config/i18n.ts`): disclaimer pre/post-PET y etiqueta pre-test Mayo/Brock.

### Fixed
- **Comentario Brock en código**: corregido el comentario de `BROCK_COEFFICIENTS` que decía "parsimonious"; ahora indica correctamente "Model 2b — full model with spiculation".
- **package-lock.json**: versión sincronizada a 1.4.0 con `package.json`.
- **Referencia Herder en docs**: línea de `HERDER_LIKELIHOOD_RATIOS` corregida en `variables_y_coeficientes.md`.

### Tests
- Brock Model 2a con `hasSpiculation` undefined (~29.7 % en caso 15 mm).
- Diferencia 2a (no evaluable) vs 2b (presente) y vs 2b (ausente ~25.4 %).
- Mayo exige espiculación booleana cuando el valor es «no evaluable».

## [1.3.2] - 2026-06-13

### Fixed (Clínica — P0)
- **Modelos predictivos con PET (Herder)**: Con FDG-PET rellenado, la app mostraba solo Mayo (pre-PET, p. ej. 18,7 %) y no calculaba Herder en nódulos de 4–7 mm por umbral ≥8 mm, mientras calculadoras como [MDCalc Mayo](https://www.mdcalc.com/calc/4057/solitary-pulmonary-nodule-spn-malignancy-risk-score-mayo-clinic-model) devuelven la probabilidad post-PET (~67–70 %). Herder ahora aplica en el rango Mayo (≥4 mm) con aviso clínico si &lt;8 mm; Mayo se etiqueta explícitamente como pre-PET y Herder se recomienda cuando hay PET disponible.
- **Modelo Mayo (Swensen 1997)**: Corregidos los coeficientes de espiculación (0.71 → 1.0407) y lóbulo superior (1.138 → 0.7838), que estaban intercambiados y con valores erróneos respecto a la publicación original. También se refinó la precisión de los demás coeficientes.
- **Modelo Brock/PanCan (McWilliams 2013)**: Reimplementado conforme al modelo parsimonioso con espiculación publicado. Correcciones: el tamaño del nódulo ahora usa la transformación no lineal `−5.3854·[(tamaño/10)^−0.5 − 1.58113883]` en vez de un coeficiente lineal; la edad se centra en 62; el número de nódulos se centra en 4; y se corrigieron los coeficientes de intercepto (−8.4852 → −6.7892), espiculación (0.3543 → 0.7729) y lóbulo superior (0.3138 → 0.6581). El error en el tamaño causaba una subestimación del riesgo de hasta ~30× en nódulos de cribado.
- **Modelo Herder**: Hereda automáticamente las correcciones del riesgo pre-test (Mayo/Brock).
- **Documentación**: Corregidos los coeficientes "oficiales" en `research/predictive_model/coefficients.md`, origen del error.
- **Tests**: Actualizados los valores esperados y añadidos tests de regresión que protegen la transformación no lineal de Brock y el orden de coeficientes de Mayo.

## [1.3.1] - 2026-04-11

### Changed
- **UX Modelos Predictivos**: Sincronización automática de la edad con el factor de riesgo "Edad >65 años" en el contexto de Fleischner.
- **Formulario Inteligente**: Ocultamiento de campos de factores de riesgo duplicados (antecedentes familiares y enfisema) en el contexto incidental, mostrándolos únicamente en cribado (Lung-RADS).
- **Resultados**: Adición de sugerencias clínicas orientativas basadas en las bandas de riesgo del modelo predictivo (riesgo bajo <5%, intermedio 5-65%, alto >65%) siguiendo recomendaciones del ACCP.

## [1.3.0] - 2026-04-10

### Added
- **Shadcn UI**: Inicializado el proyecto con Shadcn UI (`components.json`, CSS variables en `globals.css`).
- **Nuevos Componentes**: Añadidos `Card`, `Form`, `Label`, `RadioGroup`, `Dialog`, `Slider` y refactorizado `Button`.

### Changed
- **UI Architecture**: Migrada la arquitectura UI para usar CSS variables y el sistema de theming de Shadcn.
- **Wizard**: Refactorizado `ContextStep.tsx` y `WizardContainer.tsx` para usar `<Form>` (react-hook-form) y `<RadioGroup>`.
- **Layout**: Actualizado `app/page.tsx` para presentar las Guías Clínicas usando componentes `<Card>`.
- **Modales**: Reescribido `NPSModal.tsx` con `<Dialog>` de Shadcn, mejorando captura de foco, teclado y accesibilidad.

## [1.2.1] - 2026-04-10

### Fixed
- **Dependency security**: Actualizados `next`, `jest`, `jest-environment-jsdom`, `ts-jest`, `eslint` y `@typescript-eslint/*` a versiones parcheadas para eliminar vulnerabilidades reportadas por `npm audit`.
- **Toolchain transitivo**: Añadidos `overrides` quirúrgicos para `flatted`, `brace-expansion` y `picomatch`, cerrando las vulnerabilidades restantes sin migrar `react`, `tailwindcss`, `zod` ni `typescript` a nuevas majors.

### Changed
- **Compatibilidad Next.js**: `tsconfig.json` adopta `moduleResolution: "bundler"` por requisito del build de Next.js 16.2.3.
- **Validación**: Revalidados `lint`, `tsc`, tests unitarios, `build`, smoke e2e y la lógica de scores tras la actualización del árbol de dependencias.

## [1.2.0] - 2026-04-10

### Fixed (Clínica — P0)
- **Lung-RADS S**: Convertido de categoría independiente a modificador aditivo (ej. `2S`, `4AS`) conforme a Lung-RADS v2022.
- **Lung-RADS crecimiento**: Añadido warning para intervalos de seguimiento prolongados (>18 meses) donde el umbral absoluto de 1.5mm puede ser engañoso.
- **Lung-RADS parte-sólidos**: Corregida clasificación en follow-up para nódulos nuevos y en crecimiento (escalado apropiado por componente sólido).
- **Lung-RADS GGN ≥30mm**: Los GGN grandes estables en follow-up ahora se benefician correctamente del stepped management.
- **Lung-RADS Categoría 0**: Modelado `isIncompleteStudy` para estudios técnicamente inadecuados.
- **Fleischner parte-sólidos ≥6mm sólido**: Añadida TC de confirmación a 3-6 meses antes de PET/biopsia para confirmar persistencia.

### Fixed (Privacidad / Seguridad — P0)
- **Analytics**: Eliminada persistencia en `localStorage`; eventos solo se mantienen en memoria de sesión, alineando el comportamiento real con las declaraciones de privacidad del footer y disclaimer.
- **Wizard defaults**: Eliminados valores por defecto clínicamente significativos (edad 50, diámetro 5mm, riesgo bajo); los campos ahora requieren entrada explícita del usuario.

### Changed (UX / Accesibilidad — P1)
- **Idioma HTML**: Corregido `lang="en"` a `lang="es"` en `app/layout.tsx`.
- **ARIA**: Añadido `aria-expanded` al toggle del disclaimer en `LegalFooter.tsx`.
- **Placeholders**: Añadidos placeholders descriptivos en campos de edad y diámetro.
- **Service worker**: Migrado de cache-first a network-first para contenido clínico (HTML/JS), manteniendo cache-first solo para assets estáticos; nombre de caché versionado.
- **Lung-RADS priorCategory**: Eliminada opción `S` del dropdown de categoría previa (ya no es categoría independiente).

### Changed (CI/CD — P1)
- **deploy-preview.yml**: Añadidos gates de `npm ci`, `lint`, `tsc --noEmit` y `test` antes del deploy.
- **deploy-staging.yml**: Añadidos gates de `lint` y `tsc --noEmit` junto al `test` existente.

### Added (Tests — P1)
- **audit-regression.test.ts**: 18 tests de regresión cubriendo cada hallazgo clínico confirmado de la auditoría (TC-AUDIT-001 a TC-AUDIT-051).

## [1.1.6] - 2026-04-10

### Added
- **Auditoría**: Actualizado `INFORME_REVISION.md` con una auditoría clínica y técnica integral del estado actual de la aplicación, hallazgos priorizados, validación y roadmap.

### Fixed
- **Lint**: Eliminada la constante sin uso en `lib/eligibility/plcom2012Schema.ts` para recuperar `npm run lint` en verde.
- **TypeScript**: Corregidas las pruebas clínicas retirando propiedades `patient.id` no presentes en `PatientProfile`.
- **Landing**: Sustituido el uso de `<img>` por `next/image` en `app/page.tsx` para eliminar la advertencia pendiente de lint.

### Changed
- **Versionado**: Sincronizadas versiones y metadatos en `package.json`, `package-lock.json`, `README.md`, `config/guidelines.ts`, `public/manifest.json` y disclaimers.

## [1.1.5] - 2026-02-15

### Added
- **Navegación**: Enlace «Inicio» en cabecera de `/eligibility` y `/assessment`; botón Inicio en el bloque de resultado de elegibilidad junto a «Evaluar nódulo».
- **Landing**: Hero con imagen de fondo (`/icons/fondo.jpg`), logo (`/icons/icon.svg`) y overlay; integración con next/image.
- **Footer**: Versión de la app siempre visible en copyright y enlazada a `/CHANGELOG.md`.

### Changed
- **Viewport**: `layout.tsx` exporta viewport explícito (`width: device-width`, `initialScale: 1`) para documentar y garantizar comportamiento responsive.

## [1.1.4] - 2026-02-15

### Changed
- **PLCOm2012 / Elegibilidad**: Traducción al español de la escala de educación (1–6) revisada: distinción clara entre nivel 4 (estudios universitarios sin terminar) y 5 (graduado universitario); etiquetas alineadas con NEJM 2013 y cuestionarios de salud en español.

## [1.1.3] - 2026-02-15

### Chore
- **next-env.d.ts**: Incluido en el repositorio (declaraciones de tipos de Next.js, incl. rutas).

## [1.1.2] - 2026-02-15

### Fixed
- **Build/Vercel**: Error de TypeScript en `lib/eligibility/registry.ts` (EligibilityModel genérico no asignable a `EligibilityModel[]`). Corregido con aserción de tipo en el array del registro para que el build y el deploy en Vercel pasen.

## [1.1.1] - 2026-02-15

### Added
- **AGENTS.md**: Instrucciones para agentes (td al inicio/cierre de sesión, handoff con detalle, commits con skill smart-commit-with-versioning).

## [1.1.0] - 2026-02-15

### Added
- **Elegibilidad para cribado**: Módulo de riesgo a 6 años (PLCOm2012) para valorar elegibilidad para cribado con LDCT, separado del flujo de evaluación de nódulos.
- **Entrada dual en Home**: Dos acciones principales — «Elegibilidad para cribado» (`/eligibility`) y «Evaluar nódulo» (`/assessment`).
- **`lib/eligibility/`**: Tipos, `computePlcom2012`, schema Zod, registro extensible de modelos (`eligibilityModels`, `computeEligibility`, `getEligibilityModel`), umbral por defecto 1,51%.
- **Ruta `/eligibility`**: Formulario PLCOm2012 (edad, IMC, raza, educación, EPOC, historias, tabaquismo), resultado (riesgo %, elegible/no elegible), disclaimer y enlace a «Evaluar nódulo».
- **Tests**: Suite `__tests__/eligibility/plcom2012.test.ts` (ejemplo de referencia, smoking_intensity=0, razas).
- **Documentación**: `research/plcom2012-implementation-tasks.md`, referencias a PLCOm2012 en MEDICAL_DISCLAIMER.md.

### Changed
- **MEDICAL_DISCLAIMER.md**: Inclusión de PLCOm2012 en guías/modelos implementados y en referencias útiles.

## [1.0.3] - 2026-02-15

### Added
- **Research**: Script R del modelo PLCOm2012 (`research/plcom2012.R`), documentación (`research/plcom2012_research.md`) y PDF de criterios de selección para cribado (`research/pdf/`).

### Chore
- **.gitignore**: Añadido `.todos/` para ignorar base de tareas local.

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

