import { assessFleischner } from '../lib/algorithms/fleischner';
import { FleischnerAssessmentInput, RiskLevel } from '../lib/algorithms/types';

describe('Pruebas Clínicas Automatizadas - Guía Fleischner 2017', () => {

    // Caso 1: Paciente de Bajo Riesgo, Nódulo Sólido Pequeño
    test('Caso 1: Mujer 45 años, no fumadora, nódulo sólido 4mm (Bajo Riesgo)', () => {
        const input: FleischnerAssessmentInput = {
            patient: {
                id: 'test-1',
                age: 45,
                clinicalContext: 'incidental',
                riskLevel: 'low', // Basado en no fumadora
                hasKnownMalignancy: false,
                isImmunocompromised: false,
            },
            nodule: {
                type: 'solid',
                diameterMm: 4,
                isMultiple: false,
            }
        };

        const result = assessFleischner(input);

        expect(result.guideline).toBe('fleischner-2017');
        expect(result.recommendation).toBe('Sin seguimiento de rutina');
        expect(result.followUpInterval).toBe('Ninguno');
    });

    // Caso 2: Paciente Alto Riesgo, Nódulo Sólido Intermedio
    test('Caso 2: Hombre 67 años, fumador, nódulo sólido 7mm (Alto Riesgo)', () => {
        const input: FleischnerAssessmentInput = {
            patient: {
                id: 'test-2',
                age: 67,
                clinicalContext: 'incidental',
                riskLevel: 'high',
                hasKnownMalignancy: false,
                isImmunocompromised: false,
            },
            nodule: {
                type: 'solid',
                diameterMm: 7,
                isMultiple: false,
            }
        };

        const result = assessFleischner(input);

        // Para sólido 6-8mm alto riesgo: TC a 6-12 meses, luego 18-24.
        expect(result.recommendation).toContain('TC a los 6-12 meses');
        expect(result.followUpInterval).toContain('6-12 meses');
    });

    // Caso 3: Nódulo Subsólido (Vidrio Deslustrado) Persistente
    test('Caso 3: GGN Puro de 10mm (Requiere seguimiento)', () => {
        const input: FleischnerAssessmentInput = {
            patient: {
                id: 'test-3',
                age: 55,
                clinicalContext: 'incidental',
                riskLevel: 'high', // GGN no depende tanto del riesgo clínico, sino del tamaño
                hasKnownMalignancy: false,
                isImmunocompromised: false,
            },
            nodule: {
                type: 'ground-glass',
                diameterMm: 10,
                isMultiple: false,
            }
        };

        const result = assessFleischner(input);

        expect(result.category).toContain('Vidrio deslustrado');
        expect(result.recommendation).toContain('TC a los 6-12 meses');
    });

    // Caso 4: No aplicable por edad
    test('Caso 4: Paciente joven (25 años) - Exclusión', () => {
        const input: FleischnerAssessmentInput = {
            patient: {
                id: 'test-4',
                age: 25,
                clinicalContext: 'incidental',
                hasKnownMalignancy: false,
                isImmunocompromised: false,
            },
            nodule: {
                type: 'solid',
                diameterMm: 5,
                isMultiple: false,
            }
        };

        const result = assessFleischner(input);

        expect(result.category).toBe('No aplicable');
        // Verifica que hay una advertencia sobre la edad
        expect(result.warnings?.some(w => w.includes('35') || w.includes('edad'))).toBe(true);
    });

});
