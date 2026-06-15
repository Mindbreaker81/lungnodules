# Modelos predictivos de malignidad — Variables, coeficientes y estado de verificación

> Documento de estado para Mayo, Brock/PanCan y Herder (modelos de probabilidad) y,
> como anexo de trazabilidad, Fleischner 2017 y Lung-RADS v2022 (guías de manejo
> categóricas, sin coeficientes). Registra **qué está implementado**, **qué coeficiente
> está verificado contra la publicación original** (con su fuente) y **qué falta por
> verificar/implementar**.
>
> Última actualización: 2026-06-15 (sincronizado con `ESTADO_Y_PENDIENTES.md`, `coefficients.md` y código v1.6.0).  
> **Estado operativo, pendientes y desfases con el código:** ver `[ESTADO_Y_PENDIENTES.md](./ESTADO_Y_PENDIENTES.md)`.  
> **Resumen clínico en inglés (fórmulas):** [`coefficients.md`](./coefficients.md).  
> **Bibliografía con enlaces PubMed/DOI (app):** [`config/references.ts`](../../config/references.ts) → `/references`.

## Leyenda de estado


| Marca                               | Significado                                                                                                                               |
| ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| ✅ **Verificado**                    | Coeficiente contrastado en esta revisión contra la publicación original o fuentes secundarias fiables (MDCalc, PMC, NEJM, meta-análisis). |
| 🟡 **Implementado, fuente interna** | En uso en la app, pero su única fuente es un documento interno; conviene re-verificar contra el paper.                                    |
| ⛔ **Pendiente / no verificado**     | Necesario para una variante aún no implementada; **no** debe hardcodearse sin la cifra del paper.                                         |


Mapeo de código: todos los modelos viven en `[lib/predictive/index.ts](../../lib/predictive/index.ts)`.
Las entradas (inputs) se validan en `[lib/schemas/noduleInput.ts](../../lib/schemas/noduleInput.ts)`.

---

## 1. Mayo Clinic (Swensen et al., Arch Intern Med 1997;157:849-855) — ✅ implementado y verificado

Probabilidad: `P = e^x / (1 + e^x)`

`x = -6.8272 + 0.0391·Edad + 0.7917·Tabaco + 1.3388·Cáncer + 0.1274·Diámetro + 1.0407·Espiculación + 0.7838·LóbuloSup`


| Variable             | Coef.   | Estado | Codificación / input                                                                           | Fuente de verificación          |
| -------------------- | ------- | ------ | ---------------------------------------------------------------------------------------------- | ------------------------------- |
| Intercepto           | −6.8272 | ✅      | —                                                                                              | Swensen 1997 ecuación p.852 / PDF local 2026-06-15 |
| Edad                 | 0.0391  | ✅      | años (`patient.age`)                                                                           | Swensen 1997 ecuación p.852                        |
| Tabaquismo           | 0.7917  | ✅      | 1 = fumador actual o ex-fumador; 0 = nunca (`patient.smokingStatus`)                           | Swensen 1997 ecuación p.852                        |
| Cáncer extratorácico | 1.3388  | ✅      | 1 = diagnóstico **> 5 años** antes; 0 = no (`patient.extrathoracicCancerHistory === 'over5y'`) | Swensen 1997 ecuación p.852                        |
| Diámetro             | 0.1274  | ✅      | mm (`nodule.diameterMm`)                                                                       | Swensen 1997 ecuación p.852                        |
| Espiculación         | 1.0407  | ✅      | 1 = presente; 0 = no (`nodule.hasSpiculation`)                                                 | Swensen 1997 ecuación p.852                        |
| Lóbulo superior      | 0.7838  | ✅      | 1 = lóbulo superior (der. o izq.); 0 = medio/inferior (`nodule.isUpperLobe`)                   | Swensen 1997 ecuación p.852                        |


> **Nivel de verificación: PRIMARIO** (2026-06-15: ecuación multivariable y Tabla 3 cotejadas contra PDF local `research/pdf/swensen 10.1001-archinte.1997.00440290031002.pdf`, Arch Intern Med 1997;157:849-855). Coincide con MDCalc y con `lib/predictive/index.ts:37-45`. Test de regresión: Tabla 3 fila 55 a / 20 mm / sin factores → P ≈ 0,11.

**Exclusiones aplicadas en la app:** contexto incidental (Fleischner); no aplicar a masas > 30 mm; no aplicar con cáncer de pulmón conocido; no aplicar si cáncer extratorácico < 5 años.

**Rango de diámetro (Swensen / MDCalc):** el paper y MDCalc validan nódulos **4–30 mm**. La app **no impone mínimo de 4 mm** en Mayo (solo excluye > 30 mm). Herder comparte el umbral ≥ 4 mm vía `MAYO_MIN_DIAMETER_MM` (ver §3).

**Comportamiento con PET rellenado:** si `nodule.hasPet` y `nodule.petUptake` están informados, `buildMayoSummary` añade una nota de que Mayo es probabilidad **pre-PET** y que el ajuste post-PET corresponde a las variantes Herder (§3). `getRecommendedPredictiveModel()` devuelve `"herder"` (BTS) cuando esa variante está disponible; si no, Brock (screening) o Mayo (incidental).

**Corrección 2026-06-13:** espiculación (0.71 → 1.0407) y lóbulo superior (1.138 → 0.7838) estaban intercambiados y con valores erróneos.

---

## 2. Brock / PanCan (McWilliams et al., NEJM 2013;369:910-919)

El modelo Brock tiene **cuatro fórmulas** en McWilliams 2013: {parsimonioso, completo} × {con espiculación, sin espiculación}. La app implementa solo los modelos **completos** 2a y 2b (no los parsimoniosos 1a/1b).

> **Nomenclatura en este documento:** §2a = McWilliams **Model 2b** (completo **con** espiculación); §2b = McWilliams **Model 2a** (completo **sin** espiculación). Los números de sección no coinciden con la tabla del paper — ver mapa en `ESTADO_Y_PENDIENTES.md` § «Las 4 variantes Brock».

Particularidades clave frente a Mayo:

- El **tamaño** entra mediante una **transformación no lineal**, no linealmente.
- La **edad** se centra en 62: `(Edad − 62)`.
- El **número de nódulos** se centra en 4: `(Nº − 4)` (coeficiente negativo: más nódulos ⇒ menor riesgo de que *uno* sea cáncer primario).

### 2a. Variante CON espiculación — ✅ implementada y verificada

`x = -6.7892 + 0.0287·(Edad−62) + 0.6011·Mujer + 0.2961·HistFamiliar + 0.2953·Enfisema − 5.3854·[(Tamaño/10)^−0.5 − 1.58113883] + Tipo + 0.6581·LóbuloSup − 0.0824·(Nº−4) + 0.7729·Espiculación`


| Variable                        | Coef.                                 | Estado | Codificación / input                                                     | Fuente de verificación                                                                  |
| ------------------------------- | ------------------------------------- | ------ | ------------------------------------------------------------------------ | --------------------------------------------------------------------------------------- |
| Intercepto                      | −6.7892                               | ✅      | —                                                                        | McWilliams 2013 (modelo completo con espiculación, Model 2b) / meta-análisis Brock 2024 |
| Edad (centrada)                 | 0.0287 × (Edad − 62)                  | ✅      | años (`patient.age`)                                                     | McWilliams 2013 / calculadora Brock (BC Cancer)                                         |
| Sexo femenino                   | 0.6011                                | ✅      | 1 = mujer; 0 = hombre (`patient.sex`)                                    | McWilliams 2013                                                                         |
| Historia familiar cáncer pulmón | 0.2961                                | ✅      | 1/0 (`patient.hasFamilyHistoryLungCancer`)                               | McWilliams 2013                                                                         |
| Enfisema (en TC)                | 0.2953                                | ✅      | 1/0; visible en TC, no solo EPOC clínico (`patient.hasEmphysema`)        | McWilliams 2013                                                                         |
| Tamaño (transformado)           | −5.3854 × [(mm/10)^−0.5 − 1.58113883] | ✅      | mm (`nodule.diameterMm`)                                                 | McWilliams 2013 / calculadora Brock                                                     |
| Tipo: parte-sólido              | 0.377                                 | ✅      | 1 si parte-sólido; sólido es referencia (`nodule.type === 'part-solid'`) | McWilliams 2013                                                                         |
| Tipo: no sólido (VME/GGO)       | −0.1276                               | ✅      | 1 si vidrio esmerilado (`nodule.type === 'ground-glass'`)                | McWilliams 2013                                                                         |
| Lóbulo superior                 | 0.6581                                | ✅      | 1/0 (`nodule.isUpperLobe`)                                               | McWilliams 2013                                                                         |
| Nº de nódulos (centrado)        | −0.0824 × (Nº − 4)                    | ✅      | entero (`nodule.noduleCount`); solitario = 1 ⇒ +0.2472                   | McWilliams 2013                                                                         |
| Espiculación                    | 0.7729                                | ✅      | 1/0 (`nodule.hasSpiculation`)                                            | McWilliams 2013                                                                         |


> **Nivel de verificación: PRIMARIO** (2026-06-15: tabla 2, Model 2b, cotejada celda a celda contra PDF local `research/pdf/McWilliams - Probability of Cancer in Pulmonary Nodules Detected on First Screening CT.pdf`). Coincide también con PMC McWilliams 2013 y suplemento Clinical Radiology 2024. **Corrección documental 2026-06-14:** estos coeficientes corresponden al **modelo completo con espiculación (Model 2b)**, no al parsimonioso 1b. Coincide con `lib/predictive/index.ts:51-66`. El comentario en código fue corregido en 2026-06-15.

**Exclusiones aplicadas:** contexto screening (Lung-RADS); no aplicar a masas > 30 mm.

**Corrección 2026-06-13:** se pasó de un coeficiente lineal de tamaño (0.0546·mm) a la transformación no lineal; se centró edad en 62 y recuento en 4; se corrigieron intercepto (−8.4852 → −6.7892), espiculación (0.3543 → 0.7729) y lóbulo superior (0.3138 → 0.6581).

### 2b. Variante SIN espiculación — ✅ implementada y verificada (Model 2a)

Corresponde al **Model 2a** (modelo completo sin espiculación) de McWilliams 2013, tabla 2. Misma estructura que §2a pero **sin el término de espiculación** y con **intercepto y coeficientes re-calibrados** (no se reutilizan los de §2a). Se usa cuando `nodule.hasSpiculation` no está informado (`undefined` = no evaluable).

`x = -6.8071 + 0.0321·(Edad−62) + 0.5635·Mujer + 0.3013·HistFamiliar + 0.3462·Enfisema − 5.6693·[(Tamaño/10)^−0.5 − 1.58113883] + Tipo + 0.7116·LóbuloSup − 0.0803·(Nº−4)`


| Variable                        | Coef.                                 | Estado | Codificación / input                                   | Fuente de verificación                  |
| ------------------------------- | ------------------------------------- | ------ | ------------------------------------------------------ | --------------------------------------- |
| Intercepto                      | −6.8071                               | ✅      | —                                                      | McWilliams 2013 (Model 2a) / PDF local  |
| Edad (centrada)                 | 0.0321 × (Edad − 62)                  | ✅      | años (`patient.age`)                                   | McWilliams 2013 Tabla 2                 |
| Sexo femenino                   | 0.5635                                | ✅      | 1 = mujer; 0 = hombre (`patient.sex`)                  | McWilliams 2013 Tabla 2                 |
| Historia familiar cáncer pulmón | 0.3013                                | ✅      | 1/0 (`patient.hasFamilyHistoryLungCancer`)             | McWilliams 2013 Tabla 2                 |
| Enfisema (en TC)                | 0.3462                                | ✅      | 1/0 (`patient.hasEmphysema`)                           | McWilliams 2013 Tabla 2                 |
| Tamaño (transformado)           | −5.6693 × [(mm/10)^−0.5 − 1.58113883] | ✅      | mm (`nodule.diameterMm`); misma transformación que §2a | McWilliams 2013 Tabla 2 (nota al pie †) |
| Tipo: parte-sólido              | 0.3395                                | ✅      | 1 si parte-sólido; sólido es referencia                | McWilliams 2013 Tabla 2                 |
| Tipo: no sólido (VME/GGO)       | −0.3005                               | ✅      | 1 si vidrio esmerilado                                 | McWilliams 2013 Tabla 2                 |
| Lóbulo superior                 | 0.7116                                | ✅      | 1/0 (`nodule.isUpperLobe`)                             | McWilliams 2013 Tabla 2                 |
| Nº de nódulos (centrado)        | −0.0803 × (Nº − 4)                    | ✅      | entero (`nodule.noduleCount`); solitario = 1 ⇒ +0.2409 | McWilliams 2013 Tabla 2                 |
| ~~Espiculación~~                | (ausente en esta variante)            | —      | —                                                      | —                                       |


> **Nivel de verificación: PRIMARIO** (2026-06-15: tabla 2, Model 2a, cotejada contra PDF local `research/pdf/McWilliams - Probability of Cancer in Pulmonary Nodules Detected on First Screening CT.pdf`). La nota al pie de la tabla confirma centrado de edad en 62, recuento en 4 y transformación de tamaño `(mm/10)^−0.5` con el mismo offset 1.58113883 que §2a.

**Implementación:** bloque `BROCK_COEFFICIENTS_NO_SPIC` en `lib/predictive/index.ts:68-82`. El selector de variante está en `buildBrockSummary`: si `hasSpiculation` es booleano se usa Model 2b; si es `undefined` se usa Model 2a. El resultado incluye una nota cuando se emplea la variante sin espiculación.

---

## 3. Herder (Herder et al., Chest 2005;128:2490-2496)

> **IMPORTANTE — corrección 2026-06-15:** tras revisar el PDF original (`research/pdf/Herder 2005 ...pdf`) se confirma que **el paper publica UN único modelo: la regresión logística** (§3b). El paper **no** contiene una "Tabla 4" con likelihood ratios (0.08/0.17/1.9/9.9); ese enfoque por LR (§3a) procede de la guía BTS 2015 / MDCalc, no del artículo. La app **implementa ambas variantes** y las muestra en igualdad de condiciones, cada una con su fuente y cálculo.

### 3a. Variante BTS (odds × likelihood ratio de FDG-PET) — ✅ implementada (`id: "herder"`)

Toma la probabilidad **pre-test** (Mayo en incidental, Brock en screening), la convierte a odds y la multiplica por el *likelihood ratio* (LR) del nivel de captación FDG:

```
O_pre  = P_pretest / (1 − P_pretest)
O_post = O_pre × LR
P_Herder = O_post / (1 + O_post)
```


| Captación FDG | Definición                    | LR   | Estado | Fuente de verificación |
| ------------- | ----------------------------- | ---- | ------ | ---------------------- |
| Ausente       | ≤ fondo pulmonar              | 0.08 | ✅      | BTS 2015 / MDCalc      |
| Leve          | > pulmón, ≤ pool mediastínico | 0.17 | ✅      | BTS 2015 / MDCalc      |
| Moderada      | > pool mediastínico           | 1.9  | ✅      | BTS 2015 / MDCalc      |
| Intensa       | muy superior al pool          | 9.9  | ✅      | BTS 2015 / MDCalc      |


> **Nivel de verificación:** secundario. Estos LR proceden de la guía **British Thoracic Society 2015** (Callister et al., PMID 26082159) y de MDCalc; **no** aparecen como tabla en el paper Herder 2005. Coincide con `lib/predictive/index.ts` (`HERDER_LIKELIHOOD_RATIOS`).

**Constantes en código:** `MAYO_MIN_DIAMETER_MM = 4` (elegibilidad Herder; rango Mayo/MDCalc); `HERDER_VALIDATED_MIN_DIAMETER_MM = 8` (aviso clínico si diámetro < 8 mm).

**Requisitos en la app:** PET-CT disponible, nódulo ≥ 4 mm, riesgo pre-test ≥ 10% (criterio BTS), no aplicar a masas > 30 mm. Con nódulos < 8 mm se muestra aviso de validación limitada. Input: `nodule.hasPet`, `nodule.petUptake`.

**Nota:** multiplicar odds por un LR equivale a sumar `ln(LR)` al log-odds pre-test. El uso de Herder con pre-test Brock (screening) tiene evidencia limitada (validado originalmente con Mayo) — la app ya lo advierte.

### 3b. Regresión logística publicada (modelo original Herder 2005) — ✅ implementada (`id: "herder-logistic"`)

Es **el modelo multivariable que publica el paper**. Combina la probabilidad pre-test (Mayo/Swensen) con la captación visual de FDG en escala de 4 puntos:

`x = −4.739 + 3.691·P_pre + βFDG`  ·  `P = 1 / (1 + e^−x)`


| Captación | Coef. βFDG | Estado | Fuente de verificación                         |
| --------- | ---------- | ------ | ---------------------------------------------- |
| Ausente   | 0 (ref.)   | ✅      | Herder 2005 (Chest) / reproducido Mourato 2020 |
| Leve      | +2.322     | ✅      | Herder 2005 (Chest) / reproducido Mourato 2020 |
| Moderada  | +4.617     | ✅      | Herder 2005 (Chest) / reproducido Mourato 2020 |
| Intensa   | +4.771     | ✅      | Herder 2005 (Chest) / reproducido Mourato 2020 |


> **Nivel de verificación: PRIMARIO** (2026-06-15, cotejado contra el PDF original Herder 2005 y reproducido en `research/pdf/PMC7159041.pdf`, Mourato 2020).

**Escala de `P_pre` (resuelto):** pese a que el texto del paper habla de "percentage", el coeficiente 3.691 multiplica la probabilidad como **fracción 0–1**, no 0–100. Comprobación: con `P_pre = 0.187` y captación intensa → `x = −4.739 + 3.691·0.187 + 4.771 = 0.722` → `P ≈ 0.673` (clínicamente coherente; con escala 0–100 el resultado saturaría a ~1).

**Matiz Mourato 2020:** reproduce la misma fórmula pero clasifica la captación PET por **SUVmax**, mientras la app y el paper original usan la **escala visual** (ausente/leve/moderada/intensa) basada en el pool mediastínico. No mezclar ambos criterios de categorización.

**Implementación:** `HERDER_LOGISTIC_COEFFICIENTS` + `HERDER_LOGISTIC_FDG` y `buildHerderLogisticSummary` en `lib/predictive/index.ts`. Comparte la elegibilidad (PET, ≥4 mm, ≤30 mm, pre-test disponible) con la variante BTS vía `evaluateHerderEligibility`. A diferencia de la variante BTS, **no** aplica el umbral pre-test ≥10% (eso es una recomendación BTS, no del modelo logístico).

---

## Anexo A — Mapa de inputs (wizard ↔ predictivos)

> Fuente de verdad de código: [`lib/schemas/noduleInput.ts`](../../lib/schemas/noduleInput.ts) (validación wizard), [`lib/predictive/index.ts`](../../lib/predictive/index.ts) (`build*Summary`, `evaluateHerderEligibility`).  
> UI: `RiskStep.tsx` (paciente + bloque predictivo), `NoduleStep.tsx` (nódulo).  
> Referencia rápida duplicada en `ESTADO_Y_PENDIENTES.md` § Inputs (apunta aquí).

### Leyenda


| Símbolo | Significado |
| ------- | ----------- |
| **O** | Obligatorio para calcular el modelo (si falta → `insufficient_data`) |
| **E** | Exclusión / no aplica (`not_applicable`) |
| **—** | No usa el campo |
| **P** | Opcional en wizard; obligatorio solo si se quiere el cálculo predictivo |
| **G** | Obligatorio para la **guía** (Fleischner / Lung-RADS), no para el modelo predictivo |
| **C** | Condicional (ver nota) |

### Flujo del wizard (pasos)


| Paso | Componente | Incidental (Fleischner) | Screening (Lung-RADS) |
| ---- | ---------- | ----------------------- | ---------------------- |
| 1 | Contexto | `clinicalContext = incidental` | `clinicalContext = screening` |
| 2 | `RiskStep` | Edad **G**, factores riesgo → `riskLevel` **G**, exclusiones Fleischner **G** | `scanType` **G**, seguimiento previo **C**, stepped management **P** |
| 2 | `RiskStep` (bloque predictivo) | Sexo, tabaquismo, cáncer extratorácico **P** | + edad **P**, hist. familiar, enfisema **P** |
| 3 | `NoduleStep` | Tipo, diámetro **G**, morfología, PET **P**, espiculación 3 estados | + campos Lung-RADS especiales **C** |
| 4 | Resultados | Categoría guía + modelos predictivos (si datos completos) | idem |

### Tabla maestra por campo


| Campo (`AssessmentInput`) | Wizard | Fleischner | Mayo | Brock | Herder BTS | Herder log. | Notas |
| ------------------------- | ------ | ---------- | ---- | ----- | ---------- | ----------- | ----- |
| `clinicalContext` | Contexto **O** | **O** incidental | **E** si screening | **E** si incidental | — | — | Rama principal |
| `patient.age` | Risk **G** inc. / **P** scr. | **G** ≥35 | **O** | **O** | — | — | Screening: edad en bloque predictivo |
| `patient.riskLevel` | Risk (auto) **G** | **G** | — | — | — | — | Solo Fleischner |
| `patient.riskFactors` | Risk **G** | **G** (deriva riesgo) | — | — | — | — | |
| `patient.hasKnownMalignancy` | Risk **G** | **E** si true | **E** si true | — | — | — | |
| `patient.isImmunocompromised` | Risk **G** | **E** si true | — | — | — | — | |
| `patient.sex` | Risk **P** | — | — | **O** | — | — | |
| `patient.smokingStatus` | Risk **P** | — | **O** | — | — | — | never/former/current |
| `patient.extrathoracicCancerHistory` | Risk **P** | — | **O** (`none`/`over5y`/`recent`) | — | — | — | **E** Mayo si `recent` |
| `patient.hasFamilyHistoryLungCancer` | Risk **P** (scr.) | — | — | **O** bool | — | — | Checkbox solo screening |
| `patient.hasEmphysema` | Risk **P** (scr.) | — | — | **O** bool | — | — | En TC, no solo EPOC clínico |
| `nodule.type` | Nodule **G** | **G** | — | **O** | — | — | solid / part-solid / ground-glass |
| `nodule.diameterMm` | Nodule **G** | **G** | **O** | **O** | **C** ≥4 mm | **C** ≥4 mm | **E** todos si >30 mm |
| `nodule.solidComponentMm` | Nodule **C** | **G** si part-solid | — | — | — | — | ≤ diámetro total |
| `nodule.isMultiple` / `noduleCount` | Nodule **G**/ **C** | **G** | — | **O** (1 si único) | — | — | Schema exige count si múltiple |
| `nodule.hasSpiculation` | Nodule 3 estados | **G** (Lung-RADS 4X) | **O** bool | **C** | — | — | `undefined` → Brock 2a; Mayo exige bool |
| `nodule.isUpperLobe` | Nodule **P** | — | **O** bool | **O** bool | — | — | |
| `nodule.hasPet` | Nodule **P** | — | — (nota pre-PET) | — | **O** | **O** | |
| `nodule.petUptake` | Nodule **C** | — | — | — | **O** si hasPet | **O** si hasPet | absent/faint/moderate/intense |
| `nodule.scanType` | Risk **G** | — | — | — | — | — | Solo screening |
| `nodule.priorDiameterMm` / `priorScanMonthsAgo` | Risk **C** | — | — | — | — | — | Follow-up screening |
| `priorCategory` / `priorStatus` | Risk **P** | — | — | — | — | — | Stepped management LR |
| Campos LR especiales (`isAirway`, `isAtypicalCyst`, …) | Nodule **C** | — | — | — | — | — | Solo guía Lung-RADS; quiste atípico: descriptores + override en Anexo A §A.1 |

### Resumen por modelo predictivo

#### Mayo (`id: "mayo"`) — solo incidental

| Requisito | Detalle |
| --------- | ------- |
| Contexto | `incidental` |
| Exclusiones | Diámetro >30 mm; `hasKnownMalignancy`; `extrathoracicCancerHistory === 'recent'` |
| Campos **O** | `age`, `smokingStatus`, `extrathoracicCancerHistory`, `diameterMm`, `isUpperLobe` (bool), `hasSpiculation` (**bool**, no `undefined`) |
| Rango paper | 4–30 mm (app no valida mínimo 4 en Mayo) |
| PET | No incorpora FDG; si hay PET, nota pre-PET en resultado |

#### Brock (`id: "brock"`) — solo screening

| Requisito | Detalle |
| --------- | ------- |
| Contexto | `screening` |
| Exclusiones | Diámetro >30 mm |
| Campos **O** | `age`, `sex`, `hasFamilyHistoryLungCancer`, `hasEmphysema`, `diameterMm`, `type`, `isUpperLobe`, `noduleCount` (default 1 si solitario) |
| Variante | `hasSpiculation` **bool** → McWilliams **2b**; `undefined` → **2a** (`BROCK_COEFFICIENTS_NO_SPIC`) |

#### Herder BTS (`id: "herder"`) y logístico (`id: "herder-logistic"`)

| Requisito | Herder BTS | Herder logístico |
| --------- | ---------- | ---------------- |
| PET | `hasPet` + `petUptake` **O** | igual |
| Diámetro | ≥4 mm (`MAYO_MIN_DIAMETER_MM`); aviso si <8 mm | igual |
| Exclusiones | >30 mm; pre-test Mayo/Brock no calculable | igual |
| Pre-test | Mayo (incidental) o Brock (screening) **O** | igual |
| Umbral pre-test | **≥10%** (BTS); si <10% → `not_applicable` | **sin** umbral ≥10% |
| Cálculo | odds × LR FDG | regresión logística §3b |

### Diferencias críticas wizard ↔ predictivo

1. **Espiculación:** el wizard ofrece 3 estados (`true` / `false` / `undefined`). Mayo **rechaza** `undefined`. Brock usa 2a sin espiculación. Lung-RADS **no** escala a 4X si `undefined` (falsy).
2. **Edad en screening:** obligatoria para Fleischner incidental; en screening es opcional en UI pero **obligatoria** para Brock.
3. **Hist. familiar / enfisema:** checkboxes visibles solo en screening; Brock los exige como boolean explícito.
4. **PET:** el schema del wizard exige `petUptake` si `hasPet` (ambos contextos). Herder solo calcula si además el pre-test está disponible.
5. **Valores por defecto** (`WizardContainer`): `hasSpiculation: false`, `hasPet: false` — el usuario debe activar PET y, si aplica, elegir «No evaluable» para espiculación.

### Validación Zod vs mensajes predictivos

| Capa | Qué valida | Mensaje al usuario |
| ---- | ---------- | ------------------ |
| `assessmentInputSchema` | Formulario completo para **guía** (edad Fleischner, diámetro, PET pareado, múltiples, etc.) | Errores en wizard antes de Resultados |
| `build*Summary` | Campos mínimos por **modelo** | Tarjeta predictiva: `insufficient_data` + lista `missingFields` en `ResultsStep` |

Un caso puede **pasar** la guía y aun así mostrar predictivos incompletos si no se rellenó el bloque «Factores para modelos predictivos» en `RiskStep` o campos concretos (p. ej. lóbulo superior).

### A.1 Quiste atípico (Lung-RADS v2022 § I.A) — solo screening

| Campo | Wizard | Algoritmo | Notas |
| ----- | ------ | --------- | ----- |
| `isAtypicalCyst` | Checkbox **C** | Activa rama híbrida | |
| `atypicalCystThickWalled` | Checkbox **C** | Auto 4A/4B | Pared ≥ 2 mm |
| `atypicalCystMultilocular` | Checkbox **C** | Auto 4A/4B | |
| `atypicalCystPreviouslyStable` | Checkbox **C** | Auto 3 | Con comp. quístico creciente |
| `atypicalCystGrowingCysticComponent` | Checkbox **C** | Auto 3 | |
| `atypicalCystWallOrCystGrowing` | Checkbox **C** | Auto 4B | Con pared gruesa o multilocular |
| `atypicalCystIncreasedLoculationOrDensity` | Checkbox **C** | Auto 4B | Con multilocular |
| `atypicalCystAdjacentNodule` | Checkbox **C** | max(quiste, nódulo estándar) | ACR «most concerning feature» |
| `atypicalCystUnilocularThinWalled` | Checkbox **C** | Exclusión → flujo estándar | LR no clasifica |
| `atypicalCystSolidDominant` | Checkbox **C** | Exclusión → flujo sólido | Cavitado |
| `atypicalCystManualOverride` | Checkbox **C** | Override | Si true, exige `atypicalCystCategory` |
| `atypicalCystCategory` | Select **C** | Manual 3/4A/4B | Solo con override |

Prioridad auto: **4B → 4A → 3**. Sugerencia en UI vía `previewAtypicalCystCategory`.

---

## 4. Guías de manejo: Fleischner 2017 y Lung-RADS v2022

> ⚠️ A diferencia de Mayo/Brock/Herder, **estas dos no son modelos de regresión y no
> tienen coeficientes**: son árboles de decisión categóricos basados en umbrales de
> tamaño, tipo de nódulo, multiplicidad, crecimiento y nivel de riesgo. No producen una
> probabilidad %, sino una **categoría + recomendación de seguimiento**. Se documentan
> aquí para completar la trazabilidad de fuentes.

### 4a. Fleischner 2017 — ✅ implementada (`[lib/algorithms/fleischner.ts](../../lib/algorithms/fleischner.ts)`)

Para **nódulos incidentales** en pacientes **≥ 35 años**, sin malignidad conocida ni
inmunocompromiso (exclusiones en `checkFleischnerApplicability`, líneas 15-26).


| Eje de decisión                 | Umbrales / valores implementados          | Estado | Código                                          |
| ------------------------------- | ----------------------------------------- | ------ | ----------------------------------------------- |
| Edad mínima                     | ≥ 35 años                                 | ✅      | `fleischner.ts:16`                              |
| Corte de tamaño                 | 6 mm y 8 mm                               | ✅      | `assessSolidSingle`, etc.                       |
| Tipo de nódulo                  | sólido / vidrio deslustrado / semi-sólido | ✅      | `assessFleischner`                              |
| Componente sólido (semi-sólido) | umbral 6 mm                               | ✅      | `assessPartSolid:220`                           |
| Multiplicidad                   | único vs múltiple (nódulo dominante)      | ✅      | `assessSolidMultiple`, `assessSubsolidMultiple` |
| Nivel de riesgo                 | bajo / alto (modula seguimiento)          | ✅      | `riskLevel`                                     |
| Perifisural benigno             | sólido ≤ 10 mm ⇒ sin seguimiento          | ✅      | `assessFleischner:259`                          |


> **Nivel de verificación: PRIMARIO** (auditado celda a celda el 2026-06-14 contra las
> tablas 1-2 de MacMahon et al. 2017). Cobertura de tests: `__tests__/algorithms/fleischner.test.ts` (todos en verde).
>
> **Cotejo de la matriz (sólido único / múltiple, GGN, semi-sólido):** todas las celdas
> coinciden con la guía —incluidas las recomendaciones de seguimiento por nivel de riesgo
> (bajo/alto), la regla perifisural ≤10 mm, y los intervalos (sin seguimiento / 12 m
> opcional / 6-12 m / 3-6 m / anual ×5 a / c-2 a hasta 5 a). **Sin discrepancias.**
>
> Notas de implementación (no son errores, son decisiones explícitas):
>
> - El tamaño se redondea al mm más próximo (`roundToNearestMm`); la guía usa diámetro
> medio y equivalencias de volumen (100/250 mm³ ≈ 6/8 mm). Efecto despreciable.
> - El umbral del componente sólido (6 mm) y el corte único 8 mm están correctos.

### 4b. Lung-RADS v2022 — ✅ implementada (`[lib/algorithms/lungRads.ts](../../lib/algorithms/lungRads.ts)`)

Para **cohortes de screening** (`patient.clinicalContext === 'screening'`, línea 256).
Asigna categorías 0/1/2/3/4A/4B/4X (+ modificador `S`).


| Eje de decisión                 | Umbrales / valores implementados                                                   | Estado | Código                              |
| ------------------------------- | ---------------------------------------------------------------------------------- | ------ | ----------------------------------- |
| Crecimiento                     | aumento absoluto **> 1.5 mm**                                                      | ✅      | `GROWTH_THRESHOLD_MM_PER_12M:8`     |
| Intervalo prolongado            | > 18 meses (advertencia)                                                           | ✅      | `LONG_INTERVAL_THRESHOLD_MONTHS:10` |
| Sólido baseline                 | <6 → C2; 6–<8 → C3; 8–<15 → C4A; ≥15 → C4B                                         | ✅      | `classifySolidLungRADS`             |
| Sólido nuevo (follow-up)        | <4 → C2; 4–<6 → C3; 6–<8 → C4A; ≥8 → C4B                                           | ✅      | `classifySolidLungRADS`             |
| Vidrio deslustrado              | <30 mm → C2; ≥30 mm → C3                                                           | ✅      | `classifyGroundGlass`               |
| Semi-sólido (componente sólido) | <6 → C3; 6–<8 → C4A; ≥8 → C4B                                                      | ✅      | `classifyPartSolid`                 |
| Espiculación                    | sube C3/4A/4B → **4X**                                                             | ✅      | `assessLungRads:311`                |
| Manejo escalonado               | C3 estable→C2; C4A estable→C3                                                      | ✅      | `applySteppedManagement`            |
| Modificador `S`                 | hallazgo significativo (sufijo aditivo)                                            | ✅      | `assessLungRads:321`                |
| Categorías especiales           | 0 (incompleto), 1 (benigno), inflamatorio, vía aérea, quiste atípico, yuxtapleural | ✅      | `getSpecialCategory`                |


> **Nivel de verificación: PRIMARIO** para la matriz de tamaño (auditado el 2026-06-14
> contra ACR Lung-RADS v2022). Cobertura: `lungRads.test.ts` + `lungRads.regression.test.ts` (verde).
>
> **Matriz de tamaño verificada (coincide con la guía):**
>
>
> | Categoría            | Regla oficial v2022                                           | Código            | OK  |
> | -------------------- | ------------------------------------------------------------- | ----------------- | --- |
> | 2                    | Sólido baseline <6 mm; nuevo <4 mm                            | `<6` / nuevo `<4` | ✅   |
> | 3                    | Sólido baseline 6–<8 mm; nuevo 4–<6 mm                        | idem              | ✅   |
> | 4A                   | Sólido baseline 8–<15 mm; nuevo 6–<8 mm; en crecimiento <8 mm | idem              | ✅   |
> | 4B                   | Sólido baseline ≥15 mm; nuevo/creciente ≥8 mm                 | idem              | ✅   |
> | GGN                  | <30 mm → C2; ≥30 mm → C3                                      | idem              | ✅   |
> | Semi-sólido (sólido) | <6 → C3; 6–<8 → C4A; ≥8 → C4B                                 | idem              | ✅   |
> | 4X                   | C3/4A/4B + rasgo sospechoso (espiculación)                    | idem              | ✅   |
> | S                    | modificador aditivo por hallazgo significativo                | idem              | ✅   |
>
>
> **Espiculación no evaluable (`hasSpiculation === undefined`, UI «No evaluable»):** Lung-RADS no escala a 4X (el campo es falsy en `lungRads.ts:337`) y en yuxtapleural benigno se trata como ausente (`lungRads.ts:254`). Brock, en cambio, usa el Model 2a recalibrado. Comportamiento distinto entre guía categórica y modelo predictivo.
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
>
> | Bloque                                                                     | Regla oficial v2022                                                                 | Código                                                                                                                | Estado         |
> | -------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- | -------------- |
> | Vía aérea subsegmental                                                     | C2 (suele ser tapón mucoso/inflamatorio)                                            | `subsegmental → 2`                                                                                                    | ✅ PRIMARIO     |
> | Vía aérea tubular/múltiple probablemente infecciosa sin nódulo obstructivo | C0 o C2 a discreción                                                                | `airwayInflammatoryOrInfectious → 0`                                                                                  | ✅ PRIMARIO     |
> | Vía aérea segmental/proximal                                               | C4A                                                                                 | `segmental-proximal → 4A`                                                                                             | ✅ PRIMARIO     |
> | Vía aérea persistente a 3 m                                                | C4A→C4B                                                                             | `airwayPersistent → 4B`                                                                                               | ✅ PRIMARIO     |
> | Manejo escalonado                                                          | C3/C4A estables o decrecientes → "next lowest" (C2/C3 resp.), **excepto vía aérea** | `3→2`, `4A→3` para `stable/decreasing`; vía aérea sale por rama especial antes                                        | ✅ PRIMARIO     |
> | Semi-sólido baseline                                                       | sólido <6→C3, 6–<8→C4A, ≥8→C4B                                                      | idem                                                                                                                  | ✅ PRIMARIO     |
> | Semi-sólido nuevo/creciente                                                | componente sólido <4→C4A; ≥4→C4B                                                    | implementado                                                                                                          | ✅ PRIMARIO     |
> | Crecimiento lento sólido/semi-sólido                                       | crecimiento en múltiples estudios sin >1.5 mm/12 m → puede ser C4B                  | `isSlowGrowing → 4B` para sólido/semi-sólido                                                                          | ✅ PRIMARIO     |
> | Crecimiento lento GGN                                                      | puede mantenerse C2 hasta cumplir otra categoría                                    | `isSlowGrowing → 2` para GGN                                                                                          | ✅ PRIMARIO     |
> | Quiste atípico                                                             | Cat 3: estable + comp. quístico creciente; 4A: pared ≥2 mm o multilocular; 4B: crecimiento pared/multilocular o ↑ loculación/densidad; adyacente → max con nódulo | **Híbrido** (`lib/algorithms/atypicalCyst.ts` + `assessAtypicalCyst` en `lungRads.ts`): descriptores → `classifyAtypicalCyst` (prioridad 4B→4A→3); override manual `atypicalCystManualOverride` + `atypicalCystCategory`; exclusiones unilocular fino / sólido dominante → flujo estándar | ✅ PRIMARIO |
>
>
> **Implementación híbrida (2026-06-15):** ver [`lib/algorithms/atypicalCyst.ts`](../../lib/algorithms/atypicalCyst.ts). Campos wizard: `atypicalCystThickWalled`, `atypicalCystMultilocular`, `atypicalCystPreviouslyStable`, `atypicalCystGrowingCysticComponent`, `atypicalCystWallOrCystGrowing`, `atypicalCystIncreasedLoculationOrDensity`, `atypicalCystAdjacentNodule`, exclusiones `atypicalCystUnilocularThinWalled` / `atypicalCystSolidDominant`. UI: badge de sugerencia + override radiológico en `NoduleStep.tsx`. Tests: `atypicalCyst.test.ts`, `lungRads.test.ts` TC-LR-016*.
>
> **Limitación conocida:** categorías especiales (incl. quiste) no pasan por manejo escalonado (`applySteppedManagement`) — comportamiento preexistente.

---

## 5. Bandas de riesgo (modelos predictivos: Mayo, Brock, Herder BTS, Herder logístico)


| Banda      | Probabilidad | Implementado |
| ---------- | ------------ | ------------ |
| Bajo       | < 5%         | ✅            |
| Intermedio | 5–65%        | ✅            |
| Alto       | > 65%        | ✅            |


(`toRiskBand` en `lib/predictive/index.ts`.) Para Herder BTS, la guía BTS usa además umbrales clínicos de manejo: pre-test < 10% → no aplicar variante LR; post-test < 10% vigilancia; > 70% tratamiento (mencionados en documentación, **no** mapeados como acciones automáticas en la UI).

**Sugerencias clínicas en UI** (`components/wizard/ResultsStep.tsx`, textos fijos por banda):

| Banda (`riskBand`) | Texto mostrado al usuario |
| ------------------ | ------------------------- |
| `low`              | Riesgo bajo (<5%). Vigilancia activa / watchful waiting. |
| `intermediate`     | Riesgo intermedio (5–65%). Considerar PET-CT o biopsia no quirúrgica. |
| `high`             | Riesgo alto (>65%). Considerar biopsia quirúrgica o escisión. |

Disclaimer de modelos predictivos: `config/i18n.ts` → `results.predictiveModels.disclaimer` (describe las dos variantes Herder cuando hay PET).

**Casos de regresión documentados:** ver `ESTADO_Y_PENDIENTES.md` § «Casos de regresión útiles» y `__tests__/predictive/predictive.test.ts` (p. ej. incidental 74 a / 7 mm / PET intenso → Mayo ~18.7 %, Herder BTS ~69.6 %, Herder logístico ~67.3 %).

---

## 6. Resumen de pendientes

| #   | Tarea                                                                                         | Estado / bloqueo                                                          |
| --- | --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| 1   | ~~Implementar Brock sin espiculación (McWilliams Model 2a)~~                                  | ✅ 2026-06-15                                                              |
| 2   | ~~Herder regresión logística (§3b) + exponer ambas variantes Herder~~                           | ✅ 2026-06-15 (`herder` + `herder-logistic`)                               |
| 3   | ~~UX selector espiculación 3 estados (Brock 2a vs 2b)~~                                       | ✅ 2026-06-15                                                              |
| 4   | ~~Lung-RADS: crecimiento `> 1.5` mm (no `>=`)~~                                               | ✅ 2026-06-14                                                              |
| 5   | ~~Lung-RADS: part-solid nuevo/creciente, crecimiento lento, vía aérea C0~~                    | ✅ 2026-06-14                                                              |
| 6   | ~~Tabla inputs wizard ↔ predictivos (Anexo A)~~                                               | ✅ 2026-06-15                                                              |
| 10  | ~~Sincronizar `coefficients.md` con doc largo~~                                               | ✅ 2026-06-15                                                              |
| 7   | ~~Mayo: verificación **primaria** coeficientes vs PDF Swensen 1997~~                          | ✅ 2026-06-15 (PDF local `swensen 10.1001-archinte.1997.00440290031002.pdf`) |
| 8   | ~~Lung-RADS: quiste atípico — híbrido (auto + override manual)~~                            | ✅ 2026-06-15 — ver §4b, `atypicalCyst.ts`                               |
| 9   | **Brock 1a / 1b parsimoniosos**                                                               | ⛔ No planificado (app usa solo modelos completos 2a/2b)                    |

### 6.1. Detalle de ítems cerrados (referencia)

**#1 — Brock Model 2a (sin espiculación)** ✅ Cerrado 2026-06-15

- Coeficientes verificados contra McWilliams 2013 Tabla 2 / PDF local (ver §2b).
- Código: `BROCK_COEFFICIENTS_NO_SPIC`, selector en `buildBrockSummary`, UI 3 estados en `NoduleStep.tsx`, tests en `predictive.test.ts`.

**#2 — Herder logístico + dual display** ✅ Cerrado 2026-06-15

- Fórmula verificada contra PDF Herder 2005 (PRIMARIO) y Mourato 2020 / PMC7159041 (secundario).
- Coeficientes: intercepto −4.739, `P_pre` como fracción 0–1, βFDG 0 / 2.322 / 4.617 / 4.771.
- Decisión de producto: **ambas** variantes expuestas en igualdad (`herder` BTS-LR y `herder-logistic`); notas con fuente y cálculo en cada tarjeta.

**#6 — Tabla inputs wizard ↔ predictivos** ✅ Cerrado 2026-06-15

- Anexo A en este documento: mapa maestro, resumen por modelo, diferencias espiculación/PET/contexto.
- `ESTADO_Y_PENDIENTES.md` § Inputs apunta al Anexo A.

**#10 — Sincronizar `coefficients.md`** ✅ Cerrado 2026-06-15

- Resumen clínico en inglés alineado con §1–3 y Anexo A; exclusiones app, bandas de riesgo, jerarquía documental.
- `coefficients.md` apunta aquí para verificación primaria/secundaria e inputs.

**#7 — Mayo verificación primaria Swensen 1997** ✅ Cerrado 2026-06-15

- PDF local: `research/pdf/swensen 10.1001-archinte.1997.00440290031002.pdf`.
- Ecuación p.852 (Arch Intern Med 1997;157:849-855): intercepto −6.8272 y 6 predictores coinciden celda a celda con `MAYO_COEFFICIENTS`.
- Tabla 3 del paper: caso 55 a, 20 mm, sin tabaco/cáncer/espiculación/lóbulo sup. → P = 0,11 (app ≈ 0,106; redondeo paper).
- Codificación paper: tabaco actual/ex-fumador = 1; cáncer extratorácico >5 a = 1; espiculación binaria; lóbulo superior = 1. Exclusiones paper: cáncer <5 a y cáncer pulmonar previo (app: `recent`, `hasKnownMalignancy`).

**#8 — Quiste atípico Lung-RADS híbrido** ✅ Cerrado 2026-06-15

- Decisión de producto: **opción C** — descriptores morfológicos → categoría sugerida (4B→4A→3) + override manual radiológico.
- Código: `lib/algorithms/atypicalCyst.ts`, rama `assessAtypicalCyst` en `lungRads.ts`.
- Nódulo adyacente: `higherLungRadsCategory` vs clasificación estándar del nódulo.
- Exclusiones ACR: unilocular pared fina / cavitado sólido dominante → flujo LR estándar + aviso.

---

## 7. Referencias

> **Listado canónico con enlaces verificados (PubMed, PMC, DOI, webs oficiales):** [`config/references.ts`](../../config/references.ts) — página de la app `/references`.  
> Lo siguiente es un índice breve; no duplicar URLs aquí salvo PDFs locales del repo.

**Modelos predictivos (probabilidad):**

- Swensen SJ, et al. The probability of malignancy in solitary pulmonary nodules. Application to small radiologically indeterminate nodules. *Arch Intern Med.* 1997;157(8):849-855. *(Mayo)* — PubMed 9129544; PDF local `research/pdf/swensen 10.1001-archinte.1997.00440290031002.pdf`
- McWilliams A, et al. Probability of cancer in pulmonary nodules detected on first screening CT. *N Engl J Med.* 2013;369(10):910-919. *(Brock/PanCan)* — PubMed 24004118; PMC3951177
- Chen S, et al. Pulmonary nodule malignancy probability: a meta-analysis of the Brock model. *Clin Radiol.* 2025;82:106788. *(meta-análisis Brock)* — PubMed 39842180
- Herder GJ, et al. Clinical prediction model to characterize pulmonary nodules: validation and added value of 18F-fluorodeoxyglucose positron emission tomography. *Chest.* 2005;128(4):2490-2496. *(Herder logístico)* — PubMed 16236914; PDF local `research/pdf/Herder 2005 ...pdf`
- Mourato FA, et al. Use of PET/CT to aid clinical decision-making in cases of solitary pulmonary nodule: a probabilistic approach. *Radiol Bras.* 2020;53(1):1-6. *(aplicación clínica Swensen + Herder)* — PubMed 32313329; PMC7159041
- Callister MEJ, et al. British Thoracic Society guidelines for the investigation and management of pulmonary nodules. *Thorax.* 2015;70(Suppl 2):ii1-ii54. *(Herder BTS-LR + umbrales)* — PubMed 26082159
- MDCalc — Solitary Pulmonary Nodule (SPN) Malignancy Risk Score (Mayo Clinic Model). Herramienta de contraste, no fuente primaria de coeficientes.

**Guías de manejo (categóricas, sin coeficientes):**

- MacMahon H, et al. Guidelines for management of incidental pulmonary nodules detected on CT images: from the Fleischner Society 2017. *Radiology.* 2017;284(1):228-243. *(Fleischner 2017)* — PubMed 28240562; PDF local `research/pdf/macmahon-et-al-2017-...pdf`
- American College of Radiology. Lung CT Screening Reporting & Data System (Lung-RADS) version 2022. — [ACR Lung-RADS](https://www.acr.org/Clinical-Resources/Reporting-and-Data-Systems/Lung-Rads); PDF local `research/pdf/Lung-RADS-2022-Summary.pdf`

