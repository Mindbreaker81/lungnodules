import {
  ApplicabilityResult,
  AssessmentResult,
  FleischnerAssessmentInput,
  GuidelineId,
  NoduleCharacteristics,
  PatientProfile,
  RiskLevel,
} from './types';

const GUIDELINE: GuidelineId = 'fleischner-2017';

const roundToNearestMm = (value: number) => Math.round(value);

export function checkFleischnerApplicability(patient: PatientProfile): ApplicabilityResult {
  if (patient.age < 35) {
    return { applicable: false, reason: 'Las guías Fleischner aplican a pacientes ≥35 años' };
  }
  if (patient.hasKnownMalignancy) {
    return { applicable: false, reason: 'Malignidad conocida — usar guías específicas de la enfermedad' };
  }
  if (patient.isImmunocompromised) {
    return { applicable: false, reason: 'Inmunocomprometido — guía no aplicable' };
  }
  return { applicable: true };
}

function assessSubsolidMultiple(options: {
  type: 'ground-glass' | 'part-solid';
  diameter: number;
  solidComponent?: number;
  riskLevel: RiskLevel;
}): AssessmentResult {
  const { type, diameter, riskLevel } = options;
  // Treat NaN as undefined (unknown solid component)
  const solidComponent = options.solidComponent !== undefined && Number.isNaN(options.solidComponent)
    ? undefined
    : options.solidComponent;

  if (diameter < 6) {
    return {
      guideline: GUIDELINE,
      category: `${type === 'ground-glass' ? 'Vidrio deslustrado' : 'Semi-sólido'} <6mm (múltiples)`,
      recommendation: 'TC a los 3-6 meses para confirmar persistencia; si es estable considerar TC a los 2 y 4 años',
      followUpInterval: '3-6 meses (considerar 2 y 4 años)',
      rationale: 'Múltiples nódulos subsólidos <6mm requieren confirmación a corto plazo; considerar causas infecciosas',
    };
  }

  if (type === 'ground-glass') {
    return {
      guideline: GUIDELINE,
      category: 'Vidrio deslustrado ≥6mm (múltiples)',
      recommendation: 'TC a los 3-6 meses; manejo posterior basado en el nódulo más sospechoso',
      followUpInterval: '3-6 meses',
      rationale: 'El nódulo dominante guía el manejo; GGNs múltiples persistentes pueden representar enfermedad multifocal',
    };
  }

  if (solidComponent === undefined) {
    return {
      guideline: GUIDELINE,
      category: 'Semi-sólido ≥6mm (múltiples, componente sólido desconocido)',
      recommendation: 'Medir componente sólido; TC a los 3-6 meses; manejo basado en nódulo dominante',
      followUpInterval: '3-6 meses',
      rationale: 'El tamaño del componente sólido determina la estratificación de riesgo',
      warnings: ['Se requiere tamaño del componente sólido para evaluación precisa'],
    };
  }

  if (solidComponent < 6) {
    return {
      guideline: GUIDELINE,
      category: 'Semi-sólido ≥6mm, sólido <6mm (múltiples)',
      recommendation: 'TC a los 3-6 meses; si persiste, TC anual por 5 años (nódulo dominante)',
      followUpInterval: '3-6 meses; luego anual x5a',
      rationale: 'Nódulos semi-sólidos persistentes con componente sólido pequeño requieren vigilancia a largo plazo',
    };
  }

  return {
    guideline: GUIDELINE,
    category: 'Semi-sólido ≥6mm, sólido ≥6mm (múltiples)',
    recommendation: 'TC a los 3-6 meses; considerar PET/CT, biopsia o escisión',
    followUpInterval: '3-6 meses (luego diagnóstico)',
    malignancyRisk: 'Alta sospecha',
    rationale: 'Componente sólido ≥6mm es altamente sospechoso incluso en nódulos múltiples',
    warnings: ['ALTAMENTE SOSPECHOSO — considerar diagnóstico de tejido'],
  };
}

function assessSolidSingle(diameter: number, riskLevel: RiskLevel): AssessmentResult {
  if (diameter < 6) {
    return riskLevel === 'low'
      ? {
        guideline: GUIDELINE,
        category: 'Sólido <6mm (único, riesgo bajo)',
        recommendation: 'Sin seguimiento de rutina',
        followUpInterval: 'Ninguno',
        rationale: 'Riesgo de malignidad <1% en pacientes de bajo riesgo',
      }
      : {
        guideline: GUIDELINE,
        category: 'Sólido <6mm (único, riesgo alto)',
        recommendation: 'TC opcional a los 12 meses',
        followUpInterval: '12 meses (opcional)',
        rationale: 'Mayor probabilidad pre-test — considerar si morfología es sospechosa',
      };
  }

  if (diameter >= 6 && diameter <= 8) {
    return riskLevel === 'low'
      ? {
        guideline: GUIDELINE,
        category: 'Sólido 6-8mm (único, riesgo bajo)',
        recommendation: 'TC a los 6-12 meses; considerar TC a los 18-24 meses',
        followUpInterval: '6-12 meses (considerar 18-24)',
        rationale: 'Establecer estabilidad; riesgo de malignidad ~0.5-2%',
      }
      : {
        guideline: GUIDELINE,
        category: 'Sólido 6-8mm (único, riesgo alto)',
        recommendation: 'TC a los 6-12 meses; luego TC a los 18-24 meses',
        followUpInterval: '6-12 meses; luego 18-24 meses',
        rationale: 'Mayor riesgo justifica dos escaneos de seguimiento',
      };
  }

  return {
    guideline: GUIDELINE,
    category: 'Sólido >8mm (único)',
    recommendation: 'Considerar TC a los 3 meses, PET/CT o muestreo de tejido',
    followUpInterval: '3 meses (o según indicación)',
    malignancyRisk: '~3%',
    rationale: 'Nódulos sólidos más grandes merecen evaluación agresiva',
  };
}

function assessSolidMultiple(diameter: number, riskLevel: RiskLevel): AssessmentResult {
  if (diameter < 6) {
    return riskLevel === 'low'
      ? {
        guideline: GUIDELINE,
        category: 'Sólido <6mm (múltiples, riesgo bajo)',
        recommendation: 'Sin seguimiento de rutina',
        followUpInterval: 'Ninguno',
        rationale: 'Riesgo de malignidad muy bajo en pacientes de bajo riesgo',
      }
      : {
        guideline: GUIDELINE,
        category: 'Sólido <6mm (múltiples, riesgo alto)',
        recommendation: 'TC opcional a los 12 meses',
        followUpInterval: '12 meses (opcional)',
        rationale: 'Riesgo basal mayor; considerar si morfología es sospechosa',
      };
  }

  return riskLevel === 'low'
    ? {
      guideline: GUIDELINE,
      category: 'Sólido ≥6mm (múltiples, riesgo bajo)',
      recommendation: 'TC a los 3-6 meses; considerar TC a los 18-24 meses',
      followUpInterval: '3-6 meses (considerar 18-24)',
      rationale: 'Múltiples nódulos requieren seguimiento a corto plazo para evaluar estabilidad',
    }
    : {
      guideline: GUIDELINE,
      category: 'Sólido ≥6mm (múltiples, riesgo alto)',
      recommendation: 'TC a los 3-6 meses; luego TC a los 18-24 meses',
      followUpInterval: '3-6 meses; luego 18-24 meses',
      rationale: 'Pacientes de alto riesgo requieren dos escaneos de seguimiento',
    };
}

function assessGroundGlass(diameter: number): AssessmentResult {
  if (diameter < 6) {
    return {
      guideline: GUIDELINE,
      category: 'Vidrio deslustrado <6mm',
      recommendation: 'Sin seguimiento de rutina',
      followUpInterval: 'Ninguno',
      rationale: 'Riesgo de malignidad muy bajo; evitar sobretratamiento',
    };
  }
  return {
    guideline: GUIDELINE,
    category: 'Vidrio deslustrado ≥6mm',
    recommendation: 'TC a los 6-12 meses, luego TC cada 2 años hasta los 5 años',
    followUpInterval: '6-12 meses; luego c/2a hasta 5a',
    rationale: 'GGNs persistentes ≥6mm justifican vigilancia',
  };
}

function assessPartSolid(diameter: number, solidComponent?: number): AssessmentResult {
  if (diameter < 6) {
    return {
      guideline: GUIDELINE,
      category: 'Semi-sólido <6mm',
      recommendation: 'Sin seguimiento de rutina',
      followUpInterval: 'Ninguno',
      rationale: 'Nódulos semi-sólidos pequeños raramente son malignos',
    };
  }

  // Treat NaN as undefined (unknown solid component)
  const safeSolidComponent = solidComponent !== undefined && Number.isNaN(solidComponent)
    ? undefined
    : solidComponent;

  if (safeSolidComponent === undefined) {
    return {
      guideline: GUIDELINE,
      category: 'Semi-sólido (componente sólido desconocido)',
      recommendation: 'Medir componente sólido; manejo depende del tamaño sólido',
      followUpInterval: 'Pendiente de medición',
      rationale: 'El tamaño del componente sólido determina la estratificación de riesgo',
      warnings: ['Se requiere tamaño del componente sólido para evaluación precisa'],
    };
  }

  if (safeSolidComponent < 6) {
    return {
      guideline: GUIDELINE,
      category: 'Semi-sólido ≥6mm, sólido <6mm',
      recommendation: 'TC a los 3-6 meses, luego TC anual por 5 años',
      followUpInterval: '3-6 meses; luego anual x5a',
      rationale: 'El riesgo aumenta con la persistencia; vigilancia anual recomendada',
    };
  }

  return {
    guideline: GUIDELINE,
    category: 'Semi-sólido, sólido ≥6mm',
    recommendation: 'PET/CT, biopsia o escisión quirúrgica',
    followUpInterval: 'Según indicación',
    malignancyRisk: 'Alta sospecha',
    rationale: 'Componente sólido ≥6mm es altamente sospechoso',
    warnings: ['ALTAMENTE SOSPECHOSO — considerar diagnóstico de tejido'],
  };
}

export function assessFleischner({ patient, nodule }: FleischnerAssessmentInput): AssessmentResult {
  const applicability = checkFleischnerApplicability(patient);
  if (!applicability.applicable) {
    return {
      guideline: GUIDELINE,
      category: 'No aplicable',
      recommendation: 'Usar guía clínica alternativa',
      followUpInterval: 'N/A',
      rationale: applicability.reason ?? 'Exclusiones de guía aplican',
      warnings: applicability.reason ? [applicability.reason] : undefined,
    };
  }

  const riskLevel: RiskLevel = patient.riskLevel ?? 'low';
  const { type, diameterMm, solidComponentMm, isMultiple, isPerifissural } = nodule;
  const roundedDiameter = roundToNearestMm(diameterMm);
  const roundedSolidComponent = solidComponentMm === undefined ? undefined : roundToNearestMm(solidComponentMm);

  if (type === 'solid' && isPerifissural && roundedDiameter <= 10) {
    return {
      guideline: GUIDELINE,
      category: 'Nódulo perifisural (morfología benigna)',
      recommendation: 'Sin seguimiento de rutina',
      followUpInterval: 'Ninguno',
      rationale: 'Nódulos perifisurales ≤10mm con morfología benigna típica raramente son malignos',
    };
  }

  if (type === 'solid') {
    return isMultiple ? assessSolidMultiple(roundedDiameter, riskLevel) : assessSolidSingle(roundedDiameter, riskLevel);
  }

  if (type === 'ground-glass') {
    return isMultiple
      ? assessSubsolidMultiple({ type, diameter: roundedDiameter, riskLevel })
      : assessGroundGlass(roundedDiameter);
  }

  if (type === 'part-solid') {
    return isMultiple
      ? assessSubsolidMultiple({ type, diameter: roundedDiameter, solidComponent: roundedSolidComponent, riskLevel })
      : assessPartSolid(roundedDiameter, roundedSolidComponent);
  }

  return {
    guideline: GUIDELINE,
    category: 'Tipo de nódulo no soportado',
    recommendation: 'Revisar datos de entrada',
    followUpInterval: 'N/A',
    rationale: 'Tipo no reconocido',
    warnings: ['Tipo de nódulo desconocido'],
  };
}

export function getFleischnerWarnings(nodule: NoduleCharacteristics): string[] {
  const warnings: string[] = [];
  if (nodule.solidComponentMm !== undefined && nodule.solidComponentMm > nodule.diameterMm) {
    warnings.push('El componente sólido no puede exceder el diámetro total');
  }
  return warnings;
}
