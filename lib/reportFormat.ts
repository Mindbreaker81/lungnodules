import { AssessmentInput } from './schemas/noduleInput';

const NODULE_TYPE_LABELS: Record<string, string> = {
  solid: 'Sólido',
  'ground-glass': 'Vidrio deslustrado (GGN / no sólido)',
  'part-solid': 'Semi-sólido',
};

const JUXTAPLEURAL_SHAPE_LABELS: Record<string, string> = {
  triangular: 'Triangular',
  lentiform: 'Lentiforme',
  ovoid: 'Ovoide',
  other: 'Otra forma',
};

const CATEGORY_CHOICE_LABELS: Record<string, string> = {
  category0: 'Categoría 0',
  category2: 'Categoría 2',
};

const AIRWAY_LOCATION_LABELS: Record<string, string> = {
  subsegmental: 'Subsegmentario',
  'segmental-proximal': 'Segmentario o proximal',
};

const PRIOR_STATUS_LABELS: Record<string, string> = {
  stable: 'Estable',
  decreasing: 'Decreciente',
  progression: 'Progresión',
};

export const formatNoduleType = (type: string) => NODULE_TYPE_LABELS[type] ?? type;

export const hasNumber = (value: unknown): value is number =>
  typeof value === 'number' && !Number.isNaN(value);

export function formatMeasurement(context: AssessmentInput['clinicalContext'] | undefined, value: number): string {
  if (context === 'incidental') {
    return Math.round(value).toString();
  }
  if (context === 'screening') {
    return value.toFixed(1);
  }
  return value.toString();
}

// Shared input-parameter lines for copy/export so both formats stay in sync
export function inputParameterLines(input: AssessmentInput): string[] {
  const fmt = (value: number) => formatMeasurement(input.clinicalContext, value);
  const { nodule } = input;
  const lines = [
    `Tipo de Nódulo: ${formatNoduleType(nodule.type)}`,
    hasNumber(nodule.diameterMm) ? `Diámetro medio: ${fmt(nodule.diameterMm)} mm` : null,
    hasNumber(nodule.maxDiameterMm)
      ? `Diámetro máximo transversal: ${fmt(nodule.maxDiameterMm)} mm (usado por Brock)`
      : null,
    nodule.solidComponentMm !== undefined ? `Componente Sólido: ${fmt(nodule.solidComponentMm)} mm` : null,
    `Nódulos Múltiples: ${nodule.isMultiple ? 'Sí' : 'No'}`,
  ];

  if (nodule.isJuxtapleural || nodule.isPerifissural) {
    lines.push(
      nodule.isJuxtapleural ? 'Localización: Yuxtapleural' : 'Localización: Perifisural',
      `Márgenes lisos: ${nodule.hasSmoothMargins ? 'Sí' : 'No'}`,
      nodule.juxtapleuralShape
        ? `Forma: ${JUXTAPLEURAL_SHAPE_LABELS[nodule.juxtapleuralShape] ?? nodule.juxtapleuralShape}`
        : null,
    );
  }
  if (nodule.isAirway) {
    lines.push(
      'Nódulo de vía aérea: Sí',
      nodule.airwayLocation
        ? `Localización vía aérea: ${AIRWAY_LOCATION_LABELS[nodule.airwayLocation] ?? nodule.airwayLocation}`
        : null,
      nodule.airwayPersistent ? 'Persistente en control: Sí' : null,
      nodule.airwayInflammatoryOrInfectious ? 'Vía aérea inflamatoria/infecciosa: Sí' : null,
      nodule.airwayInflammatoryCategory
        ? `Categoría vía aérea inflamatoria: ${CATEGORY_CHOICE_LABELS[nodule.airwayInflammatoryCategory] ?? nodule.airwayInflammatoryCategory}`
        : null,
    );
  }
  if (nodule.isInflammatory) {
    lines.push(
      'Hallazgo inflamatorio/infeccioso: Sí',
      nodule.inflammatoryCategory
        ? `Categoría inflamatoria: ${CATEGORY_CHOICE_LABELS[nodule.inflammatoryCategory] ?? nodule.inflammatoryCategory}`
        : null,
    );
  }

  if (input.clinicalContext === 'screening') {
    const screeningNodule = input.nodule;
    if (screeningNodule.isNew) {
      lines.push('Nódulo nuevo: Sí');
    }
    if (screeningNodule.priorDiameterMm !== undefined) {
      lines.push(`Diámetro previo: ${fmt(screeningNodule.priorDiameterMm)} mm`);
    }
    if (screeningNodule.priorSolidComponentMm !== undefined) {
      lines.push(`Componente sólido previo: ${fmt(screeningNodule.priorSolidComponentMm)} mm`);
    }
    if (screeningNodule.priorScanMonthsAgo !== undefined) {
      lines.push(`Intervalo desde el scan previo: ${screeningNodule.priorScanMonthsAgo} meses`);
    }
    if (input.priorCategory) {
      lines.push(`Categoría Lung-RADS previa: ${input.priorCategory}`);
    }
    if (input.priorStatus) {
      lines.push(`Estado previo: ${PRIOR_STATUS_LABELS[input.priorStatus] ?? input.priorStatus}`);
    }
  }

  return lines.filter((line): line is string => Boolean(line));
}
