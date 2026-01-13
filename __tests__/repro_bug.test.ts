
import { assessLungRads } from '../lib/algorithms/lungRads';
import { LungRadsAssessmentInput } from '../lib/algorithms/types';

describe('LungRADS Reproduction Bug', () => {
    it('should classify a 20mm solid baseline nodule as 4B', () => {
        const input: LungRadsAssessmentInput = {
            patient: {
                clinicalContext: 'screening',
                age: 70, // irrelevant but required
            },
            nodule: {
                type: 'solid',
                diameterMm: 20, // The problematic value
                scanType: 'baseline',
                isMultiple: false,
            },
        };

        const result = assessLungRads(input);
        console.log('Result Category:', result.category);
        console.log('Result Rationale:', result.rationale);

        expect(result.category).toBe('4B');
    });
});
