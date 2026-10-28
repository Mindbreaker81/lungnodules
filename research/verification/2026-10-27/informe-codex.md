# Recálculo independiente de los modelos predictivos

Fecha: 2026-10-27. Repositorio `/home/erosales/proyectos/lungnodules`, rama `fix/lun-major-findings`, HEAD `761e5d26`, versión 1.7.1. Seguimiento: LUN-38.

**Resultado:** las fórmulas y los resultados numéricos de Mayo, Brock 2a/2b, Herder 2005 y PLCOm2012 coinciden con una implementación independiente de las fuentes primarias. No encontré un error de coeficientes, signo, centrado o escala. Sí hay problemas de dominio de entrada y de presentación de la aplicabilidad; se detallan más abajo. No se ha modificado ningún archivo del repositorio ni creado commits.

## Método y trazabilidad

1. Leí los cuatro PDFs locales, sin consultar `research/*.md`, código de modelos ni tests. Extraje texto con PyMuPDF en un entorno temporal; `pdftotext` no estaba instalado. Todos los PDFs fueron legibles. La transformación de Brock estaba embebida como imagen: la comprobé visualmente en la página 16.
2. Escribí `codex-recalc/independent.cjs` antes de abrir `lib/predictive/` o `lib/eligibility/`. SHA-256: `134f447d6b2616dcbf4fa3124f8277eb267b1ef11fba506bf8718ba2f3b12869`. Posteriormente confirmé visualmente la escala del nomograma de Herder, sin cambiar esa implementación.
3. Cargué los módulos TypeScript reales mediante `typescript.transpileModule`, desde un script externo (`audit.cjs`), conservando sus funciones originales. Intercepté las llamadas de los tests para recalcular sus entradas con mi implementación. No fue necesario crear un test temporal dentro del repo.
4. Además ejecuté Jest real: **2 suites, 27 tests y 1 snapshot aprobados**. Comando: `./node_modules/.bin/jest --runInBand __tests__/predictive/predictive.test.ts __tests__/eligibility/plcom2012.test.ts`.
5. Los scripts, extracciones y resultados completos están en `codex-recalc/`, junto a este informe. Los resultados aritméticos se expresan como fracciones 0–1; multiplicar por 100 da el porcentaje. Las diferencias indicadas también están en escala 0–1.

## Fuentes primarias y valores verificados

### Mayo — Swensen 1997

Archivo: `research/pdf/swensen 10.1001-archinte.1997.00440290031002.pdf`. Artículo: *The probability of malignancy in solitary pulmonary nodules*, Arch Intern Med 157:849–855, [DOI](https://doi.org/10.1001/archinte.1997.00440290031002).

Página PDF 4 / revista 852, ecuaciones (1)–(2):

```text
z = −6.8272 + 0.0391·edad + 0.7917·fumador + 1.3388·cáncer
    + 0.1274·diámetro + 1.0407·espiculación + 0.7838·lóbulo_superior
P = 1 / (1 + exp(−z))
```

Todos los términos binarios son 0/1. Fumador incluye actual y previo; cáncer significa antecedente extratorácico diagnosticado hace **más de 5 años**; edad en años y diámetro en mm, sin centrados ni transformaciones. Espiculación y lóbulo superior son términos distintos, con pesos 1.0407 y 0.7838 respectivamente. Página PDF 2 / revista 850, métodos: se promedian los diámetros si el nódulo es ovalado u oblongo. El texto de la web sobre diámetro medio es correcto.

Dominio original: nódulos **solitarios**, recién descubiertos, indeterminados radiológicamente, 4–30 mm (resumen, PDF 1 / 849; métodos, PDF 2 / 850). PDF 4 / 852 excluye explícitamente cáncer diagnosticado en los últimos 5 años y antecedente de cáncer de pulmón. La variable `over5y` reproduce el término de cáncer remoto; la app no representa específicamente antecedente de cáncer de pulmón. La clasificación del artículo contiene pequeñas diferencias entre formulaciones de “≥5” y “>5”; la ecuación explicada usa “more than 5 years”.

### Brock — McWilliams 2013, modelos completos 2a y 2b

Archivo: `research/pdf/McWilliams - Probability of Cancer in Pulmonary Nodules Detected on First Screening CT.pdf`. [Artículo](https://doi.org/10.1056/NEJMoa1214726), NEJM 369:910–919. La copia local es el manuscrito de autor: **tabla 2, páginas PDF 15–16**, no páginas 15–16 de NEJM. La cabecera de continuación en PDF 16 conserva etiquetas de los modelos “a”; el contenido continúa las filas 1b/2b iniciadas en PDF 15.

| Término | Modelo 2a, sin espiculación | Modelo 2b, con espiculación |
|---|---:|---:|
| Constante | −6.8071 | −6.7892 |
| Edad − 62 | 0.0321 | 0.0287 |
| Mujer | 0.5635 | 0.6011 |
| Historia familiar de cáncer pulmonar | 0.3013 | 0.2961 |
| Enfisema | 0.3462 | 0.2953 |
| Tamaño transformado T | −5.6693 | −5.3854 |
| Vidrio deslustrado / no sólido | −0.3005 | −0.1276 |
| Semi-sólido | 0.3395 | 0.3770 |
| Sólido | 0 | 0 |
| Lóbulo superior | 0.7116 | 0.6581 |
| Recuento de nódulos − 4 | −0.0803 | −0.0824 |
| Espiculación | No se introduce | 0.7729 |

Nota al pie de tabla 2 (PDF 16), verificada en la imagen:

```text
T = (diámetro_mm / 10)^(−0.5) − 1.58113883
P = 1 / (1 + exp(−suma_de_términos))
```

No se resta primero 4 mm al diámetro para elevarlo: el centrado del tamaño está contenido en la transformación publicada. Edad centrada en 62, recuento en 4; variables binarias 0/1; los tipos de nódulo son categorías mutuamente excluyentes. PDF 3, métodos: **diámetro máximo transversal**, no componente sólido ni diámetro medio. PDF 2: PanCan incluyó fumadores actuales/previos de 50–75 años sin antecedente de cáncer pulmonar; BCCA, 50–74. PDF 3: nódulos en el **primer TC**; la espiculación no se recogió en BCCA. Usar 2a cuando falta espiculación es coherente; no equivale a usar 2b con espiculación negativa.

### Herder 2005

Archivo: `research/pdf/Herder 2005 Clinical Prediction Model To Characterize Pulmonary Nodules Validation and Added Value of 18 F-Fluorodeoxyglucose Positron Emission Tomography.pdf`. Chest 128:2490–2496, [DOI](https://doi.org/10.1378/chest.128.4.2490).

PDF 3 / revista **2492**, apartado de combinación con PET:

```text
z = −4.739 + 3.691·P_Mayo + FDG
FDG: ausente=0; débil=2.322; moderada=4.617; intensa=4.771
P = 1 / (1 + exp(−z))
```

El texto de la ecuación dice “percentage”, una ambigüedad real del original. **La figura 3, PDF 5 / revista 2494, muestra `Pr(Swensen)` de 0 a 1** y resuelve la escala: se introduce la fracción, no 0–100 ni el logit de Mayo. Confirmado visualmente. No hay un segundo modelo Herder ni sustitución por Brock en el artículo.

PDF 2 / 2491: FDG en escala visual ordinal de cuatro categorías; diámetro como media transversal; nódulos solitarios ≤30 mm, indeterminados, remitidos a PET desde práctica clínica; exclusión de malignidad en los últimos 5 años. PDF 3 / 2492: edades observadas 32–85. El umbral inferior de 4 mm de la app procede del dominio Mayo, no de una exclusión propia de Herder descrita como tal en sus métodos. El aviso de menor sensibilidad de PET en nódulos pequeños es razonable; 8 mm es un umbral práctico de guía, no un coeficiente ni un corte de la regresión.

### PLCOm2012 — Tammemägi 2013

Archivo: `research/pdf/Selection Criteria for Lung-Cancer Screening.pdf`. [Artículo](https://doi.org/10.1056/NEJMoa1211776), NEJM 368:728–736. **Tabla 2 y notas, PDF 4 / revista 731**:

```text
z = −4.532506
  + 0.0778868·(edad−62) + raza
  − 0.0812744·(educación−4) − 0.0274194·(IMC−27)
  + 0.3553063·EPOC + 0.4589971·cáncer_personal
  + 0.587185·historia_familiar_pulmonar + 0.2597431·fumador_actual
  − 1.822606·[(cigarrillos_día/10)^(−1) − 0.4021541613]
  + 0.0317321·(años_fumando−27) − 0.0308572·(años_desde_abandono−10)
P_6años = 1 / (1 + exp(−z))
```

Raza: blanca 0; negra 0.3944778; hispana −0.7434744; asiática −0.466585; indígena americana/nativa de Alaska 0; hawaiana/isleña del Pacífico 1.027152. Todos coinciden con tabla 2. Educación ordinal: 1 sin secundaria completa; 2 secundaria completa; 3 formación posterior a secundaria; 4 estudios universitarios parciales; 5 graduado universitario; 6 posgrado/profesional. No son variables indicadoras independientes. IMC en kg/m²; duración y abandono en años; intensidad histórica positiva en cigarrillos/día, también para exfumadores. Actual=1, previo=0; para actual el abandono es 0. Los otros antecedentes son 0/1.

PDF 3 / revista 730, tabla 1: PLCO y NLST reclutaron personas de 55–74 años. La regresión se deriva de quienes alguna vez fumaron (tabla 2), con horizonte de 6 años. El intervalo 40–90 permitido por la app es extrapolación, no el rango de desarrollo/validación de este artículo. La referencia del propio estudio para equiparar selección a NLST es 1.3455% (PDF 6 / 733); **1.51% no se deriva de esta tabla ni de este análisis de selección** y necesita su referencia específica posterior.

## Referencias numéricas publicadas reproducidas

### Swensen, tabla 3 (PDF 6 / revista 854)

Transcribí las 16 filas × 9 combinaciones de edad/tamaño: **144 resultados** (`published.json`). Con la ecuación impresa, 133 quedan a ≤0.005 de la tabla y 11 exceden ligeramente esa tolerancia; el máximo es aproximadamente 0.00547. Comprobé visualmente la tabla original. Esto es una inconsistencia pequeña entre tabla y ecuación publicadas, no una discrepancia app/ecuación. No atribuyo su causa a redondeo de coeficientes sin evidencia: podría implicar valores internos distintos o redondeo de la tabla. Ejemplos:

| Edad, mm; fumador/cáncer/espículas/superior | Tabla 3 | Ecuación propia | App |
|---|---:|---:|---:|
| 55, 20; 0/0/0/0 | 0.11 | 0.1063384682 | 0.1063384682 |
| 75, 30; 0/0/0/0 | 0.48 | 0.4818330008 | Misma ecuación |
| 35, 10; 0/0/0/0 | 0.02 | 0.0149983961 | Misma ecuación |
| 55, 20; 0/0/1/1 | 0.43 | 0.4245310807 | Misma ecuación |

La primera fila es exactamente el caso publicado que usa el test del repo: su esperado 0.11 es correcto con su tolerancia de dos decimales.

### Herder, figura 3

El artículo ofrece un nomograma, no una lista de pacientes con soluciones exactas. Reproduje puntos de su escala con P_Mayo=0.5:

| Captación | Recálculo |
|---|---:|
| absent | 0.0524758182 |
| faint | 0.3608907798 |
| moderate | 0.8485791093 |
| intense | 0.8673237073 |

Los puntos se corresponden con la escala del nomograma dentro de su resolución gráfica; no afirmo exactitud de diez decimales a partir de la imagen. Sirven especialmente para descartar la interpretación 0–100, que saturaría el resultado.

### PLCOm2012, figura 1 (PDF 5 / revista 732)

La leyenda proporciona un perfil completo: 62 años, blanco, educación 4, IMC 27, sin EPOC ni antecedentes personales/familiares, exfumador, 27 años fumando y abandono hace 10. Reconstruí la curva cambiando la intensidad:

| Cigarrillos/día | Recálculo de probabilidad a 6 años |
|---:|---:|
| 5 | 0.0005841611 |
| 10 | 0.0036038456 |
| 20 | 0.0089169850 |
| 40 | 0.0139918595 |
| 80 | 0.0175092234 |

La imagen coincide visualmente (p. ej., 20 cig/día ≈0.009, 80 ≈0.0175). El caso del test “1.75%”, aunque su comentario cita un paquete R, coincide además con esta curva primaria: **0.0175092233967**. No usé `research/plcom2012.R` para fijar el esperado.

### Brock

No encontré un ejemplo individual completo con resultado numérico exacto en el artículo local. Sus ejemplos de umbrales son métricas agregadas, no casos de paciente. Los valores de Brock de la siguiente sección son **cálculos propios desde tabla 2**, no supuestos resultados de una calculadora externa. No se ha realizado una validación independiente contra un servicio de calculadora en línea.

## Casos de los tests y snapshot

A continuación figuran todas las llamadas de los tests predictivos con resultado calculable, incluidas repeticiones. El input completo y las notas/estados se conservan en `test-cases.json`. “OK” significa coincidencia propia/app dentro de 1e−12; cada esperado numérico literal pasó además con su tolerancia original.

| Caso de test / entrada | Modelo | Mi valor | App | Resultado |
|---|---|---:|---:|---|
| Mayo calculation returns probability and high risk band; edad 65, 16 mm | mayo | 0.8465377256 | 0.8465377256 | OK |
| Mayo matches Swensen 1997 Table 3 baseline case (55 y, 20 mm, no risk factors); edad 55, 20 mm | mayo | 0.1063384682 | 0.1063384682 | OK |
| Brock calculation returns probability and intermediate risk band; edad 70, 10 mm | brock | 0.4141016234 | 0.4141016234 | OK |
| Herder computes below 10% pre-test and notes the BTS guidance; edad 40, 8 mm | mayo | 0.0141470651 | 0.0141470651 | OK |
| Herder computes below 10% pre-test and notes the BTS guidance; edad 40, 8 mm | herder | 0.4825612805 | 0.4825612805 | OK |
| Herder applies the published logistic model on Mayo pre-test; edad 60, 10 mm | mayo | 0.1635976113 | 0.1635976113 | OK |
| Herder applies the published logistic model on Mayo pre-test; edad 60, 10 mm | herder | 0.6181819826 | 0.6181819826 | OK |
| Predictive summaries snapshot; edad 72, 18 mm | mayo | 0.9034535101 | 0.9034535101 | OK |
| Predictive summaries snapshot; edad 72, 18 mm | herder | 0.9666457505 | 0.9666457505 | OK |
| Brock non-linear size term keeps a 15 mm nodule at intermediate risk; edad 65, 15 mm | brock | 0.2537339998 | 0.2537339998 | OK |
| Brock Model 2a (without spiculation) is used when hasSpiculation is undefined; edad 65, 15 mm | brock | 0.2973782711 | 0.2973782711 | OK |
| Brock Model 2a and 2b produce different probabilities for the same nodule; edad 65, 15 mm | brock | 0.2973782711 | 0.2973782711 | OK |
| Brock Model 2a and 2b produce different probabilities for the same nodule; edad 65, 15 mm | brock | 0.4241168834 | 0.4241168834 | OK |
| Brock Model 2a differs from 2b when spiculation is absent vs not evaluable; edad 65, 15 mm | brock | 0.2973782711 | 0.2973782711 | OK |
| Brock Model 2a differs from 2b when spiculation is absent vs not evaluable; edad 65, 15 mm | brock | 0.2537339998 | 0.2537339998 | OK |
| Mayo weights spiculation above upper-lobe location; edad 60, 12 mm | mayo | 0.2460112836 | 0.2460112836 | OK |
| Mayo weights spiculation above upper-lobe location; edad 60, 12 mm | mayo | 0.2015073348 | 0.2015073348 | OK |
| incidental 7 mm with intense PET: Mayo pre-PET ~18.7%, Herder post-PET ~67%; edad 74, 7 mm | mayo | 0.1874751797 | 0.1874751797 | OK |
| incidental 7 mm with intense PET: Mayo pre-PET ~18.7%, Herder post-PET ~67%; edad 74, 7 mm | herder | 0.6734808337 | 0.6734808337 | OK |
| incidental 7 mm with intense PET: Mayo pre-PET ~18.7%, Herder post-PET ~67%; edad 74, 7 mm | mayo | 0.1874751797 | 0.1874751797 | OK |
| incidental 7 mm with intense PET: Mayo pre-PET ~18.7%, Herder post-PET ~67%; edad 74, 7 mm | herder | 0.6734808337 | 0.6734808337 | OK |
| Herder computes published formula with P_pre as 0-1 fraction; edad 74, 7 mm | mayo | 0.1874751797 | 0.1874751797 | OK |
| Herder computes published formula with P_pre as 0-1 fraction; edad 74, 7 mm | herder | 0.6734808337 | 0.6734808337 | OK |
| a single Herder model is exposed (published logistic regression); edad 74, 7 mm | mayo | 0.1874751797 | 0.1874751797 | OK |
| a single Herder model is exposed (published logistic regression); edad 74, 7 mm | herder | 0.6387564578 | 0.6387564578 | OK |
| Herder uses Mayo pre-test in screening too (not Brock); edad 60, 15 mm | brock | 0.1390269227 | 0.1390269227 | OK |
| Herder uses Mayo pre-test in screening too (not Brock); edad 60, 15 mm | herder | 0.7056840311 | 0.7056840311 | OK |
| Herder reports missing Mayo fields in screening instead of using Brock; edad 60, 15 mm | brock | 0.1390269227 | 0.1390269227 | OK |
| Herder stays not_applicable for a known diameter below 4 mm; edad 60, 3 mm | brock | 0.0007036081 | 0.0007036081 | OK |
| Brock uses the maximum transverse diameter when provided; edad 65, 15 mm, máx. 20 | brock | 0.3799671157 | 0.3799671157 | OK |
| Brock falls back to the mean diameter with an underestimation note; edad 65, 15 mm | brock | 0.2537339998 | 0.2537339998 | OK |

Desarrollo manual de comprobaciones clave:

- Mayo 65 años, fumador, cáncer remoto, 16 mm, espiculado y superior: z = −6.8272+2.5415+0.7917+1.3388+2.0384+1.0407+0.7838 = **1.7077**; P=0.8465377256 → esperado 0.8465 correcto.
- Brock del primer test: mujer 70, familiar y enfisema positivos, 10 mm semi-sólido, superior, 3 nódulos, espiculado: T=−0.58113883; z=−6.7892+0.2296+0.6011+0.2961+0.2953+3.1296650551+0.377+0.6581+0.0824+0.7729=**−0.3470349449**; P=0.4141016234 → 0.4141 correcto.
- Brock mujer 65, 15 mm sólido, superior, un nódulo, sin familiar/enfisema: T=−0.7646422491; 2a da **0.2973782711**, 2b sin espiculación **0.2537339998**, y 2b espiculado **0.4241168834**. Los esperados y ambas desigualdades son correctos.
- Herder 60 años, fumador, sin cáncer, 10 mm no espiculado superior: z_Mayo=−1.6317, P_Mayo=0.1635976113; z_Herder=−4.739+3.691·P_Mayo+4.617=0.4818387834; P=0.6181819826 → ambos esperados correctos.
- Snapshot: Mayo z=2.2362 → **0.9034535101**, redondeado **0.9035**; Herder intenso **0.9666457505**, redondeado **0.9666**; pretest **0.9035**. Bandas altas correctas; Brock no aplicable por la política de contexto incidental de la app.
- Caso 74 años / 7 mm / PET intenso: Mayo **0.1874751797**, Herder **0.6734808337**. Los esperados 0.187 y 0.673 son correctos dentro de sus tolerancias. Es un caso del repo, no un caso publicado de Herder.
- Herder en cribado: pretest Mayo **0.2699847398**, postest moderado **0.7056840311**. Sustituir Mayo por Brock sería incorrecto para esta regresión.
- El esperado 0.38 del test de máximo 20 mm es correcto: **0.3799671157**; usar 15 mm daría 0.2537339998.

### Tests PLCOm2012

| Caso | Mi valor | App | Esperado del test |
|---|---:|---:|---|
| reference example returns probability ~1.75%; raza white, intensidad 80 | 0.017509223397 | 0.017509223397 | OK |
| race offsets: black increases risk vs white; raza white, intensidad 20 | 0.008916985018 | 0.008916985018 | OK |
| race offsets: black increases risk vs white; raza black, intensidad 20 | 0.013172517111 | 0.013172517111 | OK |
| american_indian_alaskan_native uses reference (same as white); raza white, intensidad 30 | 0.012043985789 | 0.012043985789 | OK |
| american_indian_alaskan_native uses reference (same as white); raza american_indian_alaskan_native, intensidad 30 | 0.012043985789 | 0.012043985789 | OK |
| probability is in [0, 1]; raza white, intensidad 40 | 0.459563874470 | 0.459563874470 | OK |

Con intensidad 0, la ecuación no está definida en su dominio; no se debe interpretar como probabilidad cero aunque el límite matemático sea cero. `computePlcom2012` devuelve NaN y el schema lo rechaza: test correcto. El JSON serializa NaN como `null`. Negra > blanca y nativa americana = blanca se verifican numéricamente; el perfil de alto riesgo da 0.4595638745, dentro de [0,1], aunque sus 75 años ya exceden el reclutamiento PLCO original.

### Tests de estados y datos faltantes

Todos sus esperados son correctos respecto a la política implementada: Brock sin edad → `insufficient_data` (Edad); Mayo sin espiculación → `insufficient_data`; Herder con PET pero sin tabaquismo/antecedentes requeridos de Mayo → `insufficient_data` aun en cribado; diámetro ausente → `insufficient_data`; Herder con 3 mm → `not_applicable`. Se expone un único Herder y se recomienda cuando está disponible. Esto no demuestra por sí solo que cada política equivalga al dominio validado por el artículo.

## Comparación amplia con módulos reales

**27.216 entradas predictivas**, producto cartesiano de:

- Contexto incidental/cribado; edades 0,35,50,55,65,74,75,90,120.
- Diámetro medio 1,3,4,7,8,30,31 mm; máximo ausente o medio+2 mm.
- Espiculación no evaluada/negativa/positiva; sólido/semi-sólido/vidrio deslustrado.
- 1,3,50 nódulos; los cuatro grados FDG. PET presente; ausencia de PET y datos faltantes se probaron aparte.

Resultados disponibles: **7.776 Mayo, 10.692 Brock, 10.368 Herder**; otros devuelven estados de no aplicabilidad o datos insuficientes. **0 discrepancias numéricas**; máximo error absoluto 2.220446049250313e−16. Los extremos deliberadamente incluyen extrapolaciones; equivalencia aritmética no implica validación clínica de esos extremos.

**21.600 perfiles PLCO**, cruzando edades 40/55/62/74/90, las seis razas, educación 1/4/6, IMC 15/27/50, las 16 combinaciones de EPOC/cáncer/familiar/actual-previo e intensidad 1/10/20/80/200. Duración 27; abandono 0 para actual y 10 para previo. **0 discrepancias**, diferencia máxima 3.3306690738754696e−16. Los coeficientes de duración y abandono se verificaron directamente en la fuente y los casos del test; este barrido mantiene esos dos términos fijos por grupo.

Datos completos: `sweep.json`. Ejemplos de bordes, mujer 65, superior, sin espículas/familiar/enfisema, un nódulo, PET moderado, contexto cribado:

| Medio / máximo mm | Brock propio | Brock app | Herder app | Observación |
|---|---:|---:|---:|---|
| 1 / ausente | 0.0000011093 | 0.0000011093 | not_applicable | OK aritmético |
| 1 / 3 | 0.0014803650 | 0.0014803650 | not_applicable | OK aritmético |
| 3 / ausente | 0.0014803650 | 0.0014803650 | not_applicable | OK aritmético |
| 3 / 5 | 0.0134167913 | 0.0134167913 | not_applicable | OK aritmético |
| 4 / ausente | 0.0055043338 | 0.0055043338 | 0.5611868528 | OK aritmético |
| 4 / 6 | 0.0257268516 | 0.0257268516 | 0.5611868528 | OK aritmético |
| 7 / ausente | 0.0423538469 | 0.0423538469 | 0.5970911584 | OK aritmético |
| 7 / 9 | 0.0864047505 | 0.0864047505 | 0.5970911584 | OK aritmético |
| 8 / ausente | 0.0628145064 | 0.0628145064 | 0.6112295198 | OK aritmético |
| 8 / 10 | 0.1123423788 | 0.1123423788 | 0.6112295198 | OK aritmético |
| 30 / ausente | 0.5520860826 | 0.5520860826 | 0.9343397615 | OK aritmético |
| 30 / 32 | Fuera del límite de la app | not_applicable | 0.9343397615 | Bloqueo por >30 mm |
| 31 / ausente | Fuera del límite de la app | not_applicable | not_applicable | Bloqueo por >30 mm |
| 31 / 33 | Fuera del límite de la app | not_applicable | not_applicable | Bloqueo por >30 mm |

El borde medio 30 / máximo 32 es relevante: Brock queda bloqueado y Herder puede calcularse, porque emplean medidas diferentes según sus fuentes. No es una discrepancia aritmética.

## Aplicabilidad y avisos

| Prueba adicional | Schema global acepta | Mayo | Brock | Herder |
|---|---|---|---|---|
| Mayo 3mm | Sí | available | not_applicable | not_applicable |
| Multiple incidental | Sí | available | not_applicable | available |
| Ground glass incidental | Sí | available | not_applicable | available |
| Missing FDG | Sí | available | not_applicable | insufficient_data |
| Missing diameter | No | insufficient_data | not_applicable | insufficient_data |
| No PET | Sí | available | not_applicable | not_applicable |
| Recent cancer | Sí | not_applicable | not_applicable | not_applicable |
| Known cancer screening | Sí | not_applicable | available | not_applicable |
| Follow-up screening | Sí | not_applicable | available | available |
| Missing multiple count | No | not_applicable | insufficient_data | available |
| Fractional count | Sí | not_applicable | available | available |
| Missing spiculation incidental | Sí | insufficient_data | not_applicable | insufficient_data |
| 31mm | Sí | not_applicable | not_applicable | not_applicable |

“Schema global” se refiere a `assessmentInputSchema`. Puede admitir datos predictivos opcionales sin que haya suficiente información para el score. Los casos sin diámetro o recuento múltiple se invocaron directamente en el módulo para comprobar que devuelve un estado razonable incluso antes de la validación del formulario.

- **Mayo:** exige edad, tabaquismo, historia extratorácica, diámetro, superior y espiculación. Solo se expone en incidental. Bloquea >30 mm, cáncer conocido o extratorácico reciente; **no bloquea ni avisa <4 mm**, ni múltiples o subtipos subsolidos. El filtrado por contexto es una decisión explícita de la app, no una propiedad matemática de la ecuación.
- **Brock:** solo cribado, máximo si consta, medio si falta; exige edad, sexo, familiar, enfisema, tipo, superior y recuento si múltiples. Asume uno si solitario. Espiculación ausente → 2a; negativa → 2b con término cero. La nota de sustitución por diámetro medio es correcta y pertinente. No se restringe al primer TC, ni avisa de edades/poblaciones fuera de la cohorte. El tope 30 mm es una política conservadora de la app; el artículo analiza nódulos de cualquier tamaño detectados en basal, y no presenta ese tope como una exclusión propia de Brock.
- **Herder:** PET y diámetro 4–30; FDG y datos Mayo completos. Usa Mayo incluso en cribado, correctamente desde el punto de vista de la fórmula; permitir “cualquier contexto” no equivale a validación independiente en cribado. PET ausente → no aplicable; PET con captación ausente registrada (`absent`) sí permite calcular. Menor de 8 mm añade precaución, y pretest <0.1 añade nota BTS. Sus notas de fórmula y unidades son verdaderas.
- **PLCO:** el registry valida schema; rechaza intensidad cero, raza no enumerada o fumador actual con abandono distinto de cero. Acepta 40/90 años sin aviso; acepta un paciente de 40 años con 70 fumando y 60 desde abandono, devolviendo 0.0026800065 y una decisión de elegibilidad. El modelo es para incidencia personal a seis años; no para malignidad del nódulo ya detectado.

## Discrepancias y severidad

La severidad siguiente corresponde al impacto de presentar una probabilidad como aplicable, no a un error aritmético.

1. **Major — Mayo por debajo de 4 mm sin aviso.** `computeMayo` solo comprueba el límite superior. Caso aceptado por schema: mujer 65, exfumadora, 3 mm no espiculado superior → **8.88304093%**, `available`, banda intermedia, sin nota de extrapolación. Fuente: Swensen, PDF 1–2 y tabla 1 (4–30 mm). La explicación web sí dice 4–30, pero la tarjeta ofrece el score fuera de ese intervalo. Coincide con LUN-19.
2. **Major — Falta distinguir dominios originales y extrapolación.** Brock ofrece resultados para edades 0/120 y para TC de seguimiento sin aviso; `patientSchema` solo exige edad ≥0. PanCan fue 50–75 y primer TC. Mayo/Herder se calculan para múltiples y para vidrio deslustrado sin advertir la extrapolación desde SPN; no existe campo para antecedente de cáncer pulmonar, excluido expresamente por Swensen y por PanCan. El bloqueo de cáncer conocido no cubre inequívocamente una neoplasia pulmonar antigua curada. No afirmo que todos esos usos deban bloquearse: sí requieren distinguir uso extrapolado de validación original. Relacionado con LUN-25.
3. **Major — PLCO 40–90 presentado como rango del modelo.** `plcom2012Schema.ts` contiene “Edad mínima 40 años para el modelo”; a 90 devuelve una decisión de elegibilidad sin señal de extrapolación. Tabla 1 del artículo: 55–74. Relacionado con LUN-21.
4. **Major — Historias tabáquicas imposibles admitidas por PLCO.** Ejemplo 40 años, 70 fumando, abandono hace 60, aceptado por schema y registry. Es un problema de validación de entradas, no de la fórmula. Relacionado con LUN-22.
5. **Normal — Recuento Brock admite fracciones.** Con 1.5 nódulos, schema acepta y Brock devuelve **0.0604323544**. El predictor publicado es número de nódulos, entero; el schema usa min/max pero no `.int()`. Relacionado con LUN-25.
6. **Minor — Nota BTS inexacta en frontera y predictor.** La nota Herder dice PET cuando el riesgo “pre-test es ≥10%”. La recomendación BTS 2015 especifica **>10% calculado con Brock** y tamaño por encima del umbral de detección local. La app decide mostrar esa nota a partir del **pretest Mayo <10%** y omite esas condiciones. No altera el cálculo ni debe convertirse automáticamente en bloqueo de Herder. [BTS 2015, recomendaciones PET](https://doi.org/10.1136/thoraxjnl-2015-207168).
7. **Normal — Bandas ACCP correctas, alcance insuficientemente explicitado.** La atribución 5/65 a ACCP 2013 es verdadera. Sus recomendaciones se refieren a nódulos sólidos indeterminados >8 mm y probabilidad clínica pretest. La app asigna la misma banda también a Brock subsolidos, nódulos pequeños y Herder postest sin aclarar ese alcance. No son los umbrales BTS (10/70). La palabra “orientativas” evita formular una orden directa, pero conviene añadir el dominio y separar bandas descriptivas de decisiones de manejo. Relacionado con LUN-20.
8. **Minor — Descripción de la curva Brock demasiado general.** `method` dice que el riesgo crece rápido en pequeños y se aplana en grandes. Lo directamente garantizado por la transformación es ese comportamiento del **logit**, mientras que la probabilidad aplica además una sigmoide y su pendiente absoluta depende del resto del perfil. La fórmula está bien; sería más preciso explicar la transformación sin prometer esa forma global de la probabilidad.

No identifico discrepancias aritméticas Critical/Show-stopper. La pequeña inconsistencia interna de tabla 3 de Swensen se registra como limitación de la referencia publicada, no como defecto del código. No se han corregido estas issues: el encargo autoriza únicamente análisis e informe.

## Revisión de `config/i18n.ts`

- `explanations.mayo`: propósito, factores, diámetro medio y regresión correctos según Swensen; requiere reflejar en el resultado el límite que ya anuncia (4–30).
- `explanations.brock`: primer TC, cohortes, variables, diámetro máximo y uso de 2a correctos. El fallback al medio es una aproximación transparente, con posible infraestimación. “En la app… hasta 30” identifica correctamente una política de producto. Matiz sobre forma de la curva: hallazgo 8.
- `explanations.herder`: fórmula, coeficientes y unidades correctos. “En cualquier contexto” describe la implementación, pero no debe leerse como validación publicada de cualquier contexto; 4 mm se hereda de Mayo. Advertencia por PET pequeño razonable y coherente con la guía, sin que 8 mm sea un corte del ajuste original.
- `riskBands`: **sí son umbrales de ACCP 2013**: §4.2.4.1 PET para pretest 5–65%; §4.2.4.2 alto >65%; §4.5.1.1 vigilancia con probabilidad muy baja <5%; §4.6.3.1.1 diagnóstico quirúrgico con alta >65%. Son para sólidos >8 mm. Exactamente 5% y 65% quedan como intermedios en el código, consistente con esas desigualdades. Estas etiquetas no son por sí mismas una recomendación automática para cualquier score. [ACCP 2013](https://pmc.ncbi.nlm.nih.gov/articles/3749714/).

## Limitaciones y estado final

- Verificación de ecuaciones y comportamiento de módulos, sin auditoría del formulario mediante navegador ni validación clínica prospectiva. Los tests y los esquemas se examinaron; no se presupone que todo input directo del módulo sea alcanzable en la interfaz.
- No se consultaron bases individuales originales ni se reprodujeron AUC/calibración poblacional. La concordancia numérica confirma implementación, no transportabilidad clínica.
- Referencias gráficas de Herder y PLCO solo permiten comparación visual aproximada. Para Brock no hay caso individual exacto publicado identificado en el PDF local. Todos los decimales adicionales proceden del recálculo, no de lectura de gráficos.
- La prueba publicada de Mayo muestra pequeñas inconsistencias tabla/ecuación; no se han ajustado coeficientes para forzar concordancia con la tabla.
- El barrido no es exhaustivo de todo número real posible; se preservan rangos y combinaciones exactos en los scripts.
- No se leyó el material de investigación Markdown del repo para derivar las fórmulas. Se consultaron además fuentes primarias externas para ACCP y BTS. La revisión de 1.51% se limita a constatar que requiere otra referencia; no se auditó exhaustivamente la literatura posterior.
- Sin cambios de archivos del repo, sin tests temporales en él y sin commit. Estado git inicial/final: únicamente el archivo ajeno ya existente sin seguimiento `w5_capture.mjs`. Versión auditada 1.7.1, commit `761e5d26`.
- YouTrack se consultó al inicio; había 18 issues abiertas. Se creó y completó LUN-38 para esta auditoría, con comentario de entrega que identifica v1.7.1 y commit 761e5d26 (sin commit nuevo). Antes de terminar se volvieron a consultar las issues abiertas: permanecen las 18 tareas previas; sus correcciones están fuera del alcance de este informe.

### Artefactos reproducibles

Desde cualquier carpeta, ejecutar con Node disponible:

```sh
node /tmp/claude-1000/-home-erosales-proyectos-lungnodules/89301ef4-b30b-46f2-a207-08ceb9b39723/scratchpad/codex-recalc/audit.cjs
node /tmp/claude-1000/-home-erosales-proyectos-lungnodules/89301ef4-b30b-46f2-a207-08ceb9b39723/scratchpad/codex-recalc/published.cjs
```

`independent.cjs`: implementación desde fuentes. `audit.cjs`: carga módulos reales, verifica tests y barridos. `test-cases.json`: entradas y resultados de cada llamada de tests. `sweep.json`: resumen y bordes. `plco-domain.json`: aceptación/rechazo por schema y elegibilidad. `published.cjs`/`published.json`: transcripción de tabla 3 y puntos gráficos. Imágenes `brock16.png`, `herder5.png`, `swensen6.png`, `plco5.png`: evidencia visual. `write_report.py`: ensamblado de este informe.

### Localización de la evidencia en el código auditado

- Mayo y exclusiones: [lib/predictive/index.ts:142](/home/erosales/proyectos/lungnodules/lib/predictive/index.ts:142).
- Brock, selección del diámetro y variante: [lib/predictive/index.ts:241](/home/erosales/proyectos/lungnodules/lib/predictive/index.ts:241).
- Herder, estados: [lib/predictive/index.ts:351](/home/erosales/proyectos/lungnodules/lib/predictive/index.ts:351); fórmula y notas: [línea 418](/home/erosales/proyectos/lungnodules/lib/predictive/index.ts:418).
- Bandas: [lib/predictive/index.ts:27](/home/erosales/proyectos/lungnodules/lib/predictive/index.ts:27).
- Edad y recuento: [lib/schemas/noduleInput.ts:44](/home/erosales/proyectos/lungnodules/lib/schemas/noduleInput.ts:44), [línea 65](/home/erosales/proyectos/lungnodules/lib/schemas/noduleInput.ts:65).
- PLCO, rango y validación: [lib/eligibility/plcom2012Schema.ts:29](/home/erosales/proyectos/lungnodules/lib/eligibility/plcom2012Schema.ts:29); fórmula: [plcom2012.ts:70](/home/erosales/proyectos/lungnodules/lib/eligibility/plcom2012.ts:70).
- Textos: [config/i18n.ts:34](/home/erosales/proyectos/lungnodules/config/i18n.ts:34), [bandas, línea 54](/home/erosales/proyectos/lungnodules/config/i18n.ts:54).
