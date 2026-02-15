# PLCOm2012 – Tareas de implementación e integración

Documento de tareas y checklist para la implementación del score PLCOm2012 y del módulo de elegibilidad (opción 1). Referencia: plan en `.cursor/plans/` y [research/plcom2012_research.md](plcom2012_research.md).

---

## 3.1 Tareas de implementación del score PLCOm2012

### 1. Módulo de cálculo
- [x] Crear `lib/eligibility/` (o `lib/screening-eligibility/`).
- [x] Definir tipos: `EligibilityInput` (genérico y/o `Plcom2012Input`), `EligibilityResult` (probability, eligible, thresholdUsed).
- [x] Implementar `computePlcom2012(input): number` (función pura) con coeficientes y centrados del [research/plcom2012.R](plcom2012.R) / PDF.
- [x] Mapeo de raza/etnia: mismo criterio que el R (White, Black, Hispanic, Asian, Native Hawaiian/Pacific Islander, American Indian/Alaskan Native = referencia); valor por defecto si no reconocido = referencia.
- [x] Validación: `smoking_intensity > 0`; rangos razonables para edad, IMC, duración, años desde abandono.
- [x] Test unitario: ejemplo del R (62, White, 4, 27, 0, 0, 0, 0, 80, 27, 10) → probabilidad ≈ 1.75% (tolerancia p. ej. ±0.01%).
- [x] Documentar en código referencia a NEJM 2013 y [research/plcom2012_research.md](plcom2012_research.md).

### 2. Schema y formulario
- [x] Schema Zod para inputs PLCOm2012: edad, raza/etnia, educación (1–6), IMC, COPD, historia personal cáncer, historia familiar cáncer de pulmón, smoking_status (current/former), smoking_intensity, duration_smoking, smoking_quit_time (y reglas: exfumador → quit_time ≥ 0; fumador actual → quit_time = 0).
- [x] Umbral por defecto 1.51% (configurable vía constante o config).

### 3. Registro extensible (varios scores)
- [x] Definir interfaz `EligibilityModel`: id, label, inputSchema, compute, defaultThreshold.
- [x] Registrar PLCOm2012 como primer modelo en un array o mapa exportado (ej. `eligibilityModels`).
- [x] Helper que, dado `modelId` e `input`, devuelva `EligibilityResult` (probability, eligible, thresholdUsed).

### 4. UI: flujo de elegibilidad
- [x] Ruta nueva: `/eligibility` (o `/elegibilidad`).
- [x] Página: selector de modelo (por ahora solo PLCOm2012; preparado para más).
- [x] Formulario según modelo seleccionado (campos PLCOm2012 con labels/tooltips en español).
- [x] Cálculo al enviar; mostrar: riesgo a 6 años (%), umbral usado, "Elegible / No elegible", disclaimer ("Para elegibilidad de cribado; no sustituye Fleischner/Lung-RADS para el manejo del nódulo").
- [x] Accesibilidad y validación en cliente (Zod + mensajes claros).

### 5. Entrada dual en Home
- [x] En [app/page.tsx](../app/page.tsx): dos CTAs (o bloques): "Elegibilidad para cribado" → `/eligibility`, "Evaluar nódulo" → `/assessment`.
- [x] Texto breve que diferencie ambos flujos (elegibilidad vs. manejo del nódulo).

### 6. Integración y calidad
- [x] Export desde `lib/eligibility` (o equivalente) de `computePlcom2012`, tipos y registro de modelos.
- [x] No mezclar elegibilidad con lógica de Fleischner/Lung-RADS en [lib/algorithms](../lib/algorithms); mantener módulo de elegibilidad separado.
- [x] Revisar [MEDICAL_DISCLAIMER.md](../MEDICAL_DISCLAIMER.md) y, si aplica, mencionar uso de PLCOm2012 para apoyo a la decisión clínica.
- [x] Opcional: enlace desde resultado de elegibilidad a "Evaluar nódulo" si el usuario quiere continuar con un nódulo (Lung-RADS).

---

## 3.2 Checklist de verificación pre-release

- [x] Coeficientes y fórmula PLCOm2012 idénticos a [research/plcom2012.R](plcom2012.R) y PDF Tabla 2.
- [x] Test del ejemplo R pasa (≈1.75%).
- [x] `smoking_intensity = 0` rechazado o manejado sin división por cero.
- [x] Raza no reconocida no rompe (default referencia).
- [x] Umbral por defecto 1.51% y mensaje de elegibilidad correcto.
- [x] Entrada dual en Home y flujo `/eligibility` sin romper `/assessment`.
- [x] Diseño listo para añadir otro score (registro + selector + formulario por modelo).
