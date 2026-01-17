# Roadmap: Modelos predictivos (Mayo / Brock / Herder)

## Objetivo
Definir el alcance y los requisitos para integrar modelos predictivos de malignidad en la app sin comprometer la interpretabilidad clínica. Este documento **no** implementa los modelos; establece inputs, exclusiones, UI y pasos de integración.

## Selección de modelo por contexto
- **Incidental (Fleischner)** → **Mayo Clinic** (población general, nódulo solitario incidental).
- **Screening (Lung‑RADS)** → **Brock (Pan‑Can)** (cohortes de cribado alto riesgo).
- **PET disponible + nódulo ≥8 mm + riesgo pre‑test >10%** → **Herder** (ajuste post‑PET).

## Entradas mínimas por modelo
### Mayo Clinic
- Edad (años).
- Tabaquismo (sí/no, fumador actual o ex‑fumador).
- Cáncer extratorácico >5 años (sí/no).
- Diámetro (mm) del nódulo.
- Localización en lóbulo superior (sí/no).
- Espiculación (sí/no).

### Brock (Pan‑Can)
- Edad (años).
- Sexo (femenino sí/no).
- Historia familiar de cáncer de pulmón (sí/no).
- Enfisema en TC (sí/no).
- Diámetro (mm).
- Tipo de nódulo (sólido / parte‑sólido / no sólido).
- Lóbulo superior (sí/no).
- Número de nódulos (entero).
- Espiculación (sí/no).

### Herder (post‑PET)
- Riesgo pre‑test (Mayo o Brock).
- Captación FDG (Ausente / Leve / Moderada / Intensa).
- Requisitos: PET‑CT disponible, nódulo ≥8 mm.

## Exclusiones / advertencias clínicas
- **Mayo**: no aplicar si cáncer de pulmón activo o cáncer extratorácico <5 años.
- **Brock**: diseñado para cohortes de screening; evitar en incidental de bajo riesgo.
- **Herder**: sólo si PET disponible y tamaño ≥8 mm.
- No aplicar a masas >30 mm (fuera de alcance de modelos).

## Brechas actuales en el formulario
Actualmente **no existen** campos para:
- Tabaquismo, sexo, historia familiar, enfisema, lóbulo superior, número de nódulos.
- PET‑CT y nivel de captación FDG.

## Propuesta de UI
1. **Panel opcional “Modelos predictivos”** en resultados (desplegable).
2. Selector de modelo recomendado según contexto (incidental/screening).
3. Inputs faltantes con tooltips clínicos y validación estricta.
4. Mensaje de “no aplicable” cuando se cumplen exclusiones.

## Propuesta técnica
- Crear módulo en `lib/predictive/`:
  - `mayo.ts`, `brock.ts`, `herder.ts`.
  - Tipos: `PredictiveInput`, `PredictiveResult`, `ModelId`.
- Añadir validaciones Zod específicas por modelo.
- Añadir tests unitarios con casos conocidos (valores esperados).
- Export en `lib/algorithms/index.ts` o módulo propio.

## Salida clínica sugerida
- Riesgo % con 1 decimal.
- Categoría de riesgo (propuesta):
  - **Bajo** <5%
  - **Intermedio** 5–65%
  - **Alto** >65%
- Recomendación textual vinculada a guías (BTS/Fleischner) y disclaimer.

## Referencias a verificar antes de implementación
- Coeficientes y fórmulas originales (Mayo, Brock, Herder).
- Validación de umbrales de riesgo por guía local.
- Criterios exactos de PET (Herder) y ajustes por captación.

## Próximos pasos
1. Confirmar coeficientes oficiales (publicaciones originales).
2. Definir layout/UX del panel predictivo.
3. Implementar módulos + tests.
4. Integrar en resultados y exportes con versionado.
