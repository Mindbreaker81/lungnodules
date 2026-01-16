# TODO – Lung Nodule Follow-Up Decision Support Tool

Derived from PRD v1.0 (Jan 2026).

## 0. Fundamentos del proyecto
- [x] Inicializar base Next.js 14+ con TypeScript, Tailwind, shadcn/ui; ESLint/Prettier.
- [x] Configurar layout y páginas `/` (landing) y `/assessment` (wizard).
- [x] Definir estructura de carpetas (app/, components/ui, components/wizard, lib/algorithms, lib/schemas, config/, __tests__/, public/manifest.json).
- [x] Actualizar Next.js a ^14.2.35 (mitigación vulnerabilidades audit).

## 1. Tipos y validación
- [x] Tipos compartidos (ClinicalContext, NoduleType, RiskLevel, ScanType, PatientProfile, NoduleCharacteristics, LungRADSInput, AssessmentResult).
- [x] Esquemas Zod para inputs con validaciones de rango y consistencia.
- [x] Mensajes de error específicos (diámetro, solid component, edad ≥35 para Fleischner).

## 2. Algoritmos clínicos
- [x] Chequeo de aplicabilidad Fleischner (edad ≥35, sin malignidad conocida, no inmunocomprometido).
- [x] Árbol completo Fleischner 2017 (sólido single/múltiple, GGN, part-solid; riesgo alto/bajo).
- [x] Lógica Lung-RADS v2022 (clasificación sólida/sub-sólida, growth >1.5mm/12m, new vs baseline, stepped management).
- [x] Selector automático de guía según contexto; exclusiones y advertencias.

## 3. Wizard UI/UX
- [x] WizardContainer con flujo Context → Risk/Scan → Nodule → Results.
- [x] Step Context (incidental vs screening) y guía aplicada.
- [x] Step Risk/Scan (edad/riesgo o baseline/follow-up + prior size, tooltips de factores).
- [x] Step Nodule (tipo, diámetro, solid component, single/múltiple, flags especiales).
- [x] Step Results (categoría, recomendación, intervalo, modalidad, riesgo, rationale, warnings, copiar/exportar).
- [x] Responsive/mobile-first; navbar inferior móvil; colores médicos; disclaimer visible.
- [x] Accesibilidad WCAG 2.1 AA (aria-labels, focus-visible, contraste).

## 4. Lógica de estado y validación en UI
- [x] React Hook Form + Zod resolver; bloqueo de avance si inválido (botones deshabilitados y alerta de error).
- [x] Cálculo de growth y re-clasificación stepped management (UI, mensajes).
- [x] Manejo de edge cases (solid component ≤ total, nódulo dominante en múltiples, mensajes claros).

## 5. Testing
- [x] Unit tests algoritmos Fleischner (TC-F-001..009).
- [x] Unit tests Lung-RADS (TC-LR-001..008).
- [x] Integration tests wizard (flujos feliz incidental/screening, validaciones).
- [x] E2E Playwright (desktop y móvil; ingreso → resultado → copiar).
- [x] Regresión de stepped management y growth. (35 nuevos tests en lungRads.regression.test.ts)

## 6. Rendimiento y NFRs
- [x] Optimizar FCP/TTI (<1.5s/<2.5s), Lighthouse >90 (code splitting, cache assets). (lighthouserc.json configurado)
- [x] HTTPS + headers de seguridad. (vercel.json)
- [x] Sin persistir datos ni PII; todo en cliente.
- [x] PWA: manifest, service worker (cache-first assets, network-first HTML), indicador offline mejorado con analytics.

## 7. Config y despliegue
- [x] config/guidelines.ts con parámetros/tablas completas (269 líneas: thresholds, categories, management tables, disclaimers).
- [x] vercel.json según PRD.
- [x] Pipeline: previews PR, staging (develop), producción (main). (GitHub Actions en .github/workflows/)

## 8. Analytics y métricas
- [x] Instrumentar eventos: assessment_started, assessment_completed, result_copied, error_displayed. (lib/analytics/)
- [x] Medir time-to-result, uso móvil, retorno semanal, NPS in-app. (NPSModal.tsx, analytics metrics)

## 9. Validación clínica y contenido
- [x] Mostrar versión de guías en resultados; log de versión en cada recomendación. (GuidelineVersion.tsx)
- [x] Paquete de 40+ casos para panel de expertos. (lib/validation/clinicalCases.ts)
- [x] Disclaimer médico en pantalla de resultados y exportable. (Disclaimer.tsx, ExportResults.tsx)

## 10. Hallazgos pendientes (auditoría clínica)
- [x] Añadir inputs UI para exclusiones Fleischner (cáncer conocido, inmunocompromiso) y bloquear cálculo si aplica.
- [x] Implementar reglas Lung-RADS v2022 especiales: nódulos de vía aérea, quistes pulmonares atípicos, yuxtapleurales, infeccioso/inflamatorio, categorías 0/1/4X/S.
- [x] Implementar manejo Fleischner para sub-sólidos múltiples (GGN/part-solid) y exención perifissural cuando aplique.
- [x] Exponer stepped management en UI (priorCategory/priorStatus) y validaciones asociadas.
- [x] Ajustar medición Fleischner a redondeo en mm.
- [ ] Mensajes de crecimiento ≥2 mm (Fleischner) y mantener decimales en Lung-RADS.
- [ ] Unificar terminología clínica en UI (GGN/no sólido, parte-sólido, sub-sólido) con tooltips claros.
- [ ] Mostrar componente GuidelineVersion en resultados y exportes (no se renderiza actualmente).
- [ ] Evaluar módulo de modelos predictivos (Mayo/Brock/Herder) como feature de roadmap.
- [x] Añadir tests para reglas especiales y exclusiones (airway/quistes/juxtapleural/perifissural/sub-sólidos múltiples/UI exclusions).

## 11. Plan de implementación (prioridad clínica)
- [x] Fase 1 — Correcciones críticas: exclusiones Fleischner en UI, reglas Lung-RADS especiales, sub-sólidos múltiples Fleischner, perifissural benigno, tests nuevos.
- [ ] Fase 2 — Exactitud operativa: redondeo Fleischner y growth ≥2 mm, stepped management en UI.
- [ ] Fase 3 — UI/UX: terminología clínica unificada y tooltips.
- [ ] Fase 4 — Roadmap: modelos predictivos (Mayo/Brock/Herder).

## 12. Lanzamiento
- [ ] Staging hardening: accesibilidad, performance, smoke E2E.
- [ ] Producción: despliegue, verificación PWA, analytics activos, documentación final.

## 13. Post-lanzamiento
- [ ] Monitoreo de errores (Sentry), métricas de uso (Google Analytics), feedback de usuarios.