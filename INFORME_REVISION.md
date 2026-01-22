# Informe de Revisión Clínica y Técnica: Lung Nodule Decision Support

**Fecha:** 22/01/2026
**Revisor:** Antigravity (AI Assistant)
**Versión del Proyecto:** 1.0.0

---

## 1. Resumen Ejecutivo

### Estado General
La aplicación es una herramienta robusta construida sobre un stack moderno (Next.js 14, TypeScript, Tailwind). La arquitectura es limpia, separando claramente la lógica clínica (`lib/algorithms`) de la interfaz de usuario (`components/wizard`). Desde el punto de vista clínico, implementa correctamente las guías **Fleischner 2017** (incidental) y **Lung-RADS 2022** (screening), además de modelos predictivos reconocidos (Mayo, Brock, Herder).

### Riesgos Críticos
1.  **Inconsistencia de Idioma (Severidad: Alta):** La aplicación sufre de un problema grave de "Spanglish". Mientras que la Landing Page y los formularios del Wizard están en Español, **todas las recomendaciones clínicas, racionales y disclaimers están hardcodeados en Inglés** en los archivos de configuración y lógica. Esto genera una experiencia de usuario fragmentada y potencialmente confusa.
2.  **Validación de Edad (Severidad: Media):** Existen inconsistencias en la validación de edad entre los schemas de Zod (min: 0) y la configuración visual (min: 18 o 35).

### Recomendaciones Top 5
1.  **Centralizar y Traducir Textos:** Extraer todos los strings de `lib/algorithms` y `config/guidelines.ts` a un sistema de diccionarios (i18n) o traducirlos directamente al español si ese es el idioma objetivo único.
2.  **Unificar Validación:** Sincronizar las reglas de validación en `noduleInput.ts` con las constantes de `config/guidelines.ts`.
3.  **Clarificar Modelo Herder:** Añadir una nota clínica explícita sobre el uso de Herder (post-test) sobre el modelo de Brock (que ya incluye variables de malignidad), o restringir Herder solo para uso tras Mayo.
4.  **Feedback en UI:** Mejorar el feedback visual cuando una guía no aplica (ej. edad < 35 en Fleischner) antes de llegar al paso final.
5.  **Offline Banner:** Verificar la funcionalidad del Service Worker para garantizar que la app funcione 100% offline (crucial en entornos hospitalarios con mala conectividad).

---

## 2. Alcance y Metodología

**Revisado:**
*   **Arquitectura:** Estructura de carpetas, manejo de estado y flujo de datos.
*   **Lógica Clínica:** Archivos en `lib/algorithms` (Fleischner, Lung-RADS) y `lib/predictive`.
*   **Seguridad:** Manejo de datos del paciente y dependencias.
*   **UX/UI:** Flujos de usuario en el Wizard y Landing Page.

**Limitaciones:**
*   Revisión estática de código (no se ha ejecutado la app en un navegador real).
*   No se han ejecutado los tests unitarios (`npm test` no invocado, solo inspección).

---

## 3. Hallazgos Técnicos

| Severidad | Hallazgo | Evidencia (Archivo) | Impacto | Recomendación |
| :--- | :--- | :--- | :--- | :--- |
| **Alta** | **Mezcla de Idiomas (Spanglish)** | `config/guidelines.ts`, `lib/algorithms/*.ts` | El usuario ve la UI en ES pero recibe resultados en EN. Confuso y poco profesional. | Traducir `guidelines.ts` y lógica de retorno a ES o implementar i18n. |
| **Media** | **Inconsistencia en rangos de validación** | `schema/noduleInput.ts` vs `config/guidelines.ts` | Zod permite `age: 0`, config dice `min: 18`. | Alinear Zod con `VALIDATION.age` de config. |
| **Baja** | **Hardcoded Strings en UI** | `components/wizard/*.tsx` | Dificulta la mantenibilidad y futura traducción. | Mover textos de UI a constantes o archivos de recursos. |
| **Baja** | **Lógica de "Warnings" duplicada** | `resultsStep.tsx` | La lógica de warnings se procesa tanto en algoritmo como en UI. | Centralizar toda la lógica de presentación en un helper. |

---

## 4. Hallazgos Clínicos

### Modelo Detectado
*   **Incidental:** Fleischner Society 2017 Guidelines.
*   **Screening:** Lung-RADS v2022 Assessment Categories.
*   **Probabilidad:** Mayo Clinic Model, Brock (Pan-Can) Model, Herder Model.

### Matriz App vs Fuentes

| Requisito/Regla | Implementación App | Concordancia | Observaciones |
| :--- | :--- | :--- | :--- |
| **Fleischner: Edad < 35** | `fleischner.ts`: `checkFleischnerApplicability` retorna error si < 35. | **Sí** | Correctamente excluido. |
| **Fleischner: Solid < 6mm (Low Risk)** | `fleischner.ts`: "No routine follow-up". | **Sí** | Coincide con Tabla 1 de Fleischner 2017. |
| **Fleischner: GGNs** | `fleischner.ts`: Distingue <6mm y >=6mm. | **Sí** | Coincide con guías de subsólidos. |
| **Lung-RADS: Crecimiento** | `lungRads.ts`: Umbral > 1.5mm en 12 meses. | **Sí** | Correcta implementación de definición de crecimiento. |
| **Predicción: Contexto** | `predictive/index.ts`: Usa Brock para Screening, Mayo para Incidental. | **Sí** | Correcta selección de modelo según población. |
| **Herder: Pre-test** | `predictive/index.ts`: Permite usar Brock como pre-test para Herder. | **Parcial** | Herder original se validó sobre Mayo. Usarlo sobre Brock es teóricamente posible pero requiere validación clínica. |

### Riesgos de Mala Aplicación
*   **Herder sobre Brock:** Aunque matemáticamente válido (odds post-test), la validación original de Herder usaba el modelo de Mayo como pre-test. Usarlo sobre Brock (que ya es muy completo) podría sobreestimar o subestimar riesgos. Se recomienda añadir una nota de "Evidencia limitada" para esta combinación específica.

---

## 5. Revisión de Traducciones y Terminología

La aplicación tiene un déficit crítico de traducción en la capa de datos.

### Strings Problemáticos (Ejemplos)
*   **UI:** "Comenzar Valoración" (ES)
*   **Resultado:** "CT at 3-6 months; if stable consider CT at 2 and 4 years" (EN)
*   **Racional:** "Solid component ≥6mm is highly suspicious" (EN)
*   **Unidades:** "Ground-glass" vs "Vidrio esmerilado" (Inconsistencia entre código y UI).

### Glosario Recomendado (ES)
*   *Ground-glass* -> **Vidrio deslustrado** (o esmerilado, pero ser consistente).
*   *Part-solid* -> **Subsólido** (o parte sólido).
*   *Spiculation* -> **Espiculación / Márgenes espiculados**.
*   *Screening* -> **Cribado**.
*   *Incidental* -> **Hallazgo incidental**.
*   *Follow-up* -> **Seguimiento**.

---

## 6. Plan de Acción

### Quick Wins (1-2 horas)
1.  **Traducción de Config:** Traducir el archivo `config/guidelines.ts` completo al español.
2.  **Traducción de Algoritmos:** Traducir los strings de retorno (`recommendation`, `rationale`) en `fleischner.ts` y `lungRads.ts`.
3.  **Ajuste de Validación:** Actualizar `schema/noduleInput.ts` para requerir edad >= 18 (o 35 para Fleishner explícitamente en el primer paso).

### Corto Plazo (1-2 días)
1.  **Refactor de Textos:** Mover todos los textos hardcodeados de los componentes `wizard/*.tsx` a un archivo central de constantes (`config/i18n.ts` o similar).
2.  **Revisión de Textos Médicos:** Validar con un especialista si prefiere "Vidrio deslustrado" (España) o "Vidrio esmerilado" (LatAm).

### Medio Plazo
1.  **Tests Clínicos:** Crear una batería de tests en `__tests__` que simulen casos clínicos reales (ej. "Mujer 45 años, fumadora, nódulo sólido 7mm") y verifiquen que la recomendación de salida sea la esperada en español.

---

## Anexo: Mapa de Flujo de Datos

**1. Inputs (UI/Wizard)**
*   `ContextStep`: Contexto clínico (Incidental vs Screening), Edad, Factores de Riesgo.
*   `NoduleStep`: Morfología, Tamaño (mm), Características (Espiculación, Localización).
*   `RiskStep` (Implícito/Calculado): Variables adicionales para modelos predictivos.

**2. Validación & Normalización**
*   `schema/noduleInput.ts` (Zod): Coerción de tipos, validación de rangos (1-100mm).

**3. Motor de Cálculo (`lib/algorithms`)**
*   Selector de Guía:
    *   Incidental -> `fleischner.ts` -> `assessFleischner`
    *   Screening -> `lungRads.ts` -> `assessLungRads`
*   Modelos Predictivos (`lib/predictive`):
    *   `getRecommendedPredictiveModel`: Selecciona Mayo o Brock.
    *   Cálculo de probabilidad (Logistic Regression).

**4. Presentación (`ResultsStep`)**
*   Formateo de textos (AQUÍ ES DONDE FALLA LA TRADUCCIÓN).
*   Visualización de Badges de Riesgo.
*   Exportación (Clipboard/JSON/TXT).

**5. Persistencia**
*   No hay persistencia en servidor (Privacidad OK).
*   `analytics`: Eventos locales de uso (copiar/exportar).
