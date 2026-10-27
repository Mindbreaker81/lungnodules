# Encargo: recálculo independiente de los scores predictivos

Repo: `/home/erosales/proyectos/lungnodules`, rama `fix/lun-major-findings` (HEAD `761e5d26`, v1.7.1).

Objetivo: comprobar **de forma independiente y sin asumir nada** que la app calcula bien Mayo, Brock (2a y 2b), Herder (2005) y PLCOm2012. No te fíes del código, de los tests, de los comentarios ni de la documentación de `research/*.md`: pueden estar mal.

## Reglas
- **No modifiques ningún archivo del repo** ni hagas commit. Los scripts temporales van en tu propia carpeta dentro de `/tmp/claude-1000/-home-erosales-proyectos-lungnodules/89301ef4-b30b-46f2-a207-08ceb9b39723/scratchpad/` (si necesitas un test de Jest dentro del repo para cargar los módulos reales, créalo y bórralo al acabar, y dilo en el informe).
- Trabaja solo; no hables con otros agentes.

## Pasos
1. **Fórmulas desde las fuentes primarias.** Saca coeficientes, transformaciones, centrados, codificación de variables y unidades (fracción vs %) de los PDFs de `research/pdf/` (Swensen 1997, McWilliams 2013 tabla 2 y nota de la transformación del tamaño, Herder 2005, Tammemägi 2013 «Selection Criteria…»). Si no puedes leer un PDF, dilo y explica qué fuente usaste en su lugar. Anota página/tabla de cada valor.
2. **Tu propia implementación** (Python o JS) escrita desde esas fórmulas, **antes** de mirar `lib/predictive/` o `lib/eligibility/`.
3. **Casos de referencia publicados**: reproduce cualquier ejemplo numérico que den los artículos o las calculadoras de referencia que conozcas (y di de dónde sale).
4. **Casos de la app**: recalcula a mano los valores esperados de `__tests__/predictive/predictive.test.ts`, del snapshot y de los tests de PLCOm2012, y di si cada esperado es correcto.
5. **Comparación con la app**: carga los módulos reales (p. ej. un test de Jest temporal con `getPredictiveSummaries` y la función de PLCOm2012) y compara con tu implementación en un barrido amplio que incluya bordes: 4/8/30/31 mm, edad extrema, espiculación sin evaluar (2a), diámetro máximo presente/ausente, semi-sólido y vidrio deslustrado, varios nódulos, todos los grados de FDG, contexto incidental y cribado.
6. **Lógica de aplicabilidad**: revisa cuándo cada modelo sale como disponible, no aplicable o con datos insuficientes, y si los avisos/notas son ciertos según la fuente.
7. **Textos de la web**: revisa que las explicaciones de `config/i18n.ts` (`results.predictiveModels.explanations` y `riskBands`) sean correctas según las fuentes. En particular, comprueba si las bandas <5 % / 5–65 % / >65 % son realmente de ACCP 2013.

## Informe
Escríbelo en Markdown en el archivo que se te indique, con: fuentes y valores verificados (con página), casos publicados reproducidos, tabla de casos (entrada → tu valor → app → OK/discrepancia), discrepancias con severidad y evidencia, y limitaciones. Responde solo con la ruta del informe al terminar.
