# Recálculo independiente de los modelos predictivos — 2026-10-27

Auditoría sobre la v1.7.1 (`761e5d26`). Dos agentes, cada uno por su cuenta y desde los PDFs de `research/pdf/`, reimplementaron Mayo (Swensen 1997), Brock 2a/2b (McWilliams 2013), Herder (2005) y PLCOm2012 (Tammemägi 2013), y compararon sus resultados con los módulos reales. Issues: LUN-38 (auditoría) y LUN-15 (padre).

**Resultado:** 0 discrepancias numéricas. Los hallazgos son de aplicabilidad y de validación de entradas (LUN-19, 20, 21, 22, 23, 25).

| Archivo | Contenido |
|---|---|
| `encargo.md` | Instrucciones que recibieron los dos agentes |
| `informe-codex.md` | Informe de codex-nodules: 27.216 casos predictivos y 21.600 de PLCO |
| `informe-devin.md` | Informe de devin-nodules: unos 1,1 millones de casos predictivos y 129.600 de PLCO |
| `codex/independent.cjs` | Implementación de Codex, escrita desde las fuentes |
| `codex/audit.cjs` | Carga los módulos reales, recalcula los tests y hace el barrido; escribe `test-cases.json`, `sweep.json` y `plco-domain.json` |
| `codex/published.cjs`, `published.json` | Tabla 3 de Swensen (144 celdas), curva de la figura 1 de PLCO y puntos del nomograma de Herder |
| `codex/*.png` | Páginas de los PDFs usadas como evidencia visual (transformación de Brock, nomograma de Herder, tabla 3 de Swensen, figura 1 de PLCO) |
| `devin/models.py` | Implementación de Devin, escrita desde las fuentes, con la transcripción propia de la tabla 3 de Swensen |
| `devin/compare.py` | Compara con el volcado de la app |
| `devin/extract*.mjs` | Extracción de texto y de la tabla de los PDFs (pdfjs-dist) |

## Reproducir

```sh
node research/verification/2026-10-27/codex/audit.cjs       # desde la raíz del repo
node research/verification/2026-10-27/codex/published.cjs
python3 research/verification/2026-10-27/devin/models.py    # tabla 3 de Swensen y PLCO de referencia
```

El volcado de Devin (`app-results*.json`, unos 530 MB) no se guarda en el repo. Lo generaba un test temporal de Jest que ya se borró; `compare.py` espera esos archivos en `DEVIN_RECALC_OUT`.

Los resultados de los barridos corresponden a la v1.7.1. Desde la v1.8.0, Herder usa las bandas de BTS 2015, por lo que las bandas guardadas aquí para Herder (ACCP) ya no son las de la app; los valores numéricos no cambian.

Las regresiones permanentes están en `__tests__/predictive/referenceCases.test.ts`, que usa `__tests__/predictive/fixtures/swensen-table3.json`. Las dos transcripciones de la tabla, la de Codex y la de Devin, coinciden en las 144 celdas.
