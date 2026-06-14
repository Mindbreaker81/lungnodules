# Informe de auditoría clínica y técnica: Lung Nodule Decision Support

**Fecha:** 2026-04-11  
**Rama:** `main`  
**Estado auditado:** código actual `1.3.1` tras migración a Shadcn UI y mejoras en modelos predictivos  
**Metodología:** revisión estática de código, contraste documento↔implementación y ejecución de validadores (`lint`, `tsc`, `jest`, `build`, `playwright`, `npm audit`).

---

## 1. Resumen ejecutivo

### Veredicto
La aplicación ha corregido la mayor parte de los hallazgos técnicos, de privacidad, accesibilidad y gobernanza señalados en la revisión previa. Sin embargo, **todavía no debería aprobarse para uso clínico/producción** mientras persistan ambigüedades o desviaciones clínicas en la implementación de `Lung-RADS` y mientras no exista validación radiológica externa de varios atajos morfológicos.

### Decisión de auditoría actualizada
- **Aprobación clínica:** No
- **Aprobación técnica para prototipo interno supervisado:** Sí
- **Aprobación para producción clínica:** No

### Estado general actualizado
**Corregido desde la auditoría previa:**
- `S` de Lung-RADS ya funciona como **modificador aditivo** y no como categoría independiente.
- Fleischner para parte-sólidos con componente sólido `>=6 mm` ya exige **TC confirmatoria a 3-6 meses** antes de PET/biopsia.
- Analytics ya no persiste datos en `localStorage`.
- El service worker ya no usa estrategia clínica `cache-first` amplia.
- El wizard ya no inicia con defaults clínicamente significativos.
- `lang="es"`, `aria-expanded` y los gates de preview/staging ya están corregidos.
- El flujo real ya soporta **categoría 0 por estudio incompleto** en wizard/schema.
- Screening ya no inyecta `patient.age = 0`; la edad pasa a ser opcional y explícita para modelos predictivos.

**Sigue abierto o parcial:**
- Regla de crecimiento Lung-RADS todavía demasiado permisiva en seguimientos largos.
- Manejo de GGN `>=30 mm` estable / slow growth todavía incompleto.
- Atajos perifisural/yuxtapleural pendientes de validación clínica externa.
- Persiste duplicación de validación entre Zod y lógica manual del wizard.
- `npm audit` sigue reportando vulnerabilidades relevantes en dependencias.

---

## 2. Hallazgos resueltos desde la auditoría previa

| Área | Estado | Corrección observada | Evidencia |
| :--- | :--- | :--- | :--- |
| Clínica | Resuelto | `S` modelado como modificador (`2S`, `4AS`, etc.) | `lib/algorithms/lungRads.ts`, `__tests__/algorithms/audit-regression.test.ts` |
| Clínica | Resuelto | Parte-sólidos Fleischner con sólido `>=6 mm` incluyen TC confirmatoria | `lib/algorithms/fleischner.ts` |
| Privacidad | Resuelto | Analytics en memoria de sesión, sin `localStorage` | `lib/analytics/index.ts` |
| Seguridad/Operación | Resuelto | `public/sw.js` usa `network-first` para contenido clínico y caché versionado | `public/sw.js` |
| UX clínica | Resuelto | Eliminados defaults clínicos significativos del wizard | `components/wizard/WizardContainer.tsx` |
| Accesibilidad | Resuelto | Documento HTML en español y toggle con `aria-expanded` | `app/layout.tsx`, `components/LegalFooter.tsx` |
| Gobernanza | Resuelto | Preview/staging ya ejecutan `lint`, `tsc`, `test` y `build` antes de desplegar | `.github/workflows/deploy-preview.yml`, `.github/workflows/deploy-staging.yml` |
| Flujo real | Resuelto | `isIncompleteStudy` ya está cableado en schema y wizard | `lib/schemas/noduleInput.ts`, `components/wizard/NoduleStep.tsx`, `components/wizard/WizardContainer.tsx` |
| Consistencia interna | Resuelto | Eliminada la categoría standalone `S` de schema/config/UI residual | `lib/schemas/noduleInput.ts`, `config/guidelines.ts`, `components/wizard/NoduleStep.tsx` |
| Modelos predictivos | Resuelto | Se eliminó la edad sintética en screening; la edad queda como input opcional real | `components/wizard/RiskStep.tsx`, `components/wizard/WizardContainer.tsx` |

---

## 3. Hallazgos aún abiertos o parciales

| Área | Severidad | Hallazgo vigente | Evidencia | Impacto |
| :--- | :--- | :--- | :--- | :--- |
| Clínica | ~~Alta~~ ✅ Resuelto (2026-06-14) | ~~La regla de crecimiento de Lung-RADS clasificaba con `delta >= 1.5 mm`~~ → corregido a `delta > 1.5 mm` conforme a ACR v2022 | `calculateGrowth()` en `lib/algorithms/lungRads.ts` | — |
| Clínica | Alta | Los GGN `>=30 mm` dependen de `priorCategory/priorStatus` para step-down y no separan de forma explícita el escenario de slow growth | `classifyGroundGlass()` y `applySteppedManagement()` en `lib/algorithms/lungRads.ts` | Puede dejar manejo incompleto en seguimientos complejos |
| Clínica | Media-Alta | Los atajos perifisural/yuxtapleural siguen necesitando revisión radiológica externa | `lib/algorithms/fleischner.ts`, `lib/algorithms/lungRads.ts` | Riesgo de aplicar excepciones benignas fuera del patrón típico |
| Gobernanza | Media | Persiste mezcla de validación Zod + lógica manual por paso | `lib/schemas/noduleInput.ts`, `components/wizard/WizardContainer.tsx` | Riesgo de divergencia futura entre UI y dominio |
| Dependencias | Alta | `npm audit` mantiene vulnerabilidades en dependencias transitivas y en `next` | `package-lock.json`, salida de `npm audit` | Riesgo de seguridad y necesidad de plan de actualización |

---

## 4. Validación ejecutada en esta actualización

| Comando | Resultado | Notas |
| :--- | :--- | :--- |
| `npm run lint` | Pasa | Sin errores |
| `npx tsc --noEmit` | Pasa | Sin errores de tipos |
| `npm test --runInBand` | Pasa | `111/111` tests en verde |
| `npm run build` | Pasa | Build de producción correcta con Next.js 16.1.6 |
| `npm run test:e2e` | Pasa | `4/4` smoke tests verdes tras instalar Chromium con `npx playwright install chromium` |
| `npm audit` | Falla | `11` vulnerabilidades (`1` crítica, `4` altas, `2` moderadas, `4` bajas) |

---

## 5. Alineaciones aplicadas en esta actualización

- **Schema/UI Lung-RADS:** retirada la `S` standalone de categorías previas y etiquetado consistente como modificador.
- **Categoría 0 real:** añadido soporte funcional a `isIncompleteStudy` en schema y wizard, permitiendo completar el flujo sin diámetro fiable.
- **Modelos predictivos en screening:** eliminada la edad sintética; ahora la edad es opcional y explícita para Brock.
- **Export/copy robustness:** resultados y exportaciones toleran ausencia de edad o diámetro cuando el caso es incompleto.
- **Tablas/config:** `config/guidelines.ts` ya refleja la TC confirmatoria de Fleischner y separa categorías de modificadores.
- **Textos residuales:** actualizados comentarios/metadatos obsoletos en analytics y disclaimers.

---

## 6. Conclusión

El proyecto queda ahora **más consistente entre código, UI, configuración y documentación técnica** que en la auditoría previa. La deuda principal restante ya no está en privacidad o accesibilidad básica, sino en la **validación clínica fina de Lung-RADS/Fleischner y en el endurecimiento de dependencias** antes de cualquier liberación con aspiración asistencial real.
