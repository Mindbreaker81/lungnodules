import { z } from 'zod';


const clinicalContextValues = ['incidental', 'screening'] as const;
const noduleTypeValues = ['solid', 'ground-glass', 'part-solid'] as const;
const riskLevelValues = ['low', 'high'] as const;
const scanTypeValues = ['baseline', 'follow-up'] as const;

const diameterSchema = z
  .number({ invalid_type_error: 'Enter diameter between 1-100 mm' })
  .min(1, 'Enter diameter between 1-100 mm')
  .max(100, 'Enter diameter between 1-100 mm');

const solidComponentSchema = z
  .number({ invalid_type_error: 'Solid component cannot exceed total diameter' })
  .min(0, 'Solid component cannot exceed total diameter')
  .max(100, 'Solid component cannot exceed total diameter')
  .optional();

export const patientSchema = z.object({
  clinicalContext: z.enum(clinicalContextValues),
  age: z.number().min(0, 'Age must be positive'),
  riskLevel: z.enum(riskLevelValues).optional(), // Fleischner only
  hasKnownMalignancy: z.boolean().optional(),
  isImmunocompromised: z.boolean().optional(),
});

export const noduleBaseSchema = z.object({
  type: z.enum(noduleTypeValues),
  diameterMm: diameterSchema,
  solidComponentMm: solidComponentSchema,
  isMultiple: z.boolean(),
  isPerifissural: z.boolean().optional(),
  hasSpiculation: z.boolean().optional(),
  isJuxtapleural: z.boolean().optional(),
  isAirway: z.boolean().optional(),
  isAtypicalCyst: z.boolean().optional(),
  isNew: z.boolean().optional(),
});

export const lungRadsExtension = z.object({
  scanType: z.enum(scanTypeValues),
  priorDiameterMm: z.number().min(0).optional(),
  priorScanMonthsAgo: z.number().min(0).optional(),
});

const fleischnerCoreSchema = z.object({
  patient: patientSchema,
  nodule: noduleBaseSchema,
});

export const fleischnerInputSchema = fleischnerCoreSchema
  .refine((data: z.infer<typeof fleischnerCoreSchema>) => data.patient.clinicalContext === 'incidental', {
    message: 'Fleischner applies to incidental findings',
    path: ['patient', 'clinicalContext'],
  })
  .refine((data: z.infer<typeof fleischnerCoreSchema>) => data.patient.age >= 35, {
    message: 'Fleischner guidelines apply to patients ≥35 years',
    path: ['patient', 'age'],
  })
  .refine((data: z.infer<typeof fleischnerCoreSchema>) => data.patient.riskLevel !== undefined, {
    message: 'Risk level is required for Fleischner',
    path: ['patient', 'riskLevel'],
  })
  .refine(
    (data: z.infer<typeof fleischnerCoreSchema>) =>
      data.nodule.type !== 'part-solid' ||
      data.nodule.solidComponentMm === undefined ||
      data.nodule.solidComponentMm <= data.nodule.diameterMm,
    {
      message: 'Solid component cannot exceed total diameter',
      path: ['nodule', 'solidComponentMm'],
    },
  );

const lungRadsCoreSchema = z.object({
  patient: patientSchema,
  nodule: noduleBaseSchema.merge(lungRadsExtension),
});

export const lungRadsInputSchema = lungRadsCoreSchema
  .refine((data: z.infer<typeof lungRadsCoreSchema>) => data.patient.clinicalContext === 'screening', {
    message: 'Lung-RADS applies to screening context',
    path: ['patient', 'clinicalContext'],
  })
  .refine(
    (data: z.infer<typeof lungRadsCoreSchema>) =>
      data.nodule.type !== 'part-solid' ||
      data.nodule.solidComponentMm === undefined ||
      data.nodule.solidComponentMm <= data.nodule.diameterMm,
    {
      message: 'Solid component cannot exceed total diameter',
      path: ['nodule', 'solidComponentMm'],
    },
  )
  .refine(
    (data: z.infer<typeof lungRadsCoreSchema>) => {
      if (data.nodule.scanType === 'follow-up') {
        return data.nodule.priorDiameterMm !== undefined && data.nodule.priorScanMonthsAgo !== undefined;
      }
      return true;
    },
    {
      message: 'Prior diameter and interval are required for follow-up scans',
      path: ['nodule', 'priorDiameterMm'],
    },
  );

export const assessmentInputSchema = z.discriminatedUnion('clinicalContext', [
  z.object({
    clinicalContext: z.literal('incidental'),
    patient: patientSchema.extend({ riskLevel: z.enum(riskLevelValues) }),
    nodule: noduleBaseSchema,
  }),
  z.object({
    clinicalContext: z.literal('screening'),
    patient: patientSchema,
    nodule: noduleBaseSchema.merge(lungRadsExtension),
  }),
]);

export type FleischnerInput = z.infer<typeof fleischnerInputSchema>;
export type LungRadsInput = z.infer<typeof lungRadsInputSchema>;
export type AssessmentInput = z.infer<typeof assessmentInputSchema>;
