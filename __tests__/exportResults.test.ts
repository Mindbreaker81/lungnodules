import { formatAsText } from '@components/ExportResults';
import { formatResultForCopy } from '@components/wizard/ResultsStep';
import { AssessmentResult } from '@lib/algorithms';
import { AssessmentInput } from '@lib/schemas/noduleInput';

const baseResult: AssessmentResult = {
  guideline: 'lung-rads-2022',
  category: '4A',
  recommendation: 'LDCT en 3 meses',
  followUpInterval: '3 meses',
  rationale: 'Nódulo sólido de 8-<15 mm en cribado baseline',
};

const baseInput: AssessmentInput = {
  clinicalContext: 'screening',
  patient: {
    clinicalContext: 'screening',
    age: 65,
    sex: 'female',
    smokingStatus: 'former',
    extrathoracicCancerHistory: 'none',
    hasFamilyHistoryLungCancer: false,
    hasEmphysema: false,
  },
  nodule: {
    type: 'solid',
    diameterMm: 15,
    maxDiameterMm: 20,
    isMultiple: false,
    noduleCount: 1,
    hasSpiculation: false,
    isUpperLobe: true,
    scanType: 'baseline',
  },
};

describe('Export text report', () => {
  test('labels the mean diameter and records the maximum transverse diameter used by Brock', () => {
    const txt = formatAsText(baseResult, baseInput);
    expect(txt).toContain('Diámetro medio: 15.0 mm');
    expect(txt).toContain('Diámetro máximo transversal: 20.0 mm (usado por Brock)');
  });

  test('omits the maximum transverse line when the field was not recorded', () => {
    const input: AssessmentInput = {
      ...baseInput,
      nodule: { ...baseInput.nodule, maxDiameterMm: undefined },
    };
    const txt = formatAsText(baseResult, input);
    expect(txt).toContain('Diámetro medio: 15.0 mm');
    expect(txt).not.toContain('Diámetro máximo transversal');
  });
});

describe('Copy-to-clipboard text', () => {
  test('labels the mean diameter and records the maximum transverse diameter used by Brock', () => {
    const copy = formatResultForCopy(baseResult, baseInput);
    expect(copy).toContain('Diámetro medio: 15.0 mm');
    expect(copy).toContain('Diámetro máximo transversal: 20.0 mm (usado por Brock)');
  });
});

describe('New Lung-RADS input fields in text formats', () => {
  const partSolidInput: AssessmentInput = {
    clinicalContext: 'screening',
    patient: { clinicalContext: 'screening', age: 60 },
    nodule: {
      type: 'part-solid',
      diameterMm: 12,
      solidComponentMm: 4,
      isMultiple: false,
      scanType: 'follow-up',
      priorDiameterMm: 12,
      priorSolidComponentMm: 2,
      priorScanMonthsAgo: 12,
    },
  };

  const juxtapleuralInput: AssessmentInput = {
    clinicalContext: 'screening',
    patient: { clinicalContext: 'screening', age: 60 },
    nodule: {
      type: 'solid',
      diameterMm: 8,
      isMultiple: false,
      scanType: 'baseline',
      isJuxtapleural: true,
      hasSmoothMargins: true,
      juxtapleuralShape: 'triangular',
    },
  };

  const airwayInput: AssessmentInput = {
    clinicalContext: 'screening',
    patient: { clinicalContext: 'screening', age: 60 },
    nodule: {
      type: 'solid',
      diameterMm: 8,
      isMultiple: false,
      scanType: 'baseline',
      isAirway: true,
      airwayLocation: 'subsegmental',
      airwayInflammatoryOrInfectious: true,
      airwayInflammatoryCategory: 'category2',
    },
  };

  const newNoduleInput: AssessmentInput = {
    clinicalContext: 'screening',
    patient: { clinicalContext: 'screening', age: 60 },
    nodule: {
      type: 'solid',
      diameterMm: 5,
      isMultiple: false,
      scanType: 'follow-up',
      isNew: true,
    },
  };

  const formatters = [
    ['formatAsText', formatAsText],
    ['formatResultForCopy', formatResultForCopy],
  ] as const;

  test.each(formatters)('%s includes prior solid component and interval', (_name, format) => {
    const txt = format(baseResult, partSolidInput);
    expect(txt).toContain('Componente sólido previo: 2.0 mm');
    expect(txt).toContain('Diámetro previo: 12.0 mm');
    expect(txt).toContain('Intervalo desde el scan previo: 12 meses');
  });

  test.each(formatters)('%s includes juxtapleural margins and shape', (_name, format) => {
    const txt = format(baseResult, juxtapleuralInput);
    expect(txt).toContain('Márgenes lisos: Sí');
    expect(txt).toContain('Forma: Triangular');
  });

  test.each(formatters)('%s includes airway inflammatory category', (_name, format) => {
    const txt = format(baseResult, airwayInput);
    expect(txt).toContain('Localización vía aérea: Subsegmentario');
    expect(txt).toContain('Categoría vía aérea inflamatoria: Categoría 2');
  });

  test.each(formatters)('%s records a new nodule explicitly', (_name, format) => {
    const txt = format(baseResult, newNoduleInput);
    expect(txt).toContain('Nódulo nuevo: Sí');
  });
});
