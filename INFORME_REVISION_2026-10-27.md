# Informe de revisión — 2026-10-27

Revisión de solo lectura hecha por dos agentes coordinados con Herdr: **claude-nodules** (guías Fleischner/Lung-RADS, quiste atípico, wizard, configuración y versiones) y **codex-nodules** (modelos predictivos, elegibilidad PLCOm2012 y referencias). Las tareas derivadas están en YouTrack, proyecto **LUN**, como subtareas de **LUN-15**. La revisión en sí es **LUN-13**.

## 1. Estado del repositorio

| Comprobación | Resultado |
|---|---|
| Sincronía con el remoto | `main` = `origin/main` = `bcfe99fc` tras `git fetch --prune` (0 por delante / 0 por detrás) |
| Ramas | Solo `main` (local y remota) |
| Versión | 1.6.4, coherente en `package.json`, `public/manifest.json`, `APP_VERSION`, README y CHANGELOG |
| Tests (Jest) | 11 suites, 148/148 OK |
| Tipos (`tsc --noEmit`) | OK |
| Lint | Falla solo por `w5_capture.mjs`, script ajeno sin seguir (LUN-36) |

## 2. Lo que se ha verificado como correcto

- **Mayo** (Swensen 1997, p.852): intercepto −6.8272; edad 0.0391; tabaco 0.7917; cáncer extratorácico >5 a 1.3388; diámetro 0.1274; espiculación 1.0407; lóbulo superior 0.7838.
- **Brock 2b / 2a** (McWilliams 2013, tabla 2): todos los coeficientes y transformaciones (`(mm/10)^−0.5 − 1.58113883`, edad − 62, recuento − 4) y la selección 2a/2b según la espiculación.
- **Herder logístico** (Herder 2005, p.2492): −4.739 + 3.691·P_Mayo + βFDG (0 / 2.322 / 4.617 / 4.771), con P en fracción 0–1.
- **PLCOm2012** (Tammemägi 2013, tabla 2): centrados, transformación de la intensidad, intercepto, coeficientes y raza. El ejemplo de referencia da 0.0175092, igual que el script R.
- **Referencias** de `config/references.ts`: autores, años, volúmenes, páginas, PMID y DOI correctos. El fallo está en la atribución del cálculo «BTS · LR» (LUN-16) y en que falta la fuente del umbral del 1,51 % (LUN-23).
- **Fleischner 2017**: nódulos sólidos únicos y múltiples, en vidrio deslustrado y semi-sólidos, escalada de seguimientos, redondeo al mm y exclusiones (<35 años, cáncer conocido, inmunocomprometidos).
- **Lung-RADS v2022** (contrastado con `research/pdf/Lung-RADS-2022-Summary.pdf`): categorías de nódulos sólidos por tamaño, stepped management 3→2 y 4A→3, juxtapleural ≤10 mm, inflamatorio 0/2 y vía aérea subsegmentaria = 2.

## 3. Hallazgos

Severidad → prioridad en YouTrack: alta = Major, media = Normal, baja = Minor.

### 3.1 Modelos predictivos y elegibilidad (codex-nodules)

| ID | Sev. | Hallazgo | Ubicación | Evidencia |
|---|---|---|---|---|
| LUN-16 | Alta | «Herder (BTS · LR)» usa LR fijos (0.08/0.17/1.9/9.9) que ni Herder ni BTS publican | `lib/predictive/index.ts:90,126,400,440,454` | Caso del test: 27.09 % (LR) vs 61.82 % (Herder publicado) |
| LUN-17 | Alta | En screening, Herder usa P_Brock donde el coeficiente 3.691 es para P_Mayo | `lib/predictive/index.ts:342,498,513,520` | 15 mm, PET moderado: 59.66 % vs 70.57 % |
| LUN-18 | Alta | Brock recibe el diámetro medio; se desarrolló con el máximo transversal | `NoduleStep.tsx:80,178`; `index.ts:239,300` | 20×10 mm: 25.4 % (media) vs 38.0 % (máximo) |
| LUN-19 | Media | Mayo sin aviso en 1–<4 mm (validado 4–30 mm) | `index.ts:159,189,234` | 1 mm → disponible, 5.85 % |
| LUN-20 | Media | Bandas 5/65 % presentadas junto a la etiqueta BTS (10/70 %) | `index.ts:28`; `ResultsStep.tsx:258` | BTS 2015 p.ii28 |
| LUN-21 | Media | PLCOm2012 acepta 40–90 años como rango del modelo (validado 55–74) | `plcom2012Schema.ts:31`; `registry.ts:41` | Tammemägi 2013 p.734 |
| LUN-22 | Media | Historias de tabaquismo imposibles pasan la validación | `plcom2012Schema.ts:46,50,55` | 40 a, 70 a fumando, 60 a sin fumar → válido |
| LUN-23 | Baja | El 1,51 % procede de Tammemägi 2014 (PLoS Med), que no se cita | `registry.ts:14`; `references.ts:173` | PMID 25460915 |
| LUN-24 | Baja | El override del umbral acepta −1, 2 y NaN | `registry.ts:38` | Solo afecta a la API exportada |
| LUN-25 | Baja | Dominio de entrada: recuento no entero, edad sin máximo, falta el antecedente de cáncer de pulmón, textos de los límites de 30 mm y 8 mm | `noduleInput.ts:64` y otros | — |

### 3.2 Guías clínicas, wizard y configuración (claude-nodules)

| ID | Sev. | Hallazgo | Ubicación | Fuente |
|---|---|---|---|---|
| LUN-26 | Alta | Quiste atípico: la regla de cat. 3 nunca se ejecuta (pared gruesa → 4A antes) y `:114` da 3 a quistes sin pared gruesa | `atypicalCyst.ts:106-116` | ACR v2022 §I.A |
| LUN-27 | Media | El crecimiento >1.5 mm no se limita a un intervalo de 12 meses | `lungRads.ts:18-25` | ACR v2022 §II.A.1 |
| LUN-28 | Media | Semi-sólido: se escala por el crecimiento del diámetro total, no del componente sólido | `lungRads.ts:101-104` | Tabla Lung-RADS v2022 |
| LUN-29 | Media | Juxtapleural: cat. 2 aunque el nódulo crezca y sin comprobar la forma | `lungRads.ts:238-246` | ACR v2022 §I.B |
| LUN-30 | Media | El modificador S y los avisos se pierden en las categorías especiales | `lungRads.ts:434-437` | ACR v2022 §II.B |
| LUN-31 | Media | Vía aérea «persistente» → 4B aunque sea subsegmentaria; el caso inflamatorio solo admite 0 | `lungRads.ts:205-224` | ACR v2022 §I.D |
| LUN-32 | Baja | GGN ≥30 mm estable en seguimiento → 3 si no se indica la categoría previa | `lungRads.ts:64-80` | Tabla Lung-RADS v2022 |
| LUN-33 | Media | Riesgo alto de Fleischner derivado de umbrales de cribado (>65 a, ≥30 paq-año) | `guidelines.ts:59-76`; `RiskStep.tsx:38-46` | Fleischner 2017 (criterio cualitativo) |
| LUN-34 | Baja | Un nódulo nuevo en seguimiento obliga a introducir el diámetro previo | `WizardContainer.tsx:180-190`; `noduleInput.ts:194-205` | — |
| LUN-35 | Baja | Constantes sin uso en `config/guidelines.ts` (con % de malignidad que v2022 eliminó); «~3 %» de Fleischner sin verificar | `guidelines.ts`; `fleischner.ts:133` | ACR v2022 §IV.A |
| LUN-36 | Baja | `w5_capture.mjs` ajeno rompe el lint | raíz | — |

### 3.3 Detalle de los hallazgos altos

**LUN-16 — Herder «BTS · LR».** `odds_post = odds_pre × LR` con LR por captación FDG. Herder 2005 publica una regresión logística sobre P_Mayo, y BTS 2015 (p.ii28, apéndice p.ii51) remite a ese modelo. Los LR tampoco salen de la tabla 1 de Herder (≈0.028/0.123/1.686/5.287). El test `predictive.test.ts:183,214` fija el valor erróneo como esperado.

**LUN-17 — Herder con Brock.** La regresión se ajustó con P_Mayo. Meter P_Brock da un híbrido sin validar, aunque cada coeficiente sea correcto por separado. Que BTS use Brock para decidir si se hace un PET no convierte a Brock en el predictor de Herder.

**LUN-18 — Diámetro de Brock.** Fleischner/Lung-RADS (y Herder) usan el diámetro medio; Brock, el máximo transversal. Propuesta: recoger el eje largo y el corto y derivar cada medida.

**LUN-26 — Quiste atípico.** El orden de las comprobaciones en `classifyAtypicalCyst` impide llegar a «3 – previously stable thick-walled cyst with a growing cystic component». Los uniloculares de pared fina no se clasifican según la ACR, pero `:114` les asigna 3 si son «previamente estables y con componente creciente».

## 4. Limitaciones de la revisión

- La tabla oficial completa de Lung-RADS v2022 no está en `research/pdf/` (solo el *Summary of Changes*). LUN-28, la condición basal/nuevo de LUN-29 y LUN-32 se basan en la tabla ACR citada de memoria; conviene añadir el PDF de la tabla y confirmarlos.
- El «~3 %» de Fleischner para >8 mm no se ha contrastado con el PDF de MacMahon 2017.
- No se han revisado a fondo: service worker, analytics, CI, E2E ni accesibilidad.
- Los valores numéricos de los hallazgos de modelos se reprodujeron cargando los módulos reales; el caso de LUN-16 se recalculó a mano por separado.

## 5. Gestión de tareas

- Las tareas pasan de `td` a YouTrack (LUN-14). `AGENTS.md` está actualizado.
- Histórico del CHANGELOG cargado como issues `Done`: LUN-1 a LUN-12 (las issues de td `td-aaf5e4` → LUN-9, `td-a9800d` → LUN-10 y `td-f81375` → LUN-12).
- El directorio local `.todos/` (base de td, ya en `.gitignore`) se puede borrar cuando se confirme la migración.
