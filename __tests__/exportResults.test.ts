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
    expect(copy).toContain('Diámetro medio: 15.0mm');
    expect(copy).toContain('Diámetro máximo transversal: 20.0mm (usado por Brock)');
  });
});
