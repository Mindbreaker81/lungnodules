import { z } from 'zod';


const clinicalContextValues = ['incidental', 'screening'] as const;
const noduleTypeValues = ['solid', 'ground-glass', 'part-solid'] as const;
const riskLevelValues = ['low', 'high'] as const;
const scanTypeValues = ['baseline', 'follow-up'] as const;
const airwayLocationValues = ['subsegmental', 'segmental-proximal'] as const;
const inflammatoryCategoryValues = ['category0', 'category2'] as const;
const atypicalCystCategoryValues = ['category3', 'category4A', 'category4B'] as const;
const lungRadsCategoryValues = ['0', '1', '2', '3', '4A', '4B', '4X', 'S'] as const;
const priorStatusValues = ['stable', 'progression'] as const;

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
  isBenign: z.boolean().optional(),
  hasSignificantFinding: z.boolean().optional(),
  isInflammatory: z.boolean().optional(),
  inflammatoryCategory: z.enum(inflammatoryCategoryValues).optional(),
  airwayLocation: z.enum(airwayLocationValues).optional(),
  airwayPersistent: z.boolean().optional(),
  atypicalCystCategory: z.enum(atypicalCystCategoryValues).optional(),
  isNew: z.boolean().optional(),
});

export const lungRadsExtension = z.object({
  scanType: z.enum(scanTypeValues),
  priorDiameterMm: z.number().min(0).optional(),
  priorScanMonthsAgo: z.number().min(0).optional(),
});

const steppedManagementSchema = z.object({
  priorCategory: z.enum(lungRadsCategoryValues).optional(),
  priorStatus: z.enum(priorStatusValues).optional(),
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
  )
  .superRefine((data, ctx) => {
    if (data.patient.hasKnownMalignancy) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Fleischner no aplica en pacientes con cáncer conocido',
        path: ['patient', 'hasKnownMalignancy'],
      });
    }
    if (data.patient.isImmunocompromised) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Fleischner no aplica en pacientes inmunocomprometidos',
        path: ['patient', 'isImmunocompromised'],
      });
    }
  });

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

const incidentalAssessmentSchema = z.object({
  clinicalContext: z.literal('incidental'),
  patient: patientSchema.extend({ riskLevel: z.enum(riskLevelValues) }),
  nodule: noduleBaseSchema,
});

const screeningAssessmentSchema = z.object({
  clinicalContext: z.literal('screening'),
  patient: patientSchema,
  nodule: noduleBaseSchema.merge(lungRadsExtension),
});

export const assessmentInputSchema = z
  .discriminatedUnion('clinicalContext', [
    incidentalAssessmentSchema.merge(steppedManagementSchema),
    screeningAssessmentSchema.merge(steppedManagementSchema),
  ])
  .superRefine((data, ctx) => {
    if (data.clinicalContext === 'incidental') {
      if (data.patient.hasKnownMalignancy) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Fleischner no aplica en pacientes con cáncer conocido',
          path: ['patient', 'hasKnownMalignancy'],
        });
      }
      if (data.patient.isImmunocompromised) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Fleischner no aplica en pacientes inmunocomprometidos',
          path: ['patient', 'isImmunocompromised'],
        });
      }
      return;
    }

    if (data.nodule.isAirway && !data.nodule.airwayLocation) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Selecciona la localización del nódulo de vía aérea',
        path: ['nodule', 'airwayLocation'],
      });
    }
    if (data.nodule.isInflammatory && !data.nodule.inflammatoryCategory) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Selecciona la categoría para hallazgos inflamatorios/infecciosos',
        path: ['nodule', 'inflammatoryCategory'],
      });
    }
    if (data.nodule.isAtypicalCyst && !data.nodule.atypicalCystCategory) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Selecciona la categoría del quiste pulmonar atípico',
        path: ['nodule', 'atypicalCystCategory'],
      });
    }
    if (data.priorCategory && !data.priorStatus) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Selecciona el estado previo si indicas una categoría previa',
        path: ['priorStatus'],
      });
    }
    if (data.priorStatus && !data.priorCategory) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Selecciona la categoría previa si indicas un estado',
        path: ['priorCategory'],
      });
    }
  });

export type FleischnerInput = z.infer<typeof fleischnerInputSchema>;
export type LungRadsInput = z.infer<typeof lungRadsInputSchema>;
export type AssessmentInput = z.infer<typeof assessmentInputSchema>;
