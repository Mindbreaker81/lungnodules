# Modelos predictivos — Estado, huecos y pendientes

> **Documento de trabajo** para sesiones de implementación y revisión clínica.  
> **Fuente de verdad de coeficientes e implementación:** [`variables_y_coeficientes.md`](./variables_y_coeficientes.md)  
> **Resumen técnico legible:** [`coefficients.md`](./coefficients.md)  
> **Código:** [`lib/predictive/index.ts`](../../lib/predictive/index.ts)  
> **Inputs / validación:** [`lib/schemas/noduleInput.ts`](../../lib/schemas/noduleInput.ts)  
> **Tests:** [`__tests__/predictive/predictive.test.ts`](../../__tests__/predictive/predictive.test.ts)

Última revisión de este documento: **2026-06-15** (Model 2a implementado; correcciones post-revisión).

---

## Cómo usar este archivo

| Pregunta | Dónde mirar primero |
|----------|---------------------|
| ¿Qué coeficientes están verificados? | [`variables_y_coeficientes.md`](./variables_y_coeficientes.md) §1–3 |
| ¿Qué falta implementar? | Este doc → **§ Pendientes abiertos** |
| ¿Qué cambió en la app y no está en el doc largo? | Este doc → **§ Desfase documentación ↔ código** |
| ¿Qué modelo aplica en cada rama del wizard? | Este doc → **§ Reglas de selección de modelo** |
| ¿Inconsistencias entre docs? | Este doc → **§ Inconsistencias a resolver** |

---

## Reglas de selección de modelo (comportamiento actual en app)

```
Incidental (Fleischner)  →  Mayo (pre-PET)  +  Herder BTS + Herder logístico si hay PET
Screening (Lung-RADS)    →  Brock (pre-PET) +  Herder BTS + Herder logístico si hay PET

Dos variantes Herder (ambas se muestran en igualdad de condiciones):
  - "herder"          → BTS: odds × likelihood ratio (LR)
  - "herder-logistic" → regresión logística publicada (Herder 2005)

Modelo recomendado (UI):
  - Herder (BTS), si status === "available"
  - Si no: Brock (screening) o Mayo (incidental)
```

Implementación: `getRecommendedPredictiveModel()` en `lib/predictive/index.ts`.

**Importante para el usuario clínico:** Mayo **no incluye PET**. Si se rellena FDG-PET, el valor comparable a [MDCalc Mayo + PET](https://www.mdcalc.com/calc/4057/solitary-pulmonary-nodule-spn-malignancy-risk-score-mayo-clinic-model) es **Herder (post-PET)**, no Mayo.

---

## Desfase documentación ↔ código

Cambios en código aún **no reflejados** del todo en `variables_y_coeficientes.md` (última actualización doc: 2026-06-15):

| Cambio | Código | Estado en `variables_y_coeficientes.md` |
|--------|--------|----------------------------------------|
| Herder: umbral mínimo **≥ 4 mm** (rango Mayo/MDCalc) | `MAYO_MIN_DIAMETER_MM = 4` | Parcial (§3a); falta contexto MDCalc |
| Aviso si nódulo **< 8 mm** (validación Herder limitada) | `HERDER_VALIDATED_MIN_DIAMETER_MM = 8` | No documentado como constante |
| Mayo: nota **pre-PET** cuando hay `hasPet` + `petUptake` | `buildMayoSummary` → `notes` | No documentado |
| Modelo **recomendado = Herder** cuando PET calculable | `getRecommendedPredictiveModel` | No documentado |
| Textos UI pre/post-PET | `config/i18n.ts` | Parcial (disclaimer actualizado) |
| Caso regresión 74 a / 7 mm / PET intenso | `predictive.test.ts` | No enlazado |
| Selector 3 estados de espiculación | `NoduleStep.tsx` | Documentado en §2b y en este archivo |
| Modelo 2a sin espiculación (Brock) | `BROCK_COEFFICIENTS_NO_SPIC` | ✅ §2b actualizado 2026-06-15 |
| Comportamiento Lung-RADS con espiculación no evaluable | `lungRads.ts` | Documentado en § Inputs Brock (nota Lung-RADS) |

**Acción residual:** cerrar filas Herder/Mayo pre-PET y mapeo bandas → `ResultsStep.tsx` en `variables_y_coeficientes.md`.

---

## Pendientes abiertos (modelos predictivos)

Resumen alineado con [`variables_y_coeficientes.md` §6](./variables_y_coeficientes.md#6-resumen-de-pendientes).

### P0 — Documentación

1. ~~**Unificar nomenclatura Brock:** ¿Model 1b parsimonioso con espiculación o Model 2b completo con espiculación?~~ ✅ **Resuelto 2026-06-15**  
   - PDF McWilliams Tabla 2: la app implementa **Model 2b** (completo con espiculación). Todos los coeficientes de `BROCK_COEFFICIENTS` coinciden celda a celda.  
   - Comentario en `lib/predictive/index.ts:46` corregido de «parsimonious» a «Model 2b — full model with spiculation» en 2026-06-15.  
   - `coefficients.md` ya describe la fórmula 2b correcta.

2. ~~**Herder logístico (3b):** coeficientes PET distintos entre docs~~ ✅ **resuelto 2026-06-15**:
   - Verificado contra el PDF Herder 2005 (+ Mourato 2020): los correctos son faint +2.322, moderate +4.617, intense +4.771, **sumados al intercepto −4.739** (no al log-odds Mayo). `P_pre` entra como fracción 0–1.
   - Eliminados de `coefficients.md` los valores erróneos 1.439/3.893/5.534.
   - Implementada como segunda variante (`id: "herder-logistic"`).

3. **Mayo:** documentar rango **4–30 mm** (MDCalc); app solo excluye > 30 mm

4. **Tabla inputs obligatorios por modelo** (wizard → campos predictivos)

### P1 — Implementación

| # | Tarea | Fuente | Código destino |
|---|-------|--------|----------------|
| 1 | ~~**Brock sin espiculación** (Model 2a; coeficientes ✅ verificados 2026-06-15)~~ ✅ implementado 2026-06-15 | McWilliams 2013 Tabla 2 / PDF local | `BROCK_COEFFICIENTS_NO_SPIC` + selector de variante + UI 3 estados |
| 2 | ~~(Opcional) **Herder regresión logística**~~ ✅ implementado 2026-06-15 | Herder 2005 Chest / PDF local + Mourato 2020 | `HERDER_LOGISTIC_COEFFICIENTS` + `buildHerderLogisticSummary` (`id: "herder-logistic"`); ambas variantes expuestas |
| 3 | ~~**UX Brock** con/sin espiculación~~ ✅ resuelto 2026-06-15 | — | Control 3 estados en `NoduleStep.tsx` |

Detalle accionable de fuentes: [`variables_y_coeficientes.md` §6.1](./variables_y_coeficientes.md#61-qué-buscar-exactamente-para-cerrar-cada-pendiente).

### P2 — Verificación / anexo guías

- **Mayo:** verificación **primaria** contra PDF Swensen 1997 (hoy solo secundaria vía MDCalc)
- **Lung-RADS:** quiste atípico sigue como **passthrough** (usuario introduce categoría); ver `variables_y_coeficientes.md` §4b

---

## Las 4 variantes Brock (McWilliams 2013) — mapa de cobertura

| Variante | Espiculación | Estado en app | En `variables_y_coeficientes.md` |
|----------|:------------:|:-------------:|:--------------------------------:|
| 1a parsimonioso | No | ⛔ No implementada | No tabulada |
| 1b parsimonioso | Sí | ⛔ No implementada | No tabulada |
| 2a completo | No | ✅ **Implementada** (`BROCK_COEFFICIENTS_NO_SPIC`) | §2b ✅ verificado primario (PDF 2026-06-15) |
| 2b completo | Sí | ✅ **Implementada** (`BROCK_COEFFICIENTS`) | §2a ✅ verificado primario (PDF 2026-06-15) |

**Verificación 2026-06-15** contra `research/pdf/McWilliams - Probability of Cancer in Pulmonary Nodules Detected on First Screening CT.pdf`, Tabla 2:

| Modelo | Intercepto | Edad | Mujer | Fam | Enfisema | Tamaño | GGO | Part-sólido | Lóbulo sup. | Nº nódulos | Espiculación |
|--------|------------|------|-------|-----|----------|--------|-----|-------------|-------------|------------|--------------|
| **2b** (app) | −6.7892 | 0.0287 | 0.6011 | 0.2961 | 0.2953 | −5.3854 | −0.1276 | 0.3770 | 0.6581 | −0.0824 | 0.7729 |
| **2a** (app) | −6.8071 | 0.0321 | 0.5635 | 0.3013 | 0.3462 | −5.6693 | −0.3005 | 0.3395 | 0.7116 | −0.0803 | — |

Transformación de tamaño común (nota † Tabla 2): `−β·[(mm/10)^−0.5 − 1.58113883]`. Edad centrada en 62; recuento centrado en 4.

---

## Inputs por modelo (referencia rápida)

### Mayo (solo incidental)

| Campo | Input app | Notas |
|-------|-----------|-------|
| Edad | `patient.age` | Obligatorio |
| Tabaquismo | `patient.smokingStatus` | current/former = 1; never = 0 |
| Cáncer extratorácico >5 a | `extrathoracicCancerHistory === 'over5y'` | Obligatorio informar (none/over5y/recent) |
| Diámetro | `nodule.diameterMm` | mm; MDCalc 4–30 |
| Espiculación | `nodule.hasSpiculation` | Obligatorio: `true` o `false` (no admite «no evaluable») |
| Lóbulo superior | `nodule.isUpperLobe` | Obligatorio boolean |

**No usa:** sexo, enfisema, factores de riesgo Fleischner, PET.

**Exclusiones:** screening, >30 mm, cáncer conocido, cáncer extratorácico <5 años.

### Brock (solo screening)

| Campo | Input app | Notas |
|-------|-----------|-------|
| Edad | `patient.age` | Centrada en 62 en fórmula |
| Sexo | `patient.sex` | female = 1 |
| Hist. familiar CP | `patient.hasFamilyHistoryLungCancer` | En TC/cuestionario |
| Enfisema en TC | `patient.hasEmphysema` | Visible en TC, no solo EPOC clínico |
| Diámetro | `nodule.diameterMm` | Transformación no lineal |
| Tipo | `nodule.type` | solid / part-solid / ground-glass |
| Lóbulo superior | `nodule.isUpperLobe` | |
| Nº nódulos | `nodule.noduleCount` o 1 si único | Centrado en 4 |
| Espiculación | `nodule.hasSpiculation` | `true`/`false` → Model **2b**; `undefined` (no evaluable) → Model **2a** |

**Exclusiones:** incidental, >30 mm.

**Nota Lung-RADS (espiculación no evaluable):** si `hasSpiculation` es `undefined`, Lung-RADS no escala a **4X** (el campo es falsy) y en yuxtapleural benigno se trata como ausente (`!undefined`). Brock sí usa Model 2a recalibrado. Comportamiento distinto entre guía categórica y modelo predictivo — ver `lungRads.ts:254,337`.

### Herder (post-PET) — dos variantes

Elegibilidad compartida (`evaluateHerderEligibility`):

| Requisito | Regla en app |
|-----------|--------------|
| PET | `nodule.hasPet` + `nodule.petUptake` |
| Diámetro | ≥ 4 mm (rango Mayo); aviso si < 8 mm |
| Pre-test | Mayo (incidental) o Brock (screening) calculable |

| Variante | `id` | Cálculo | Umbral pre-test ≥10% |
|----------|------|---------|----------------------|
| BTS (LR) | `herder` | `odds_post = odds_pre × LR`; `P = odds/(1+odds)` | Sí (criterio BTS) |
| Logística (Herder 2005) | `herder-logistic` | `x = −4.739 + 3.691·P_pre + βFDG`; `P = 1/(1+e^−x)` | No (modelo del paper, sin restricción) |
| Pre-test ≥ 10 % | Criterio BTS; si <10 % → no aplica |
| LR por captación | absent 0.08, faint 0.17, moderate 1.9, intense 9.9 |

**Nota clínica:** Herder validado con pre-test **Mayo**; con Brock (screening) la app advierte evidencia limitada.

---

## Bandas de riesgo y umbrales clínicos

| Concepto | Umbral | Dónde |
|----------|--------|-------|
| Banda baja (app) | < 5 % | `toRiskBand` |
| Banda intermedia | 5–65 % | `toRiskBand` |
| Banda alta | > 65 % | `toRiskBand` |
| Herder: umbral pre-test BTS | ≥ 10 % | `buildHerderSummary` |
| BTS manejo (mencionado, no mapeado en UI) | <10 % vigilancia; >70 % tratamiento | `variables_y_coeficientes.md` §5 |

Falta documentar en `variables_y_coeficientes.md` el mapeo bandas → textos de sugerencia en `ResultsStep.tsx`.

---

## Inconsistencias a resolver (entre archivos)

1. ~~**Brock:** parsimonioso vs completo~~ ✅ resuelto: app = Model **2b** completo (ver § mapa Brock)
2. ~~**Herder 3b:** dos juegos de coeficientes PET~~ ✅ resuelto 2026-06-15 (verificado con PDF Herder 2005; implementado como `herder-logistic`)
3. **`coefficients.md`:** puede quedar desactualizado respecto a `variables_y_coeficientes.md`; este archivo apunta a la jerarquía: **variables_y_coeficientes.md > coefficients.md > código**
4. ~~**Comentario código Brock** (`index.ts:46`): dice «parsimonious» pero es Model 2b completo~~ ✅ corregido 2026-06-15

---

## Casos de regresión útiles (para pedir pruebas)

| Caso | Esperado | Test |
|------|----------|------|
| Mayo: espiculación pesa más que lóbulo superior | P(espiculado LIE) > P(liso LSD) | `Mayo weights spiculation above upper-lobe` |
| Brock: 15 mm screening, transformación no lineal (2b, espic. ausente) | ~25.4 % intermedio | `Brock non-linear size term...` |
| Brock: mismo caso, espiculación no evaluable (2a) | ~29.7 % intermedio | `Brock Model 2a (without spiculation)...` |
| Brock: 2a (undefined) vs 2b (false) mismo nódulo | probabilidades distintas (~29.7 % vs ~25.4 %) | `Brock Model 2a differs from 2b when spiculation is absent vs not evaluable` |
| Mayo: espiculación no evaluable | `insufficient_data` («Espiculación») | `Mayo requires spiculation when not evaluable` |
| Herder: Mayo pre-test + LR moderado | pre ~16.4 %, post ~27 % | `Herder uses Mayo pre-test odds with PET LR` |
| **Usuario 2026-06-15:** 74 a, varón, fumador, 7 mm, lóbulo sup., PET intenso | Mayo **~18.7 %** pre-PET; Herder BTS **~69.6 %** post-PET | `incidental 7 mm with intense PET...` |
| Mismo caso, variante logística (Herder 2005) | Herder logístico **~67.3 %** (`x = −4.739 + 3.691·0.187 + 4.771`) | `Herder logistic variant (Herder 2005)...` |
| Ambas variantes mismo nódulo (PET moderado) | BTS y logística difieren | `both Herder variants are exposed and differ...` |
| MDCalc mismo caso con PET | ~67 % (pequeña diferencia LR/redondeo) | Manual / no automatizado |

---

## Checklist al cerrar un pendiente

- [ ] Actualizar [`variables_y_coeficientes.md`](./variables_y_coeficientes.md) (estado ✅/⛔, fecha, §6)
- [ ] Sincronizar [`coefficients.md`](./coefficients.md) si cambian fórmulas
- [ ] Código en `lib/predictive/index.ts`
- [ ] Test en `__tests__/predictive/predictive.test.ts`
- [ ] Marcar ítem en **este archivo** (§ Pendientes)
- [ ] Si afecta UX: `config/i18n.ts`, `ResultsStep.tsx`
- [ ] Si afecta versión: `CHANGELOG.md` (según flujo del proyecto)

---

## Referencias cruzadas

- Roadmap histórico: [`../predictive-models-roadmap.md`](../predictive-models-roadmap.md)
- PDF Brock: [`../pdf/McWilliams - Probability of Cancer in Pulmonary Nodules Detected on First Screening CT.pdf`](../pdf/McWilliams%20-%20Probability%20of%20Cancer%20in%20Pulmonary%20Nodules%20Detected%20on%20First%20Screening%20CT.pdf)
- Revisión general app: [`../../revision.md`](../../revision.md)
