# Recálculo independiente de los scores predictivos

Repo: `/home/erosales/proyectos/lungnodules`, rama `fix/lun-major-findings` @ `761e5d26` (v1.7.1).
Método: extraje las fórmulas de los PDFs de `research/pdf/` (texto con pdfjs-dist; ps2ascii producía basura por encoding ofuscado), escribí una implementación propia en Python (`devin-recalc/models.py`) **antes** de leer `lib/predictive/` ni `lib/eligibility/`, y luego comparé contra los módulos reales mediante un test de Jest temporal (`__tests__/devin-tmp-recalc.test.ts`, **creado y borrado**; volcó 1.088.640 casos predictivos + 129.600 PLCOm2012 a JSON).

---

## 1. Fuentes y valores verificados

### Mayo — Swensen 1997 (Arch Intern Med 1997;157:849-855)

Ecuación impresa (p. 853 del PDF):

```
x = −6.8272 + 0.0391·edad + 0.7917·cigarrillos + 1.3388·cáncer
    + 0.1274·diámetro(mm) + 1.0407·espiculación + 0.7838·lóbulo superior
P = eˣ/(1+eˣ)
```

- cigarrillos = 1 si fumador actual o exfumador; cáncer = 1 si cáncer extratorácico >5 años; diámetro en mm; espiculación/lóbulo superior = 0/1.
- Exclusiones del paper: cáncer diagnosticado en los últimos 5 años; cáncer de pulmón previo. Cohorte: SPNs (nódulos **solitarios**) de **4–30 mm** en radiografía de tórax.
- Verificación: mi implementación reproduce las **144 celdas de la Tabla 3** del artículo (16 combinaciones × edades 35/55/75 × 10/20/30 mm) con |error| máx. 0,0055, atribuible al redondeo a 2 decimales de la tabla. → la fórmula queda verificada internamente.

### Brock — McWilliams 2013 (NEJM 2013;369:910-919), Tabla 2

La Tabla 2 está rotada y repartida en dos páginas; reconstruí las columnas por coordenadas. Coeficientes β (centrados: edad−62, recuento−4; tamaño centrado en 4 mm vía la transformación):

| Predictor | 1a (parsim.) | 1b (+espic.) | 2a (full) | 2b (full+espic.) |
|---|---|---|---|---|
| Edad | — | — | 0.0321 | 0.0287 |
| Sexo femenino | 0.5806 | 0.6467 | 0.5635 | 0.6011 |
| Hist. familiar CP | — | — | 0.3013 | 0.2961 |
| Enfisema | — | — | 0.3462 | 0.2953 |
| Tamaño (transf.) | −5.8616 | −5.5537 | −5.6693 | −5.3854 |
| No sólido/GGO | — | — | −0.3005 | −0.1276 |
| Semi-sólido | — | — | 0.3395 | 0.3770 |
| Lóbulo superior | 0.6439 | 0.6009 | 0.7116 | 0.6581 |
| N.º nódulos | — | — | −0.0803 | −0.0824 |
| Espiculación | — | 0.9309 | — | 0.7729 |
| Constante | −6.5929 | −6.6144 | −6.8071 | −6.7892 |

Verificación interna: cada OR impreso de la tabla coincide con exp(β) (p. ej. 2b: e^0.6011=1.82 ✓, e^0.7729=2.17 ✓).

**Transformación del tamaño**: la fórmula de la nota a pie de Tabla 2 se imprime como imagen y no se extrajo del PDF; la nota sí confirma centrado en 4 mm y transformación por polinomios fraccionarios. La forma `(d/10)^−0,5 − (0,4)^−0,5 = (d/10)^−0,5 − 1,58113883` es la usada por la calculadora oficial de Brock y por implementaciones publicadas (p. ej. OncoToolkit cita los mismos coeficientes con más decimales: −6.78917, 0.0286687, −5.3854840…, coherentes con la Tabla 2 redondeada). Signo correcto: β<0 y el término decrece con d → el riesgo crece con el tamaño y se aplana (Fig. 1 del paper).

### Herder — Herder 2005 (Chest 2005;128:2490-2496)

Ecuación impresa (sección Results, p. ~2492):

```
P = 1/(1+e^−x);  x = −4.739 + 3.691·P_Mayo(fracción 0–1)
    + 2.322·débil + 4.617·moderada + 4.771·intensa
```

- P_Mayo entra como **fracción 0–1** ("percentage of probability"; si se metiera 0–100 saturaría — comprobado). Las 3 categorías son dummies vs. "sin captación". Escala visual de 4 puntos: ausente/débil(faint)/moderada/intensa.
- Reproducido igualmente en Mourato 2020 (PMC7159041, en el repo).
- **Aviso**: los ejemplos de la Figura 2 de Mourato ("33,2% → 10%" sin captación; "6,2% → 75,8%" con captación moderada) **no se reproducen** con su propia fórmula impresa (yo obtengo 2,9% y 52,7%). Probablemente los calcularon con MedCalc u otro método (su Tabla 1 usa categorías por SUVmax, no la escala visual). No es evidencia contra la fórmula primaria, pero conviene no usar esos casos como referencia.

### PLCOm2012 — Tammemägi 2013 (NEJM 2013;368:728-736), Tabla 2

β: edad+0.0778868 (−62); raza: blanco/indio americano o nativo de Alaska = 0 (ref.), negro +0.3944778, hispano −0.7434744, asiático −0.466585, hawaiano/isleño del Pacífico +1.027152; educación −0.0812744 por nivel (−4, escala 1–6); IMC −0.0274194 (−27); EPOC +0.3553063; cáncer previo +0.4589971; hist. familiar CP +0.587185; fumador actual +0.2597431; intensidad **(cig/día ÷ 10)^−1 − 0.4021541613**, β=−1.822606; duración +0.0317321 (−27); años desde dejarlo −0.0308572 (−10); constante −4.532506. P(6 años) = e^lp/(1+e^lp). Modelo solo para personas que han fumado alguna vez.

El cutoff del paper para comparar con NLST fue **>1,3455 %** (no 1,51 %); el umbral 1,51 % proviene de trabajo posterior (Tammemägi et al., JTO 2019: riesgo ≥1,51 % = punto donde el cribado reduce mortalidad; 65.º percentil).

---

## 2. Casos publicados reproducidos

| Caso | Fuente | Esperado | Mi impl. | App | OK |
|---|---|---|---|---|---|
| Mayo Tabla 3, 144 celdas | Swensen 1997 p.853 | ±0,005 | max diff 0,0055 | max diff idéntico | ✓ |
| PLCOm2012: 62a, blanco, edu 4, IMC 27, exfum., 80 cig/d, dur 27, quit 10 | paquete R resplab/PLCOm2012 | 1,7509 % | 1,7509 % | 1,7509 % | ✓ |
| Herder pretest 0,187 + intenso → 0,673 | comentario en `lib/predictive/index.ts` (equivale a ejemplo habitual) | 0,673 | 0,6735 | 0,6735 | ✓ |
| Brock (coeficientes) | Tabla 2 McWilliams | exp(β)=OR impreso | ✓ las 4 variantes | idem | ✓ |
| Mourato Fig. 2 (33,2%→10 %; 6,2%→75,8 %) | PMC7159041 | — | 2,9 % / 52,7 % | — | ✗ los ejemplos de Mourato no se reproducen con su propia fórmula (ver §1) |

## 3. Recálculo de los esperados de los tests de la app

| Test | Entrada | Mi valor | Esperado app | ¿Correcto? |
|---|---|---|---|---|
| Mayo banda alta | 65a, actual, cáncer>5a, 16 mm, espic+, superior | 0,84654 | 0,8465 | ✓ |
| Mayo Tabla 3 baseline | 55a, nunca, 20 mm, sin factores | 0,10634 | ≈0,11 | ✓ |
| Brock 2b | 70a M, fam+, enf+, semisólido, 10 mm, 3 nód., espic+, superior | 0,41410 | 0,4141 | ✓ |
| Herder pretest<10 % | Mayo(40a, nunca, 8 mm) = 0,01415 → moderada | 0,48256 | 0,4826 | ✓ |
| Herder logística | Mayo(60a, actual, 10 mm, superior) = 0,16360 → moderada | 0,61818 | 0,6182 (pretest 0,1636) | ✓ |
| Snapshot | Mayo(72a, exfum., cáncer>5a, 18 mm, espic+, sup.) = 0,90345; Herder intenso | 0,90345 / 0,96665 | 0,9035 / 0,9666 | ✓ |
| Brock 2b 15 mm | 65a M, sólido, 1 nód., espic−, superior | 0,25373 | 0,2537 | ✓ |
| Brock 2a | mismo, espiculación no evaluada | 0,29738 | 0,2974 | ✓ |
| Incidental 7 mm + PET intenso | Mayo(74a, actual, 7 mm, sup.) = 0,18748 → intenso | 0,18748 / 0,67348 | 0,187 / 0,673 | ✓ |
| Herder en screening | Mayo(60a, actual, 15 mm, sup.) = 0,26998 → moderada | 0,26998 / 0,70568 | 0,27 / 0,7057 | ✓ |
| Brock diámetro máximo | d_máx 20 mm vs d_medio 15 mm | 0,37997 | ≈0,38 | ✓ |
| Brock fallback diámetro medio | 15 mm sin máximo | 0,25373 | 0,2537 + nota | ✓ |
| PLCOm2012 tests | ver §2 (1,7509 %), NaN a intensidad 0, offsets de raza | ✓ | ✓ | ✓ |

**Todos los esperados de los tests son correctos.**

## 4. Comparación masiva con los módulos reales

Test de Jest temporal ejecutando `getPredictiveSummaries` y `computePlcom2012` sobre un barrido cartesiano (contexto × edad 35–85 × diámetro 3/4/8/15/20/30/31 mm × sexo × tabaquismo × cáncer × espiculación undef/−/+ × lóbulo × tipo × n.º nódulos × PET × diámetro máximo):

| Modelo | Casos "available" | Dif. máx. vs mi impl. |
|---|---|---|
| Mayo | 207.360 | 1,1e-16 (precisión máquina) |
| Herder (incl. preTestProbability) | 276.480 | 2,2e-16 |
| Brock 2a+2b | 505.440 | 1,2e-10 |
| PLCOm2012 | 129.600 | 4,4e-16 |

- **0 discrepancias numéricas** en ~1,12 millones de casos. La dif. de Brock (~1e-10) viene del offset `1.58113883` truncado a 8 decimales vs. el valor exacto 1,5811388300841898 — inmaterial.
- Bandas de riesgo: **0 discrepancias**; fronteras correctas (<5 % bajo; 5–65 % intermedio incl. el 65 % exacto; >65 % alto).
- Estatus (available/insufficient_data/not_applicable) coherentes en todo el barrido.

## 5. Lógica de aplicabilidad

Correcta según las fuentes:

- Mayo: exige contexto incidental, diámetro ≤30 mm, sin cáncer conocido, cáncer extratorácico no reciente (<5a) y los 6 predictores (incl. espiculación evaluada). ✓
- Brock: exige contexto de cribado, ≤30 mm y los predictores del modelo full; usa 2b si se evaluó espiculación y 2a si no (distingue correctamente "ausente" de "no evaluable", con nota). ✓ Usa el diámetro máximo transversal si existe, si no el medio con nota de posible infraestimación — fiel a McWilliams ("maximum transverse size"). ✓
- Herder: requiere PET + todos los campos de Mayo + captación; propaga los missing de Mayo; usa Mayo (nunca Brock) también en screening, como la fórmula publicada. ✓
- PLCOm2012: esquema limita a fumador actual/exfumador (modelo solo para ever-smokers), educación 1–6, NaN si intensidad ≤0. ✓

Observaciones (ninguna es un error de cálculo):

1. **Mayo calcula a <4 mm** (p. ej. 3 mm incidental → "available", p=0,0135), aunque Swensen derivó el modelo en 4–30 mm. Herder sí bloquea <4 mm. Extrapolación sin aviso. *Menor.*
2. **Mayo/Herder no tienen en cuenta `isMultiple`**: Swensen es un modelo de nódulo **solitario**; la app lo aplica al "nódulo dominante" sin avisar. *Menor.*
3. **Mayo se calcula también para nódulos en vidrio deslustrado/semi-sólidos**; Swensen trabajó con SPNs en radiografía (esencialmente sólidos). Extrapolación no advertida. *Menor.*
4. **Brock bloquea >30 mm**: decisión razonable (masa, no nódulo) pero no es una restricción explícita de McWilliams; PanCan incluía también nódulos perifisurales (0/571 malignos) — la app no informa de que los perifisurales eran sistemáticamente benignos. *Menor/informativo.*
5. **Herder se permite en contexto de cribado**: la fórmula es matemáticamente correcta (usa pretest Mayo), pero la cohorte de Herder era de nódulos incidentales derivados a PET; usarlo en screening es una extrapolación. La app lo documenta. *Informativo.*
6. **Mayo ignora `maxDiameterMm`**: la restitución ACCP de la fórmula dice "largest nodule measurement"; la app usa el "diámetro medio/dominante" y lo documenta en i18n. Si el usuario introduce la media de diámetros ortogonales, el riesgo se infraestima levemente. *Menor.*
7. **Esquema PLCOm2012: edad 40–90** mientras el paper advierte que fuera de 55–74 el rendimiento es incierto. *Menor.*
8. **Inconsistencia de validación**: `maxDiameterMm` puede ser menor que `diameterMm` sin error (p. ej. medio 31 + máximo 25 → Brock calcula y no bloquea >30). *Menor.*
9. **`hasKnownMalignancy` bloquea Mayo pero no Brock** (McWilliams no lo excluía explícitamente). *Informativo.*
10. **`isMultiple=false` con `noduleCount` relleno** usa el recuento dado — input inconsistente, inocuo. *Trivial.*

## 6. Textos de la web (`config/i18n.ts`)

- `explanations.mayo`: correcto (4–30 mm, predictores, "diámetro medio" coherente con el campo de la app).
- `explanations.brock`: correcto (PanCan/BCCA, predictores, transformación no lineal, variante 2a si no se evaluó espiculación, hasta 30 mm, fallback a diámetro medio).
- `explanations.herder`: fórmula correcta (P_pre en fracción 0–1, pesos 0/2,322/4,617/4,771, escala de 4 puntos, 4–30 mm). La nota de "PET poco sensible <8 mm" es una cautela razonable y estándar.
- `riskBands` "(ACCP 2013): bajo <5 %, intermedio 5–65 %, alto >65 %": **correcto** — son las categorías ACCP (Gould et al., Chest 2013; verificado también vía Thorax 2018 "keep calm and carry on", que atribuye a ACCP las tres bandas). Fronteras en código coherentes (intermedio incluye 65 %).
- Nota Herder "BTS 2015 recomienda PET-CT cuando el riesgo pre-test es ≥10 %": esencialmente cierto, aunque el 10 % de BTS se refiere al riesgo **Brock**, no Mayo; la nota aclara que no es restricción del modelo. *Trivial.*
- `disclaimer`: "P_pre en fracción 0–1" correcto.

## 7. Discrepancias

**Ninguna discrepancia de cálculo.** Los únicos hallazgos son de aplicabilidad/documentación (§5.1–5.10), todos de severidad menor o informativa. No hay ningún bug en los coeficientes, transformaciones, centrados ni codificación de variables de ninguno de los cuatro modelos.

## 8. Limitaciones

- La transformación del tamaño de Brock no se pudo leer del PDF (es una imagen); se verificó por coherencia interna (centrado en 4 mm), coherencia con la calculadora oficial y con la Fig. 1 del paper, y porque los valores coinciden con los esperados de los tests a 4 decimales.
- Para Brock el paper no ofrece casos numéricos resueltos; la verificación externa es por consistencia OR=exp(β) en la Tabla 2 y por la coincidencia con la calculadora pública.
- El barrido no varió `hasKnownMalignancy`/`isImmunocompromised` (siempre false); su rama de código es evidente por inspección.
- Los ejemplos numéricos de Mourato 2020 (Fig. 2) no son reproducibles por su propia fórmula impresa — conviene no usarlos como tests de regresión.

## 9. Test temporal

`__tests__/devin-tmp-recalc.test.ts` — creado para cargar los módulos reales y volcar resultados a `devin-recalc/app-results*.json`; **borrado tras el uso**. `git status` limpio (solo queda `w5_capture.mjs`, preexistente y ajeno).

**Conclusión**: Mayo, Brock 2a/2b, Herder y PLCOm2012 están implementados correctamente; los esperados de los tests son correctos; las bandas ACCP y los textos explicativos son fieles a las fuentes.
