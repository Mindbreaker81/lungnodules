# Modelos predictivos de malignidad — Variables, coeficientes y estado de verificación

> Documento de estado para Mayo, Brock/PanCan y Herder. Registra **qué está
> implementado**, **qué coeficiente está verificado contra la publicación
> original**, y **qué falta por verificar/implementar**.
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

| Variable | Coef. | Estado | Codificación / input |
| :--- | :--- | :---: | :--- |
| Intercepto | −6.8272 | ✅ | — |
| Edad | 0.0391 | ✅ | años (`patient.age`) |
| Tabaquismo | 0.7917 | ✅ | 1 = fumador actual o ex-fumador; 0 = nunca (`patient.smokingStatus`) |
| Cáncer extratorácico | 1.3388 | ✅ | 1 = diagnóstico **> 5 años** antes; 0 = no (`patient.extrathoracicCancerHistory === 'over5y'`) |
| Diámetro | 0.1274 | ✅ | mm (`nodule.diameterMm`) |
| Espiculación | 1.0407 | ✅ | 1 = presente; 0 = no (`nodule.hasSpiculation`) |
| Lóbulo superior | 0.7838 | ✅ | 1 = lóbulo superior (der. o izq.); 0 = medio/inferior (`nodule.isUpperLobe`) |

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

| Variable | Coef. | Estado | Codificación / input |
| :--- | :--- | :---: | :--- |
| Intercepto | −6.7892 | ✅ | — |
| Edad (centrada) | 0.0287 × (Edad − 62) | ✅ | años (`patient.age`) |
| Sexo femenino | 0.6011 | ✅ | 1 = mujer; 0 = hombre (`patient.sex`) |
| Historia familiar cáncer pulmón | 0.2961 | ✅ | 1/0 (`patient.hasFamilyHistoryLungCancer`) |
| Enfisema (en TC) | 0.2953 | ✅ | 1/0; visible en TC, no solo EPOC clínico (`patient.hasEmphysema`) |
| Tamaño (transformado) | −5.3854 × [(mm/10)^−0.5 − 1.58113883] | ✅ | mm (`nodule.diameterMm`) |
| Tipo: parte-sólido | 0.377 | ✅ | 1 si parte-sólido; sólido es referencia (`nodule.type === 'part-solid'`) |
| Tipo: no sólido (VME/GGO) | −0.1276 | ✅ | 1 si vidrio esmerilado (`nodule.type === 'ground-glass'`) |
| Lóbulo superior | 0.6581 | ✅ | 1/0 (`nodule.isUpperLobe`) |
| Nº de nódulos (centrado) | −0.0824 × (Nº − 4) | ✅ | entero (`nodule.noduleCount`); solitario = 1 ⇒ +0.2472 |
| Espiculación | 0.7729 | ✅ | 1/0 (`nodule.hasSpiculation`) |

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

**Fuente a consultar:** apéndice suplementario de McWilliams 2013 (NEJM), tabla de modelos *full / parsimonious without spiculation*. No se ha podido recuperar en esta sesión (acceso de red restringido; sitios médicos devuelven 403). **No transcribir de memoria.**

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

| Captación FDG | Definición | LR | Estado |
| :--- | :--- | :---: | :---: |
| Ausente | ≤ fondo pulmonar | 0.08 | ✅ |
| Leve | > pulmón, ≤ pool mediastínico | 0.17 | ✅ |
| Moderada | > pool mediastínico | 1.9 | ✅ |
| Intensa | muy superior al pool | 9.9 | ✅ |

**Requisitos en la app:** PET-CT disponible, nódulo ≥ 8 mm, riesgo pre-test ≥ 10% (criterio BTS), no aplicar a masas > 30 mm. Input: `nodule.hasPet`, `nodule.petUptake`.

**Nota:** multiplicar odds por un LR equivale a sumar `ln(LR)` al log-odds pre-test. El uso de Herder con pre-test Brock (screening) tiene evidencia limitada (validado originalmente con Mayo) — la app ya lo advierte.

### 3b. Variante de regresión con coeficiente PET aditivo — ⛔ NO implementada (no verificada)

Un documento interno (`coefficients.md`, "Step 5") sugiere sumar un coeficiente PET a la `x` de Mayo:

| Captación | Coef. sugerido (doc interno) | Estado |
| :--- | :--- | :---: |
| Ausente | 0 (referencia) | 🟡 sin verificar |
| Leve | +1.439 | 🟡 sin verificar |
| Moderada | +3.893 | 🟡 sin verificar |
| Intensa | +5.534 | 🟡 sin verificar |

**Por qué no se implementa:**
1. Los valores solo provienen del doc interno (la misma fuente que tenía erróneos los coeficientes de Mayo y Brock).
2. Metodológicamente, una verdadera re-estimación logística de la cohorte de Herder **recalibra todos los coeficientes** (edad, tabaquismo, etc.), no solo añade un término PET sobre la `x` de Mayo. Por tanto "Mayo + coef. PET" no es un modelo publicado independiente tal como está descrito.

**Para implementarla de forma legítima** se necesita la **tabla de regresión completa re-estimada** del paper de Herder 2005 (intercepto + todos los coeficientes + términos PET), no solo los términos PET.

---

## 4. Bandas de riesgo (comunes a los tres modelos)

| Banda | Probabilidad | Implementado |
| :--- | :--- | :---: |
| Bajo | < 5% | ✅ |
| Intermedio | 5–65% | ✅ |
| Alto | > 65% | ✅ |

(`toRiskBand` en `lib/predictive/index.ts`.) Para Herder, BTS usa además umbrales clínicos de manejo: < 10% vigilancia, > 70% tratamiento.

---

## 5. Resumen de pendientes

| # | Tarea | Bloqueo |
| :-: | :--- | :--- |
| 1 | Coeficientes Brock **sin espiculación** (2b) | Apéndice suplementario McWilliams 2013 (NEJM) — no recuperable en sesión actual |
| 2 | (Opcional) Herder regresión re-estimada (3b) | Tabla completa de Herder 2005; los coef. PET aislados no bastan |
| 3 | Decidir UX del selector con/sin espiculación en Brock | — |

---

## 6. Referencias

- Swensen SJ, et al. The probability of malignancy in solitary pulmonary nodules. *Arch Intern Med.* 1997;157(8):849-855.
- McWilliams A, et al. Probability of cancer in pulmonary nodules detected on first screening CT. *N Engl J Med.* 2013;369(10):910-919.
- Herder GJ, et al. Clinical prediction of malignancy in solitary pulmonary nodules using FDG-PET. *Chest.* 2005;128(4):2490-2496.
- MDCalc — Solitary Pulmonary Nodule (SPN) Malignancy Risk Score (Mayo Clinic Model).
- Pulmonary nodule malignancy probability: a meta-analysis of the Brock model. *Clinical Radiology* 2024 (S0009-9260(24)00675-5).
