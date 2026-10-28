// =============================================================================
// GUIDELINE VERSIONS & METADATA
// =============================================================================

export const GUIDELINE_VERSIONS = {
  fleischner: {
    id: 'fleischner-2017',
    label: 'Fleischner Society 2017',
    version: '2017',
    citation: 'MacMahon H, et al. Radiology 2017;284(1):228-243',
    doi: '10.1148/radiol.2017161659',
  },
  lungRads: {
    id: 'lung-rads-2022',
    label: 'Lung-RADS v2022',
    version: '2022',
    citation: 'American College of Radiology. Lung-RADS v2022',
    url: 'https://www.acr.org/Clinical-Resources/Reporting-and-Data-Systems/Lung-Rads',
  },
} as const;

export const APP_VERSION = '1.9.0';

// =============================================================================
// RISK FACTORS
// =============================================================================

// Fleischner 2017 (MacMahon, Radiology 284:228) define el riesgo de forma
// cualitativa según las categorías ACCP; los umbrales de tabaquismo proceden de
// los criterios de cribado NLST/USPSTF y la propia guía los considera
// indicativos de alto riesgo en nódulos sólidos. El corte de edad >65 años es
// una heurística local de esta herramienta (la guía usa "edad avanzada"
// cualitativamente; NLST cribó a 55-74 años y no establece un corte de 65).
export const RISK_FACTOR_TOOLTIP = `FACTORES DE ALTO RIESGO — ORIENTATIVOS (cualquiera):
• Edad avanzada (>65 años — heurística de esta herramienta; Fleischner usa "edad avanzada" sin corte fijo)
• Tabaquismo intenso (≥30 paquetes-año, umbral NLST/USPSTF)
• Fumador actual o dejó hace <15 años (umbral NLST/USPSTF)
• Antecedentes familiares de cáncer de pulmón
• Enfisema o fibrosis pulmonar en imagen
• Exposición a carcinógenos conocidos (asbesto, radón, uranio)

Fleischner 2017 define el riesgo cualitativamente (categorías ACCP) y remite a
juicio clínico o modelos predictivos. La regla «cualquier factor marcado →
riesgo alto» es una heurística de la app, no una definición de la guía.
RIESGO BAJO: menor edad, tabaquismo mínimo o nulo, sin los factores anteriores`;

export const RISK_FACTORS = {
  high: [
    { id: 'age65', label: 'Edad >65 años (heurística local)' },
    { id: 'smoking30', label: 'Tabaquismo intenso (≥30 paquetes-año)' },
    { id: 'currentSmoker', label: 'Fumador actual o dejó hace <15 años' },
    { id: 'familyHistory', label: 'Antecedentes familiares de cáncer de pulmón' },
    { id: 'emphysema', label: 'Enfisema o fibrosis pulmonar en imagen' },
    { id: 'carcinogenExposure', label: 'Exposición a carcinógenos conocidos (asbesto, radón, uranio)' },
  ],
} as const;

// =============================================================================
// DISCLAIMERS & LEGAL
// =============================================================================

export const DISCLAIMERS = {
  general: `Esta herramienta proporciona apoyo a la decisión basado en guías clínicas publicadas.
No reemplaza el juicio clínico ni la relación médico-paciente.
Siempre considere el cuadro clínico completo al tomar decisiones de manejo.`,

  fleischner: `Las guías de la Sociedad Fleischner aplican a nódulos pulmonares incidentales en pacientes ≥35 años
sin malignidad conocida o inmunocompromiso. No están destinadas a poblaciones de cribado de cáncer de pulmón.`,

  lungRads: `Lung-RADS está diseñado para programas de cribado de cáncer de pulmón en poblaciones de alto riesgo.
No debe aplicarse a nódulos detectados incidentalmente o poblaciones sin cribado.`,

  export: `RESULTADO DE APOYO A LA DECISIÓN CLÍNICA
Generado por Herramienta de Soporte para Nódulos Pulmonares v${APP_VERSION}
Guías: Sociedad Fleischner 2017 / Lung-RADS v2022

AVISO LEGAL: Este resultado es solo para fines informativos y no constituye consejo médico.
Las decisiones clínicas deben ser tomadas por profesionales de la salud calificados considerando todos los factores relevantes del paciente.`,
} as const;
