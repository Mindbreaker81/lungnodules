# Modelos predictivos de malignidad — Variables, coeficientes y estado de verificación

> Documento de estado para Mayo, Brock/PanCan y Herder (modelos de probabilidad) y,
> como anexo de trazabilidad, Fleischner 2017 y Lung-RADS v2022 (guías de manejo
> categóricas, sin coeficientes). Registra **qué está implementado**, **qué coeficiente
> está verificado contra la publicación original** (con su fuente) y **qué falta por
> verificar/implementar**.
>
> Última actualización: 2026-06-14.

## Leyenda de estado

| Marca | Significado |
| :---: | :--- |
| ✅ **Verificado** | Coeficiente contrastado en esta revisión contra la publicación original o fuentes secundarias fiables (MDCalc, PMC, NEJM, meta-análisis). |
| 🟡 **Implementado, fuente interna** | En uso en la app, pero su única fuente es un documento interno; conviene re-verificar contra el paper. |
| ⛔ **Pendiente / no verificado** | Necesario para una variante aún no implementada; **no** debe hardcodearse sin la cifra del paper. |

Mapeo de código: todos los modelos viven en [`lib/predictive/index.ts`](../../lib/predictive/index.ts).
Las entradas (inputs) se validan en [`lib/schemas/noduleInput.ts`](../../lib/schemas/noduleInput.ts).

---

## 1. Mayo Clinic (Swensen et al., Arch Intern Med 1997;157:849-855) — ✅ implementado y verificado

Probabilidad: `P = e^x / (1 + e^x)`

`x = -6.8272 + 0.0391·Edad + 0.7917·Tabaco + 1.3388·Cáncer + 0.1274·Diámetro + 1.0407·Espiculación + 0.7838·LóbuloSup`

| Variable | Coef. | Estado | Codificación / input | Fuente de verificación |
| :--- | :--- | :---: | :--- | :--- |
| Intercepto | −6.8272 | ✅ | — | Swensen 1997 (Table 2) / MDCalc |
| Edad | 0.0391 | ✅ | años (`patient.age`) | Swensen 1997 / MDCalc |
| Tabaquismo | 0.7917 | ✅ | 1 = fumador actual o ex-fumador; 0 = nunca (`patient.smokingStatus`) | Swensen 1997 / MDCalc |
| Cáncer extratorácico | 1.3388 | ✅ | 1 = diagnóstico **> 5 años** antes; 0 = no (`patient.extrathoracicCancerHistory === 'over5y'`) | Swensen 1997 / MDCalc |
| Diámetro | 0.1274 | ✅ | mm (`nodule.diameterMm`) | Swensen 1997 / MDCalc |
| Espiculación | 1.0407 | ✅ | 1 = presente; 0 = no (`nodule.hasSpiculation`) | Swensen 1997 / MDCalc |
| Lóbulo superior | 0.7838 | ✅ | 1 = lóbulo superior (der. o izq.); 0 = medio/inferior (`nodule.isUpperLobe`) | Swensen 1997 / MDCalc |

> **Nivel de verificación:** secundario (MDCalc *Solitary Pulmonary Nodule Malignancy Risk – Mayo Clinic Model* + valores de Swensen 1997 ampliamente reproducidos). No contrastado contra el PDF original del paper en esta sesión (acceso de red restringido). Coincide con la fórmula codificada en `lib/predictive/index.ts:36-44`.

**Exclusiones aplicadas en la app:** contexto incidental (Fleischner); no aplicar a masas > 30 mm; no aplicar con cáncer de pulmón conocido; no aplicar si cáncer extratorácico < 5 años.

**Corrección 2026-06-13:** espiculación (0.71 → 1.0407) y lóbulo superior (1.138 → 0.7838) estaban intercambiados y con valores erróneos.

---

## 2. Brock / PanCan (McWilliams et al., NEJM 2013;369:910-919)

El modelo Brock tiene **cuatro fórmulas**: {parsimonioso, completo} × {con espiculación, sin espiculación}. Particularidades clave frente a Mayo:

- El **tamaño** entra mediante una **transformación no lineal**, no linealmente.
- La **edad** se centra en 62: `(Edad − 62)`.
- El **número de nódulos** se centra en 4: `(Nº − 4)` (coeficiente negativo: más nódulos ⇒ menor riesgo de que *uno* sea cáncer primario).

### 2a. Variante CON espiculación — ✅ implementada y verificada

`x = -6.7892 + 0.0287·(Edad−62) + 0.6011·Mujer + 0.2961·HistFamiliar + 0.2953·Enfisema − 5.3854·[(Tamaño/10)^−0.5 − 1.58113883] + Tipo + 0.6581·LóbuloSup − 0.0824·(Nº−4) + 0.7729·Espiculación`

| Variable | Coef. | Estado | Codificación / input | Fuente de verificación |
| :--- | :--- | :---: | :--- | :--- |
| Intercepto | −6.7892 | ✅ | — | McWilliams 2013 (modelo completo con espiculación, Model 2b) / meta-análisis Brock 2024 |
| Edad (centrada) | 0.0287 × (Edad − 62) | ✅ | años (`patient.age`) | McWilliams 2013 / calculadora Brock (BC Cancer) |
| Sexo femenino | 0.6011 | ✅ | 1 = mujer; 0 = hombre (`patient.sex`) | McWilliams 2013 |
| Historia familiar cáncer pulmón | 0.2961 | ✅ | 1/0 (`patient.hasFamilyHistoryLungCancer`) | McWilliams 2013 |
| Enfisema (en TC) | 0.2953 | ✅ | 1/0; visible en TC, no solo EPOC clínico (`patient.hasEmphysema`) | McWilliams 2013 |
| Tamaño (transformado) | −5.3854 × [(mm/10)^−0.5 − 1.58113883] | ✅ | mm (`nodule.diameterMm`) | McWilliams 2013 / calculadora Brock |
| Tipo: parte-sólido | 0.377 | ✅ | 1 si parte-sólido; sólido es referencia (`nodule.type === 'part-solid'`) | McWilliams 2013 |
| Tipo: no sólido (VME/GGO) | −0.1276 | ✅ | 1 si vidrio esmerilado (`nodule.type === 'ground-glass'`) | McWilliams 2013 |
| Lóbulo superior | 0.6581 | ✅ | 1/0 (`nodule.isUpperLobe`) | McWilliams 2013 |
| Nº de nódulos (centrado) | −0.0824 × (Nº − 4) | ✅ | entero (`nodule.noduleCount`); solitario = 1 ⇒ +0.2472 | McWilliams 2013 |
| Espiculación | 0.7729 | ✅ | 1/0 (`nodule.hasSpiculation`) | McWilliams 2013 |

> **Nivel de verificación:** primario/secundario (tabla 2 de McWilliams 2013 disponible en PMC/NEJM y coeficientes reproducidos en el suplemento del meta-análisis de Clinical Radiology 2024). **Corrección documental 2026-06-14:** estos coeficientes corresponden al **modelo completo con espiculación (Model 2b)**, no al parsimonioso 1b. Referencias concretas usadas: PMID/PMC McWilliams 2013 (`https://pmc.ncbi.nlm.nih.gov/articles/PMC3951177/`) y suplemento Clinical Radiology 2024 (`https://www.clinicalradiologyonline.net/cms/10.1016/j.crad.2024.106788/attachment/0337a514-fedd-4ca3-8cbc-c23fbb71dd88/mmc3.pdf`). Coincide con `lib/predictive/index.ts:51-66`.

**Exclusiones aplicadas:** contexto screening (Lung-RADS); no aplicar a masas > 30 mm.

**Corrección 2026-06-13:** se pasó de un coeficiente lineal de tamaño (0.0546·mm) a la transformación no lineal; se centró edad en 62 y recuento en 4; se corrigieron intercepto (−8.4852 → −6.7892), espiculación (0.3543 → 0.7729) y lóbulo superior (0.3138 → 0.6581).

### 2b. Variante SIN espiculación — ⛔ pendiente (no implementada)

Misma estructura que 2a pero **sin el término de espiculación** y con **intercepto y coeficientes re-calibrados** (no se reutilizan los de 2a). Las variables son idénticas salvo que se elimina `Espiculación`.

| Variable | Coef. | Estado |
| :--- | :--- | :---: |
| Intercepto | _por verificar_ | ⛔ |
| Edad (centrada en 62) | _por verificar_ | ⛔ |
| Sexo femenino | _por verificar_ | ⛔ |
| Historia familiar | _por verificar_ | ⛔ |
| Enfisema | _por verificar_ | ⛔ |
| Tamaño (transformado, exponente −0.5 y offset 1.58113883) | _por verificar_ | ⛔ |
| Tipo: parte-sólido / no sólido | _por verificar_ | ⛔ |
| Lóbulo superior | _por verificar_ | ⛔ |
| Nº de nódulos (centrado en 4) | _por verificar_ | ⛔ |
| ~~Espiculación~~ | (ausente en esta variante) | — |

**Fuente a consultar:** tabla 2 de McWilliams 2013 (NEJM/PMC: `https://pmc.ncbi.nlm.nih.gov/articles/PMC3951177/`) y suplemento/meta-análisis de Clinical Radiology 2024 (`https://www.clinicalradiologyonline.net/cms/10.1016/j.crad.2024.106788/attachment/0337a514-fedd-4ca3-8cbc-c23fbb71dd88/mmc3.pdf`). Cifras vistas en fuentes públicas, pero **pendiente de transcripción controlada** antes de implementar para evitar mezclar modelo parsimonioso (1a) y completo (2a).

**Plan de implementación cuando haya cifras:** añadir un segundo bloque de coeficientes `BROCK_COEFFICIENTS_NO_SPIC` y seleccionar la variante según disponibilidad/fiabilidad de la evaluación de espiculación (p. ej. un flag de UI o automáticamente cuando `hasSpiculation` no se haya informado).

---

## 3. Herder (Herder et al., Chest 2005;128:2490-2496)

### 3a. Variante bayesiana (LR de FDG-PET) — ✅ implementada; **es el método original del paper**

El Herder original toma la probabilidad **pre-test** (Mayo en incidental, Brock en screening), la convierte a odds y la multiplica por el *likelihood ratio* (LR) del nivel de captación FDG:

```
O_pre  = P_pretest / (1 − P_pretest)
O_post = O_pre × LR
P_Herder = O_post / (1 + O_post)
```

| Captación FDG | Definición | LR | Estado | Fuente de verificación |
| :--- | :--- | :---: | :---: | :--- |
| Ausente | ≤ fondo pulmonar | 0.08 | ✅ | Herder 2005 (Chest, Table 4) |
| Leve | > pulmón, ≤ pool mediastínico | 0.17 | ✅ | Herder 2005 |
| Moderada | > pool mediastínico | 1.9 | ✅ | Herder 2005 |
| Intensa | muy superior al pool | 9.9 | ✅ | Herder 2005 |

> **Nivel de verificación:** secundario (LR de FDG-PET reproducidos en guías BTS 2015 de nódulo pulmonar y en MDCalc/literatura derivada). Coincide con `lib/predictive/index.ts:68-73`.

**Requisitos en la app:** PET-CT disponible, nódulo ≥ 8 mm, riesgo pre-test ≥ 10% (criterio BTS), no aplicar a masas > 30 mm. Input: `nodule.hasPet`, `nodule.petUptake`.

**Nota:** multiplicar odds por un LR equivale a sumar `ln(LR)` al log-odds pre-test. El uso de Herder con pre-test Brock (screening) tiene evidencia limitada (validado originalmente con Mayo) — la app ya lo advierte.

### 3b. Variante de regresión logística publicada — 🟡 documentada, NO implementada

Además del uso bayesiano con LR, fuentes secundarias reproducen una fórmula logística de Herder basada en la probabilidad Mayo/Swensen y captación PET (referencias usadas: PubMed Herder 2005 `https://pubmed.ncbi.nlm.nih.gov/16236914/` y revisión con ecuaciones de modelos `https://pmc.ncbi.nlm.nih.gov/articles/PMC7159041/`):

`x = -4.739 + 3.691·P_Mayo + PET`

| Captación | Coef. PET en fórmula logística | Estado |
| :--- | :--- | :---: |
| Ausente | 0 (referencia) | 🟡 sin verificar |
| Leve | +2.322 | 🟡 documentado en fuentes secundarias |
| Moderada | +4.617 | 🟡 documentado en fuentes secundarias |
| Intensa | +4.771 | 🟡 documentado en fuentes secundarias |

**Por qué no se implementa:**
1. La app ya implementa Herder como ajuste bayesiano con LR de FDG-PET, que es explícito y trazable a BTS/Herder.
2. Esta variante produce resultados distintos y usa `P_Mayo` (probabilidad 0-1, no el log-odds de Mayo) como predictor; requiere decidir si se expondrá como alternativa clínica o sustituirá al método actual.
3. No debe mezclarse con la `x` de Mayo ni con los coeficientes antiguos del documento interno.

**Para implementarla de forma legítima** se necesita confirmación final contra el paper original de Herder 2005 y una decisión de UX/API sobre si habrá dos variantes Herder.

---

## 4. Guías de manejo: Fleischner 2017 y Lung-RADS v2022

> ⚠️ A diferencia de Mayo/Brock/Herder, **estas dos no son modelos de regresión y no
> tienen coeficientes**: son árboles de decisión categóricos basados en umbrales de
> tamaño, tipo de nódulo, multiplicidad, crecimiento y nivel de riesgo. No producen una
> probabilidad %, sino una **categoría + recomendación de seguimiento**. Se documentan
> aquí para completar la trazabilidad de fuentes.

### 4a. Fleischner 2017 — ✅ implementada ([`lib/algorithms/fleischner.ts`](../../lib/algorithms/fleischner.ts))

Para **nódulos incidentales** en pacientes **≥ 35 años**, sin malignidad conocida ni
inmunocompromiso (exclusiones en `checkFleischnerApplicability`, líneas 15-26).

| Eje de decisión | Umbrales / valores implementados | Estado | Código |
| :--- | :--- | :---: | :--- |
| Edad mínima | ≥ 35 años | ✅ | `fleischner.ts:16` |
| Corte de tamaño | 6 mm y 8 mm | ✅ | `assessSolidSingle`, etc. |
| Tipo de nódulo | sólido / vidrio deslustrado / semi-sólido | ✅ | `assessFleischner` |
| Componente sólido (semi-sólido) | umbral 6 mm | ✅ | `assessPartSolid:220` |
| Multiplicidad | único vs múltiple (nódulo dominante) | ✅ | `assessSolidMultiple`, `assessSubsolidMultiple` |
| Nivel de riesgo | bajo / alto (modula seguimiento) | ✅ | `riskLevel` |
| Perifisural benigno | sólido ≤ 10 mm ⇒ sin seguimiento | ✅ | `assessFleischner:259` |

> **Nivel de verificación: PRIMARIO** (auditado celda a celda el 2026-06-14 contra las
> tablas 1-2 de MacMahon et al. 2017). Cobertura de tests: `__tests__/algorithms/fleischner.test.ts` (todos en verde).
>
> **Cotejo de la matriz (sólido único / múltiple, GGN, semi-sólido):** todas las celdas
> coinciden con la guía —incluidas las recomendaciones de seguimiento por nivel de riesgo
> (bajo/alto), la regla perifisural ≤10 mm, y los intervalos (sin seguimiento / 12 m
> opcional / 6-12 m / 3-6 m / anual ×5 a / c-2 a hasta 5 a). **Sin discrepancias.**
>
> Notas de implementación (no son errores, son decisiones explícitas):
> - El tamaño se redondea al mm más próximo (`roundToNearestMm`); la guía usa diámetro
>   medio y equivalencias de volumen (100/250 mm³ ≈ 6/8 mm). Efecto despreciable.
> - El umbral del componente sólido (6 mm) y el corte único 8 mm están correctos.

### 4b. Lung-RADS v2022 — ✅ implementada ([`lib/algorithms/lungRads.ts`](../../lib/algorithms/lungRads.ts))

Para **cohortes de screening** (`patient.clinicalContext === 'screening'`, línea 256).
Asigna categorías 0/1/2/3/4A/4B/4X (+ modificador `S`).

| Eje de decisión | Umbrales / valores implementados | Estado | Código |
| :--- | :--- | :---: | :--- |
| Crecimiento | aumento absoluto **> 1.5 mm** | ✅ | `GROWTH_THRESHOLD_MM_PER_12M:8` |
| Intervalo prolongado | > 18 meses (advertencia) | ✅ | `LONG_INTERVAL_THRESHOLD_MONTHS:10` |
| Sólido baseline | <6 → C2; 6–<8 → C3; 8–<15 → C4A; ≥15 → C4B | ✅ | `classifySolidLungRADS` |
| Sólido nuevo (follow-up) | <4 → C2; 4–<6 → C3; 6–<8 → C4A; ≥8 → C4B | ✅ | `classifySolidLungRADS` |
| Vidrio deslustrado | <30 mm → C2; ≥30 mm → C3 | ✅ | `classifyGroundGlass` |
| Semi-sólido (componente sólido) | <6 → C3; 6–<8 → C4A; ≥8 → C4B | ✅ | `classifyPartSolid` |
| Espiculación | sube C3/4A/4B → **4X** | ✅ | `assessLungRads:311` |
| Manejo escalonado | C3 estable→C2; C4A estable→C3 | ✅ | `applySteppedManagement` |
| Modificador `S` | hallazgo significativo (sufijo aditivo) | ✅ | `assessLungRads:321` |
| Categorías especiales | 0 (incompleto), 1 (benigno), inflamatorio, vía aérea, quiste atípico, yuxtapleural | ✅ | `getSpecialCategory` |

> **Nivel de verificación: PRIMARIO** para la matriz de tamaño (auditado el 2026-06-14
> contra ACR Lung-RADS v2022). Cobertura: `lungRads.test.ts` + `lungRads.regression.test.ts` (verde).
>
> **Matriz de tamaño verificada (coincide con la guía):**
>
> | Categoría | Regla oficial v2022 | Código | OK |
> | :-- | :-- | :-- | :--: |
> | 2 | Sólido baseline <6 mm; nuevo <4 mm | `<6` / nuevo `<4` | ✅ |
> | 3 | Sólido baseline 6–<8 mm; nuevo 4–<6 mm | idem | ✅ |
> | 4A | Sólido baseline 8–<15 mm; nuevo 6–<8 mm; en crecimiento <8 mm | idem | ✅ |
> | 4B | Sólido baseline ≥15 mm; nuevo/creciente ≥8 mm | idem | ✅ |
> | GGN | <30 mm → C2; ≥30 mm → C3 | idem | ✅ |
> | Semi-sólido (sólido) | <6 → C3; 6–<8 → C4A; ≥8 → C4B | idem | ✅ |
> | 4X | C3/4A/4B + rasgo sospechoso (espiculación) | idem | ✅ |
> | S | modificador aditivo por hallazgo significativo | idem | ✅ |
>
> **Hallazgo corregido (2026-06-14) — definición de crecimiento:**
> Lung-RADS v2022 define crecimiento como aumento **> 1.5 mm**. El código usaba
> `delta >= 1.5`; se cambió a `delta > 1.5` (`lungRads.ts:23`) para alinearse con la guía
> (un crecimiento de exactamente 1.5 mm ya **no** se marca como creciente). Test
> `TC-GR-002` actualizado y añadido `TC-GR-002b`; suite en verde.
>
> **Cotejo de categorías especiales y manejo escalonado (2026-06-14) — PDFs locales ACR
> (`research/pdf/Lung-RADS-2022-Summary.pdf` y
> `research/pdf/lung-rads-assessment-categories.pdf#_~_text=Solid nodule_ • ≥ 6,at baseline OR.pdf`).
> URL oficial ACR del resumen usado como referencia documental:
> `https://cs.acr.org/-/media/ACR/Files/RADS/Lung-RADS/Lung-RADS-2022-Summary-_Final.pdf`.**
> Resultado:
>
> | Bloque | Regla oficial v2022 | Código | Estado |
> | :-- | :-- | :-- | :--: |
> | Vía aérea subsegmental | C2 (suele ser tapón mucoso/inflamatorio) | `subsegmental → 2` | ✅ PRIMARIO |
> | Vía aérea tubular/múltiple probablemente infecciosa sin nódulo obstructivo | C0 o C2 a discreción | `airwayInflammatoryOrInfectious → 0` | ✅ PRIMARIO |
> | Vía aérea segmental/proximal | C4A | `segmental-proximal → 4A` | ✅ PRIMARIO |
> | Vía aérea persistente a 3 m | C4A→C4B | `airwayPersistent → 4B` | ✅ PRIMARIO |
> | Manejo escalonado | C3/C4A estables o decrecientes → "next lowest" (C2/C3 resp.), **excepto vía aérea** | `3→2`, `4A→3` para `stable/decreasing`; vía aérea sale por rama especial antes | ✅ PRIMARIO |
> | Semi-sólido baseline | sólido <6→C3, 6–<8→C4A, ≥8→C4B | idem | ✅ PRIMARIO |
> | Semi-sólido nuevo/creciente | componente sólido <4→C4A; ≥4→C4B | implementado | ✅ PRIMARIO |
> | Crecimiento lento sólido/semi-sólido | crecimiento en múltiples estudios sin >1.5 mm/12 m → puede ser C4B | `isSlowGrowing → 4B` para sólido/semi-sólido | ✅ PRIMARIO |
> | Crecimiento lento GGN | puede mantenerse C2 hasta cumplir otra categoría | `isSlowGrowing → 2` para GGN | ✅ PRIMARIO |
> | Quiste atípico | descriptores 4B = quiste multilocular/pared gruesa en crecimiento | el código **no clasifica**, recibe `atypicalCystCategory` del usuario (passthrough); etiquetas coherentes con la guía | 🟡 passthrough |
>
> **Pendiente residual:** quiste atípico sigue como passthrough porque la app pide la categoría
> interpretada al usuario; no deriva automáticamente todos los descriptores morfológicos de quiste.

---

## 5. Bandas de riesgo (comunes a los tres modelos)

| Banda | Probabilidad | Implementado |
| :--- | :--- | :---: |
| Bajo | < 5% | ✅ |
| Intermedio | 5–65% | ✅ |
| Alto | > 65% | ✅ |

(`toRiskBand` en `lib/predictive/index.ts`.) Para Herder, BTS usa además umbrales clínicos de manejo: < 10% vigilancia, > 70% tratamiento.

---

## 6. Resumen de pendientes

| # | Tarea | Bloqueo |
| :-: | :--- | :--- |
| 1 | Coeficientes Brock **sin espiculación** | Transcripción controlada de McWilliams 2013 / Clinical Radiology 2024 y decisión de variante |
| 2 | (Opcional) Herder regresión logística (3b) | Confirmar contra paper original y decidir si exponer variante alternativa |
| 3 | Decidir UX del selector con/sin espiculación en Brock | — |
| 4 | ~~Lung-RADS: alinear crecimiento `>= 1.5` → `> 1.5` mm~~ ✅ corregido 2026-06-14 | — |
| 5 | ~~Lung-RADS: part-solid nuevo/creciente, crecimiento lento, decreciente y vía aérea C0~~ ✅ verificado/implementado 2026-06-14 | — |

### 6.1. Qué buscar exactamente para cerrar cada pendiente

> Detalle accionable: **fuente concreta**, **dato numérico** que falta y **dónde se aplicaría** en el código.

**Pendiente #1 — Brock SIN espiculación (coeficientes)**
- **Fuente:** McWilliams A, et al. *NEJM* 2013;369:910-919 → tabla 2 y/o meta-análisis *Clinical Radiology* 2024 (S0009-9260(24)00675-5) que reproduce las cuatro variantes.
- **Datos a extraer (recomendado: modelo completo sin espiculación, Model 2a, para ser consistente con el Model 2b actualmente implementado):** intercepto + coeficientes de edad (centrada en 62), sexo femenino, historia familiar, enfisema, término de tamaño (confirmar exponente −0.5 y offset 1.58113883), tipo (parte-sólido / no sólido), lóbulo superior y nº de nódulos (centrado en 4). **NO reutilizar** los de la variante con espiculación: están re-calibrados.
- **Dónde:** nuevo bloque `BROCK_COEFFICIENTS_NO_SPIC` en `lib/predictive/index.ts` + selección de variante.

**Pendiente #2 — Herder regresión logística (opcional)**
- **Fuente:** Herder GJ, et al. *Chest* 2005;128:2490-2496 → fórmula logística con probabilidad Mayo/Swensen (%) y términos PET.
- **Datos a confirmar:** intercepto −4.739, multiplicador 3.691 para `P_Mayo` como probabilidad 0-1, y términos PET 0 / 2.322 / 4.617 / 4.771.
- **Decisión antes de código:** mantener solo Herder bayesiano con LR o exponer dos variantes Herder.

---

## 7. Referencias

**Modelos predictivos (probabilidad):**
- Swensen SJ, et al. The probability of malignancy in solitary pulmonary nodules. *Arch Intern Med.* 1997;157(8):849-855. *(Mayo)*
- McWilliams A, et al. Probability of cancer in pulmonary nodules detected on first screening CT. *N Engl J Med.* 2013;369(10):910-919. *(Brock/PanCan)* — PMC: `https://pmc.ncbi.nlm.nih.gov/articles/PMC3951177/`
- Pulmonary nodule malignancy probability: a meta-analysis of the Brock model. *Clinical Radiology* 2024 (S0009-9260(24)00675-5). Suplemento de coeficientes usado: `https://www.clinicalradiologyonline.net/cms/10.1016/j.crad.2024.106788/attachment/0337a514-fedd-4ca3-8cbc-c23fbb71dd88/mmc3.pdf`
- Herder GJ, et al. Clinical prediction of malignancy in solitary pulmonary nodules using FDG-PET. *Chest.* 2005;128(4):2490-2496. *(Herder)* — PubMed: `https://pubmed.ncbi.nlm.nih.gov/16236914/`
- Revisión con ecuaciones comparativas de modelos Mayo/Brock/Herder usada para contrastar la fórmula logística Herder: `https://pmc.ncbi.nlm.nih.gov/articles/PMC7159041/`
- MDCalc — Solitary Pulmonary Nodule (SPN) Malignancy Risk Score (Mayo Clinic Model).
- British Thoracic Society. Guidelines for the investigation and management of pulmonary nodules. *Thorax* 2015;70(Suppl 2):ii1-ii54. *(umbrales de manejo + uso de LR de PET)*

**Guías de manejo (categóricas, sin coeficientes):**
- MacMahon H, et al. Guidelines for management of incidental pulmonary nodules detected on CT images: from the Fleischner Society 2017. *Radiology.* 2017;284(1):228-243. *(Fleischner 2017)* — PDF local: `research/pdf/macmahon-et-al-2017-guidelines-for-management-of-incidental-pulmonary-nodules-detected-on-ct-images-from-the-fleischner.pdf`
- American College of Radiology. Lung CT Screening Reporting & Data System (Lung-RADS) version 2022. *(Lung-RADS v2022)* — resumen oficial: `https://cs.acr.org/-/media/ACR/Files/RADS/Lung-RADS/Lung-RADS-2022-Summary-_Final.pdf`; PDFs locales usados: `research/pdf/Lung-RADS-2022-Summary.pdf` y `research/pdf/lung-rads-assessment-categories.pdf#_~_text=Solid nodule_ • ≥ 6,at baseline OR.pdf`
