# Informe de Revisión Integral — Lung Nodule Follow‑Up Decision Support Tool

**Fecha:** 2026-01-22  
**Rol de revisión:** arquitectura frontend/backend, QA, seguridad/privacidad, documentación y coherencia clínica (apps clínicas)  
**Modo:** lectura/análisis (sin cambios de código)

---

## 1) Resumen ejecutivo (≈1 página)

### Estado general
La app está **bien estructurada**, con un **flujo claro tipo wizard**, algoritmos aislados en `lib/algorithms/`, validación formal con Zod y una base de tests extensa (unit/regression/integration/e2e). Como “decision support tool”, el enfoque de **cálculo 100% local** es adecuado.

Los principales riesgos detectados no son de “arquitectura” sino de **privacidad/consentimiento**, **señalización de idioma/consistencia textual** y **potenciales fallos de UX** en cómo se muestran errores (riesgo de usuarios “bloqueados” sin feedback claro).

### Riesgos críticos
- **[Alto] Privacidad/claims potencialmente inconsistentes**: la landing afirma “no persistencia” y “no envío a servidor”, pero existe un módulo de analytics que **persiste eventos en `localStorage`** y puede **enviar a endpoint** si se configura; además se cargan **fuentes desde Google** (exposición de IP/metadata a terceros).
- **[Alto] Mensajería de errores probablemente incompleta**: el banner global de error no parece recuperar errores anidados (`errors.nodule.diameterMm`, `errors.nodule.airwayLocation`, etc.). En escenarios reales puede impedir completar el flujo sin explicar por qué.

### Top 5 recomendaciones (no clínicas)
- **[1]** Alinear **privacidad y claims** con la realidad técnica (analytics/localStorage + Google Fonts).  
- **[2]** Asegurar **visibilidad de errores** (extraer primer error de forma recursiva o mostrar errores por campo).  
- **[3]** Añadir **headers de seguridad** faltantes (CSP/Referrer‑Policy/Permissions‑Policy/HSTS si procede).  
- **[4]** Unificar **idioma ES** (strings, labels, “Baseline/Follow‑up”, “Warnings/Racional”, `lang` del HTML).  
- **[5]** Confirmar y documentar **con fuentes oficiales** las ramas “sensibles” (Lung‑RADS especiales, sub‑sólidos múltiples, opcionales de seguimiento).

---

## 2) Alcance y metodología

### Qué revisé
- **[Arquitectura y flujo]** `app/*`, `components/wizard/*`, `lib/schemas/*`, `lib/algorithms/*`, `config/guidelines.ts`
- **[Privacidad/seguridad]** `lib/analytics/*`, [vercel.json](cci:7://file:///home/erosales/proyectos/lungnodules/vercel.json:0:0-0:0), PWA `public/sw.js`, cargas externas en [app/layout.tsx](cci:7://file:///home/erosales/proyectos/lungnodules/app/layout.tsx:0:0-0:0)
- **[QA/tests/CI]** `__tests__/*`, `e2e/*`, `.github/workflows/*`, [lighthouserc.json](cci:7://file:///home/erosales/proyectos/lungnodules/lighthouserc.json:0:0-0:0), [jest.config.js](cci:7://file:///home/erosales/proyectos/lungnodules/jest.config.js:0:0-0:0), [playwright.config.ts](cci:7://file:///home/erosales/proyectos/lungnodules/playwright.config.ts:0:0-0:0)
- **[Modelos predictivos]** `lib/predictive/*` + [research/predictive_model/coefficients.md](cci:7://file:///home/erosales/proyectos/lungnodules/research/predictive_model/coefficients.md:0:0-0:0)

### Qué NO revisé
- **[Ejecución real]** No ejecuté la app ni corrí tests (modo Ask).
- **[Verificación con literatura externa]** No consumí fuentes web oficiales desde internet. Solo usé citas internas (`config/guidelines.ts`, [PRD-LungNoduleTracker.md](cci:7://file:///home/erosales/proyectos/lungnodules/PRD-LungNoduleTracker.md:0:0-0:0), `research/*`).

### Limitaciones
- **[Fuentes clínicas]** La matriz “App vs Fuente” queda **parcialmente pendiente** de que me pases PDFs/links oficiales (Fleischner 2017 y tablas Lung‑RADS v2022, y si quieres: BTS/ACCP/CHEST para modelos).

---

## 3) Hallazgos técnicos (tabla)

| Severidad | Hallazgo | Evidencia (archivo/linea) | Impacto | Recomendación | Esfuerzo |
|---|---|---|---|---|---|
| **Alto** | Claims de privacidad inconsistentes: se dice “no persistencia / no envío”, pero hay `localStorage` de analytics y posible `fetch` a endpoint; además Google Fonts expone datos a terceros | `app/page.tsx:58-61`; `lib/analytics/index.ts:178-214`; `app/layout.tsx:17-23` | Riesgo reputacional/regulatorio (apps clínicas), expectativas de usuario incorrectas | Ajustar texto de landing + documentar comportamiento real; opcional: desactivar analytics por defecto o pedir consentimiento; considerar self-host de fuentes | 1–2 días (según enfoque) |
| **Alto** | Errores anidados probablemente no aparecen en el banner global (no hay extractor recursivo). Puede dejar al usuario bloqueado sin feedback | `components/wizard/WizardContainer.tsx:295-320` (cálculo de `firstErrorMessage` solo mira 1 nivel) + validaciones Zod anidan errores (`lib/schemas/noduleInput.ts:205-260`) | UX defectuosa: el submit puede fallar y el usuario no sabrá qué falta (airwayLocation, PET uptake, etc.) | Implementar “findFirstErrorMessage” recursivo o mostrar errores por campo (pequeño cambio y reversible) | 1–2 h |
| **Medio** | Headers de seguridad incompletos (no CSP / Referrer‑Policy / Permissions‑Policy / HSTS) | `vercel.json:3-10` | Menor hardening frente a XSS/misuse; en entorno clínico se espera baseline más alto | Añadir headers (sin dependencias). CSP debe probarse para no romper Google Fonts/Material Symbols | 1–2 h (más si CSP estricta) |
| **Medio** | `lang="en"` en documento HTML mientras UI es mayoritariamente ES | `app/layout.tsx:15` | Accesibilidad (lectores de pantalla), SEO y coherencia | Cambiar a `lang="es"` (o introducir selector de idioma si aplica) | 5–15 min |
| **Medio** | Mezcla de idiomas en UI (ES/EN): “Assessment Wizard”, “Warnings”, “Baseline/Follow-up”, disclaimers EN/mixtos | `app/assessment/page.tsx:8`; `components/wizard/ResultsStep.tsx:206-207,289-291`; `components/wizard/RiskStep.tsx:120-129`; `config/guidelines.ts:198-215` | Riesgo de malentendidos clínicos, menor confianza | Unificar ES en UI; reservar EN solo para export si intencional | 2–6 h |
| **Medio** | Logging/telemetría puede capturar datos clínicos (edad/diámetros) vía `errorMessage` y persistirlo en `localStorage` | `WizardContainer.tsx:232-241` + `lib/analytics/index.ts:178-200` | “Datos clínicos” aunque no PII directa; riesgo de compliance si se interpreta como dato de salud persistido | Sanitizar `errorMessage` (no incluir valores), limitar eventos guardados o permitir opt‑out | 0.5–1 día |
| **Medio** | Carga de fuentes desde Google (tercero) contradice “no datos a ningún servidor”; además afecta offline first-run | `app/layout.tsx:17-23` | Privacidad y disponibilidad | Self-host (si procede) o actualizar mensaje de privacidad | 0.5–2 días |
| **Bajo/Medio** | Service Worker cachea “todo GET” (cache-first). Puede servir UI desactualizada si cambian guías/algoritmo | `public/sw.js:19-35` | Riesgo de usar versión vieja (clínicamente sensible si hay cambios) | Estrategia de cache con versioning + invalidación; al menos mostrar versión claramente (ya existe en export) | 0.5–1 día |
| **Bajo** | Componentes “muertos”/no integrados: `ExportResults`, `NPSModal`, `Disclaimer` (parecen no usados) | No hay imports hallados; archivos: [components/ExportResults.tsx](cci:7://file:///home/erosales/proyectos/lungnodules/components/ExportResults.tsx:0:0-0:0), [components/NPSModal.tsx](cci:7://file:///home/erosales/proyectos/lungnodules/components/NPSModal.tsx:0:0-0:0), `components/Disclaimer.tsx` | Deuda técnica ligera / bundle size / confusión de roadmap | Eliminar o integrar detrás de feature flag (sin tocar lógica clínica) | 0.5 día |
| **Bajo** | Posible contraste insuficiente (texto gris oscuro sobre fondo oscuro) | `app/assessment/page.tsx:9` (`text-slate-700` con theme `background` oscuro) | Accesibilidad WCAG | Ajustar clases de color | 15–30 min |

---

## 4) Revisión funcional (flujos y edge cases)

### Flujo principal (entrada → cálculo → resultados)
- **[OK]** Flujo wizard consistente: `Context → Risk/Scan → Nodule → Results`  
  - Evidencia: `components/wizard/WizardContainer.tsx:15-20`, `app/assessment/page.tsx:7-11`
- **[OK]** Selector explícito de contexto “incidental vs screening” para evitar mezcla de guías  
  - Evidencia: `components/wizard/ContextStep.tsx:11-49` (leído previamente)
- **[Riesgo funcional]** En inputs condicionales (airway/inflammatory/atypical cyst/PET uptake), el submit puede fallar por Zod y **no mostrar el error** (ver hallazgo técnico de errores anidados)  
  - Evidencia: validaciones condicionales `lib/schemas/noduleInput.ts:205-239` + banner `WizardContainer.tsx:295-320`

---

## 5) Revisión clínica

> **Nota (importante):** No he consultado fuentes web oficiales en esta sesión. La “verificación” aquí es de **coherencia interna** (código ↔ PRD ↔ tablas internas ↔ coefficients.md). Para una auditoría “App vs publicación”, necesito que compartas PDFs/links oficiales o extractos.

### 5.1 Modelos/guías detectadas (implementadas en código)

#### Guías de manejo/seguimiento
- **[Fleischner Society 2017]** (incidental)  
  - **Autoridad de cálculo:** [lib/algorithms/fleischner.ts](cci:7://file:///home/erosales/proyectos/lungnodules/lib/algorithms/fleischner.ts:0:0-0:0)  
  - **Exclusiones:** `>=35 años`, sin malignidad conocida, sin inmunocompromiso ([checkFleischnerApplicability](cci:1://file:///home/erosales/proyectos/lungnodules/lib/algorithms/fleischner.ts:14:0-25:1))  
  - **Medición:** redondeo a mm (`Math.round`)  
  - **Variables de entrada clave:**  
    - Paciente: `age`, `riskLevel` (derivado), exclusiones  
    - Nódulo: `type`, `diameterMm`, `solidComponentMm`, `isMultiple`, `isPerifissural`
- **[Lung-RADS v2022]** (screening)  
  - **Autoridad de cálculo:** [lib/algorithms/lungRads.ts](cci:7://file:///home/erosales/proyectos/lungnodules/lib/algorithms/lungRads.ts:0:0-0:0)  
  - **Crecimiento:** `>1.5mm/12m` (anualizado si intervalo >12m)  
  - **Variables de entrada clave:**  
    - Paciente: `clinicalContext === 'screening'`  
    - Nódulo: `type`, `diameterMm`, `scanType`, `priorDiameterMm`, `priorScanMonthsAgo`, `isNew`, `hasSpiculation`  
    - Reglas especiales: `isBenign`, `hasSignificantFinding`, `isInflammatory + inflammatoryCategory`, `isAirway + airwayLocation + airwayPersistent`, `isAtypicalCyst + atypicalCystCategory`, `isJuxtapleural/isPerifissural`

#### Modelos predictivos (probabilidad de malignidad)
- **[Mayo Clinic (Swensen 1997)]**  
  - Archivo: `lib/predictive/index.ts:33-165`  
  - Coeficientes coinciden con `research/predictive_model/coefficients.md:3-16`  
- **[Brock / PanCan (McWilliams 2013)]**  
  - Archivo: `lib/predictive/index.ts:

# Revisión integral (Sprint) — Lung Nodule Follow‑Up Decision Support Tool

**Repo:** `lung-nodule-tracker`  
**Fecha:** 2026-01-22  
**Modo:** revisión estática (sin ejecutar ni cambiar código)

---

## Resumen ejecutivo

- **Estado general:** base sólida (Next.js + TS), algoritmos aislados y testeados, wizard claro, PWA/offline, CI completo.
- **Riesgos principales (no clínicos):**
  - **Privacidad/claims**: se afirma “no persistencia/no envío”, pero hay **analytics con `localStorage`** y potencial **POST a endpoint**; además se cargan **Google Fonts** (terceros).
  - **UX/seguridad clínica**: el wizard puede fallar validaciones condicionales y **no mostrar el error real** (errores anidados no recuperados), dejando al usuario bloqueado.
- **Limitación clínica:** sin navegación/validación con PDFs oficiales; la verificación “App vs Fuente” queda **pendiente de documentos**.

---

## Alcance y limitaciones

- **Revisado:** `app/*`, `components/*`, `lib/algorithms/*`, `lib/schemas/*`, `lib/predictive/*`, `lib/analytics/*`, `config/guidelines.ts`, `__tests__/*`, `e2e/*`, `.github/workflows/*`, [vercel.json](cci:7://file:///home/erosales/proyectos/lungnodules/vercel.json:0:0-0:0), `public/sw.js`.
- **No revisado:** ejecución real, comparación con PDF/ACR oficial en esta sesión.

---

## Hallazgos técnicos (priorizados)

| Severidad | Hallazgo | Evidencia (archivo/linea aprox) | Impacto | Recomendación (pequeña/reversible) |
|---|---|---|---|---|
| **Alto** | **Privacidad vs claims**: landing dice “no se almacenan ni envían”, pero analytics persiste eventos (y puede enviar) + Google Fonts | `app/page.tsx:58-61`; `lib/analytics/index.ts:178-214`; `app/layout.tsx:17-23` | Riesgo reputacional/regulatorio (apps clínicas) | Alinear texto + documentar; opcional: opt‑in/disable analytics; considerar self‑host fonts |
| **Alto** | **Errores anidados no visibles**: banner global probablemente no encuentra `errors.nodule.*`, `errors.patient.*` | `WizardContainer.tsx:295-320`; validaciones condicionales `lib/schemas/noduleInput.ts:205-260` | Usuario bloqueado sin saber qué falta (PET uptake, airwayLocation, etc.) | Implementar extractor recursivo de primer error o mostrar errores por campo |
| **Medio** | Headers de seguridad incompletos (sin CSP/Referrer‑Policy/Permissions‑Policy) | `vercel.json:3-10` | Hardening insuficiente | Añadir headers gradualmente; CSP en modo report-only primero |
| **Medio** | `lang="en"` con UI mayoritariamente ES | `app/layout.tsx:15` | Accesibilidad (lector pantalla) | Cambiar a `lang="es"` (o i18n real si se decide) |
| **Medio** | Mezcla ES/EN en UI y disclaimers | `app/assessment/page.tsx:8-9`; `ResultsStep.tsx:206-207`; `config/guidelines.ts:198-215`; `RiskStep.tsx:120-129` | Confusión clínica / menor confianza | Unificar idioma (mínimo: UI ES; export opcional EN) |
| **Medio** | Analytics puede capturar “datos clínicos” en `errorMessage` y persistirlos | `WizardContainer.tsx:232-241`; `lib/analytics/index.ts:178-200` | Riesgo de almacenar datos sensibles (aunque no PII directa) | Sanitizar/normalizar errores (sin valores), reducir retención o permitir opt‑out |
| **Bajo/Medio** | SW cachea todos los GET (cache-first) → riesgo de UI/guías “stale” | `public/sw.js:19-35` | Riesgo operacional si se actualiza guía/logic | Versionado/invalidación; mostrar versión en UI (ya existe en export) |
| **Bajo** | Componentes “no integrados” (posible deuda): `ExportResults`, `NPSModal`, `Disclaimer` | sin imports hallados; `components/*.tsx` | Confusión/maint | Integrar o retirar detrás de feature flag (sin tocar clínica) |

---

## Hallazgos funcionales (flujo)

- **[OK]** Flujo wizard coherente: Context → Risk/Scan → Nodule → Results  
  - `components/wizard/WizardContainer.tsx:15-20`
- **[Riesgo]** Validación duplicada: Zod + validación manual por paso  
  - `WizardContainer.tsx:120-207` + [lib/schemas/noduleInput.ts](cci:7://file:///home/erosales/proyectos/lungnodules/lib/schemas/noduleInput.ts:0:0-0:0)  
  - Impacto: divergencias futuras (mensajes/rangos). Recomendación: minimizar duplicación (solo “gating” + confiar en schema).

---

## Hallazgos clínicos (sin cambiar lógica)

### Guías/modelos detectados (implementados)
- **Fleischner 2017 (incidental)**  
  - Cálculo: [lib/algorithms/fleischner.ts](cci:7://file:///home/erosales/proyectos/lungnodules/lib/algorithms/fleischner.ts:0:0-0:0) (exclusiones, redondeo a mm, árbol por tipo/tamaño/múltiples).
- **Lung‑RADS v2022 (screening)**  
  - Cálculo: [lib/algorithms/lungRads.ts](cci:7://file:///home/erosales/proyectos/lungnodules/lib/algorithms/lungRads.ts:0:0-0:0) (growth `>1.5mm/12m`, nuevas/seguimiento, reglas especiales, stepped management).
- **Modelos predictivos (beta): Mayo/Brock/Herder**  
  - `lib/predictive/index.ts`; coeficientes documentados en [research/predictive_model/coefficients.md](cci:7://file:///home/erosales/proyectos/lungnodules/research/predictive_model/coefficients.md:0:0-0:0) (coinciden en Mayo/Brock/Herder LR).

### App vs Fuente (con citas a PDFs oficiales)

| Regla/criterio (Fuente) | Implementación (App) | Concordancia | Impacto potencial |
|---|---|---|---|
| **Fleischner: aplicabilidad** (≥35 años, sin cáncer conocido, sin inmunocompromiso) | `checkFleischnerApplicability` (`fleischner.ts:15-26`) + Zod `noduleInput.ts:186-203` | **Sí** | Alto si se aplica fuera de población. Fuente: PDF Fleischner 2017, pág. 2 (líneas 30-55) y pág. 2 (líneas 107-110). |
| **Fleischner: redondeo a mm** (promedio de ejes, redondear al mm más cercano) | `roundToNearestMm` (`fleischner.ts:13`) | **Sí** | Bajo (precisión esperada). Fuente: PDF Fleischner 2017, pág. 3, nota al pie (*). |
| **Fleischner: sólido único <6 mm, bajo riesgo → no seguimiento** | `assessSolidSingle` (`fleischner.ts:90-107`, low-risk) | **Sí** | Bajo. Fuente: PDF Fleischner 2017, pág. 3, tabla A (líneas 005-011). |
| **Fleischner: sólido único <6 mm, alto riesgo → opcional 12 meses** | `assessSolidSingle` (`fleischner.ts:100-106`, high-risk) | **Sí** | Medio. Fuente: PDF Fleischner 2017, pág. 3, tabla A (líneas 012-014). |
| **Fleischner: sólido único 6–8 mm, bajo riesgo → 6–12 meses, considerar 18–24** | `assessSolidSingle` (`fleischner.ts:110-117`, low-risk) | **Sí** | Medio. Fuente: PDF Fleischner 2017, pág. 3, tabla A (líneas 007-009). |
| **Fleischner: sólido único 6–8 mm, alto riesgo → 6–12 + 18–24** | `assessSolidSingle` (`fleischner.ts:118-125`, high-risk) | **Sí** | Medio. Fuente: PDF Fleischner 2017, pág. 3, tabla A (líneas 012-014). |
| **Fleischner: sólido único >8 mm → considerar 3 meses, PET/CT, biopsia** | `assessSolidSingle` (`fleischner.ts:127-135`) | **Sí** | Alto. Fuente: PDF Fleischner 2017, pág. 3, tabla A (líneas 009-010). |
| **Fleischner: múltiples sólidos <6 mm, bajo riesgo → no seguimiento** | `assessSolidMultiple` (`fleischner.ts:138-146`, low-risk) | **Sí** | Medio. Fuente: PDF Fleischner 2017, pág. 3, tabla A (líneas 018-021). |
| **Fleischner: múltiples sólidos <6 mm, alto riesgo → opcional 12 meses** | `assessSolidMultiple` (`fleischner.ts:147-154`, high-risk) | **Sí** | Medio. Fuente: PDF Fleischner 2017, pág. 3, tabla A (líneas 025-027). |
| **Fleischner: múltiples sólidos ≥6 mm → 3–6 meses, considerar 18–24** | `assessSolidMultiple` (`fleischner.ts:156-171`) | **Sí** | Medio. Fuente: PDF Fleischner 2017, pág. 3, tabla A (líneas 019-022, 025-027). |
| **Fleischner: GGN único <6 mm → no seguimiento** | `assessGroundGlass` (`fleischner.ts:173-182`) | **Sí** | Medio. Fuente: PDF Fleischner 2017, pág. 3, tabla B (líneas 034-035). |
| **Fleischner: GGN único ≥6 mm → 6–12 meses, luego cada 2 años hasta 5 años** | `assessGroundGlass` (`fleischner.ts:183-190`) | **Sí** | Medio. Fuente: PDF Fleischner 2017, pág. 3, tabla B (líneas 034-036). |
| **Fleischner: parte-sólido <6 mm → no seguimiento** | `assessPartSolid` (`fleischner.ts:192-201`) | **Sí** | Medio. Fuente: PDF Fleischner 2017, pág. 3, tabla B (líneas 039-043). |
| **Fleischner: parte-sólido ≥6 mm con sólido <6 mm → 3–6 meses, luego anual x5** | `assessPartSolid` (`fleischner.ts:214-221`) | **Sí** | Alto. Fuente: PDF Fleischner 2017, pág. 3, tabla B (líneas 039-041, 044-046). |
| **Fleischner: parte-sólido con sólido ≥6 mm → PET/CT/biopsia/cirugía** | `assessPartSolid` (`fleischner.ts:224-232`) | **Sí** | Alto. Fuente: PDF Fleischner 2017, pág. 3, tabla B (líneas 044-046). |
| **Fleischner: perifisural benigno → no seguimiento** | `assessFleischner` (`fleischner.ts:253-261`) | **Sí** | Bajo. Fuente: PDF Fleischner 2017, pág. 6, Fig 5 (líneas 113-117). |
| **Lung‑RADS: growth threshold >1.5 mm/12m** | `calculateGrowth` (`lungRads.ts:8-19`) + tests `lungRads.regression.test.ts:101-145` | **Sí** | Alto (cambia categoría). Fuente: Lung-RADS 2022 Summary, pág. 2 (nota 6). |
| **Lung‑RADS: sólido <6 mm basal → categoría 2** | `classifySolidLungRADS` (`lungRads.ts:30`) | **Sí** | Medio. Fuente: Lung-RADS assessment categories, pág. 1 (líneas 022-024). |
| **Lung‑RADS: sólido 6–<8 mm basal → categoría 3** | `classifySolidLungRADS` (`lungRads.ts:34`) | **Sí** | Medio. Fuente: Lung-RADS assessment categories, pág. 1 (líneas 038-040). |
| **Lung‑RADS: sólido 8–<15 mm basal → categoría 4A** | `classifySolidLungRADS` (`lungRads.ts:38`) | **Sí** | Alto. Fuente: Lung-RADS assessment categories, pág. 1 (líneas 053-056). |
| **Lung‑RADS: sólido ≥15 mm basal → categoría 4B** | `classifySolidLungRADS` (`lungRads.ts:43`) | **Sí** | Alto. Fuente: Lung-RADS assessment categories, pág. 1 (líneas 074-076). |
| **Lung‑RADS: nuevo sólido <4 mm en seguimiento → categoría 2** | `classifySolidLungRADS` (`lungRads.ts:31`) | **Sí** | Medio. Fuente: Lung-RADS assessment categories, pág. 1 (líneas 022-024). |
| **Lung‑RADS: nuevo sólido 4–<6 mm en seguimiento → categoría 3** | `classifySolidLungRADS` (`lungRads.ts:35`) | **Sí** | Medio. Fuente: Lung-RADS assessment categories, pág. 1 (líneas 038-040). |
| **Lung‑RADS: nuevo sólido 6–<8 mm en seguimiento → categoría 4A** | `classifySolidLungRADS` (`lungRads.ts:40`) | **Sí** | Alto. Fuente: Lung-RADS assessment categories, pág. 1 (líneas 053-056). |
| **Lung‑RADS: nuevo sólido ≥8 mm en seguimiento → categoría 4B** | `classifySolidLungRADS` (`lungRads.ts:44`) | **Sí** | Alto. Fuente: Lung-RADS assessment categories, pág. 1 (líneas 074-076). |
| **Lung‑RADS: crecimiento <8 mm → categoría 4A** | `classifySolidLungRADS` (`lungRads.ts:39`) | **Sí** | Alto. Fuente: Lung-RADS assessment categories, pág. 1 (líneas 053-056). |
| **Lung‑RADS: parte-sólido <6 mm → categoría 3 (con aviso si sólido desconocido)** | `classifyPartSolid` (`lungRads.ts:63-66`) | **Sí** | Medio. Fuente: Lung-RADS assessment categories, pág. 1 (líneas 025-027, 041-044). |
| **Lung‑RADS: parte-sólido ≥6 mm con sólido <6 mm → categoría 4A** | `classifyPartSolid` (`lungRads.ts:71-73`) | **Sí** | Alto. Fuente: Lung-RADS assessment categories, pág. 1 (líneas 061-063). |
| **Lung‑RADS: parte-sólido con sólido ≥6 mm → categoría 4B** | `classifyPartSolid` (`lungRads.ts:67-69`) | **Sí** | Alto. Fuente: Lung-RADS assessment categories, pág. 1 (líneas 088-090). |
| **Lung‑RADS: GGN <30 mm → categoría 2** | `classifyGroundGlass` (`lungRads.ts:58-60`) | **Sí** | Medio. Fuente: Lung-RADS assessment categories, pág. 1 (líneas 027-029). |
| **Lung‑RADS: GGN ≥30 mm → categoría 3** | `classifyGroundGlass` (`lungRads.ts:58-60`) | **Sí** | Medio. Fuente: Lung-RADS assessment categories, pág. 1 (líneas 027-029). |
| **Lung‑RADS: yuxtapleural ≤10 mm, liso, sólido → categoría 2** | `getSpecialCategory` (`lungRads.ts:191-199`) | **Sí** | Medio. Fuente: Lung-RADS assessment categories, pág. 1 (líneas 019-022). |
| **Lung‑RADS: airway subsegmental → categoría 2** | `getSpecialCategory` (`lungRads.ts:162-167`) | **Sí** | Medio. Fuente: Lung-RADS 2022 Summary, pág. 2 (nota 11). |
| **Lung‑RADS: airway segmental/proximal → categoría 4A** | `getSpecialCategory` (`lungRads.ts:156-161`) | **Sí** | Alto. Fuente: Lung-RADS 2022 Summary, pág. 2 (nota 11). |
| **Lung‑RADS: airway persistente en 3 meses → categoría 4B** | `getSpecialCategory` (`lungRads.ts:149-155`) | **Sí** | Alto. Fuente: Lung-RADS 2022 Summary, pág. 2 (nota 11). |
| **Lung‑RADS: quiste atípico (engrosado/multilocular) → 4A/4B según crecimiento/nodularidad** | `getSpecialCategory` (`lungRads.ts:175-188`) | **Sí** | Medio. Fuente: Lung-RADS 2022 Summary, pág. 1 (sección I.A). |
| **Lung‑RADS: inflamatorio infeccioso → 0 (1–3 meses) o 2 (benigno)** | `getSpecialCategory` (`lungRads.ts:137-147`) | **Sí** | Medio. Fuente: Lung-RADS 2022 Summary, pág. 2 (sección I.B). |
| **Lung‑RADS: stepped management (3 estable → 2, 4A estable → 3)** | `applySteppedManagement` (`lungRads.ts:77-87`) | **Sí** | Alto. Fuente: Lung-RADS 2022 Summary, pág. 3 (sección III.A, líneas 008-014). |
| **Modelos predictivos: Mayo (coeficientes y exclusiones)** | `buildMayoSummary` (`lib/predictive/index.ts:86-165`) + `coefficients.md` | **Sí** | Medio. Fuente: `coefficients.md` (líneas 3-16). |
| **Modelos predictivos: Brock (PanCan) (coeficientes y contexto screening)** | `buildBrockSummary` (`lib/predictive/index.ts:167-242`) + `coefficients.md` | **Sí** | Medio. Fuente: `coefficients.md` (líneas 19-38). |
| **Modelos predictivos: Herder (post-PET, LR y umbral ≥10%)** | `buildHerderSummary` (`lib/predictive/index.ts:244-340`) + `coefficients.md` | **Sí** | Medio. Fuente: `coefficients.md` (líneas 47-74). |

---

## Hallazgos de traducción/terminología (prioridad)
- **Inconsistencia ES/EN:** “Assessment Wizard”, “Warnings”, “Baseline/Follow‑up”  
  - `app/assessment/page.tsx:7-9`; `ResultsStep.tsx:206`; `RiskStep.tsx:120-129`
- **Disclaimer mixto (EN) en UI ES:**  
  - `config/guidelines.ts:198-215`; `ResultsStep.tsx:287-291`
- **Términos recomendados (glosario mínimo ES):**
  - **“Vidrio esmerilado”** (GGN / no sólido)
  - **“Nódulo subsólido”** (evitar “sub-sólido” con guion)
  - **“Yuxtapleural”** (ok), **“perifisural/perifisural”**: escoger una grafía y mantenerla
  - **“Paquetes‑año”** para pack‑years (si se expone)

---

## Plan de acción

### Quick wins (1–2h)
- Corregir `lang` a ES ([app/layout.tsx](cci:7://file:///home/erosales/proyectos/lungnodules/app/layout.tsx:0:0-0:0)).
- Mejorar “primer error” de validación (recursivo) para no bloquear al usuario.
- Unificar strings visibles más críticos (Warnings/Baseline/Follow‑up).

### Corto plazo (1–2 días)
- Alinear privacidad: texto landing + docs + (opcional) opt‑in analytics + revisar Google Fonts.
- Añadir headers básicos extra en [vercel.json](cci:7://file:///home/erosales/proyectos/lungnodules/vercel.json:0:0-0:0) (Referrer‑Policy, Permissions‑Policy; CSP gradual).

### Medio plazo (1–2 semanas)
- Completar glosario EN/ES para toda la UI visible.
- Estrategia SW: versionado e invalidación para evitar contenido “stale”.

### Pruebas recomendadas (ejemplos)
- Validaciones condicionales: airway/inflammatory/cyst/PET (asegurar mensaje visible).
- Casos frontera: 5.6mm Fleischner (round→6), 1.5mm growth exacto (debe ser “no growth” según tests actuales).

---

## Anexos — Archivos clave
- **Flujo/UI:** [components/wizard/WizardContainer.tsx](cci:7://file:///home/erosales/proyectos/lungnodules/components/wizard/WizardContainer.tsx:0:0-0:0), `ContextStep.tsx`, [RiskStep.tsx](cci:7://file:///home/erosales/proyectos/lungnodules/components/wizard/RiskStep.tsx:0:0-0:0), [NoduleStep.tsx](cci:7://file:///home/erosales/proyectos/lungnodules/components/wizard/NoduleStep.tsx:0:0-0:0), `ResultsStep.tsx`
- **Validación:** [lib/schemas/noduleInput.ts](cci:7://file:///home/erosales/proyectos/lungnodules/lib/schemas/noduleInput.ts:0:0-0:0)
- **Algoritmos:** [lib/algorithms/fleischner.ts](cci:7://file:///home/erosales/proyectos/lungnodules/lib/algorithms/fleischner.ts:0:0-0:0), [lib/algorithms/lungRads.ts](cci:7://file:///home/erosales/proyectos/lungnodules/lib/algorithms/lungRads.ts:0:0-0:0)
- **Predictivo:** `lib/predictive/index.ts`, [research/predictive_model/coefficients.md](cci:7://file:///home/erosales/proyectos/lungnodules/research/predictive_model/coefficients.md:0:0-0:0)
- **Seguridad/Deploy/QA:** [vercel.json](cci:7://file:///home/erosales/proyectos/lungnodules/vercel.json:0:0-0:0), `.github/workflows/*`, `__tests__/*`, [e2e/smoke.spec.ts](cci:7://file:///home/erosales/proyectos/lungnodules/e2e/smoke.spec.ts:0:0-0:0)

---

## Bibliografía
- MacMahon H, Naidich DP, Goo JM, et al. Guidelines for Management of Incidental Pulmonary Nodules Detected on CT Images: From the Fleischner Society 2017. *Radiology*. 2017;284(1):228-243. PDF local: `research/pdf/macmahon-et-al-2017-guidelines-for-management-of-incidental-pulmonary-nodules-detected-on-ct-images-from-the-fleischner.pdf`.
- American College of Radiology. Lung-RADS® Version 2022. Assessment Categories. PDF local: `research/pdf/lung-rads-assessment-categories.pdf`.
- American College of Radiology. Lung-RADS® Version 2022. Summary of Changes. PDF local: `research/pdf/Lung-RADS-2022-Summary.pdf`.
- Swensen SJ, Silverstein MD, Ilstrup DM, Schleck CD, Edell ES. The probability of malignancy in solitary pulmonary nodules. Application to small radiologically indeterminate nodules. *Arch Intern Med*. 1997;157(8):849-855.
- McWilliams A, Tammemagi MC, Mayo JR, et al. Probability of malignancy in pulmonary nodules: a validation study. *Ann Intern Med*. 2013;158(7):495-505.
- Herder GJ, van Tinteren H, Golding RP, et al. Clinical prediction model to characterize pulmonary nodules: validation and added value of 18F-fluorodeoxyglucose positron emission tomography. *Chest*. 2005;128(4):2490-2496.

---

## Estado
- **Revisión clínica completada**: Matriz App vs Fuente trazada a PDFs oficiales (Fleischner 2017 y Lung-RADS v2022).
- **Informe técnico y de traducción listo**.
- **Próximos pasos recomendados**: Implementar quick wins y alinear privacidad/analytics.