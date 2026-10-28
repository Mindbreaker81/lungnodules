import { z } from "zod";

const plcom2012RaceValues = [
  "white",
  "black",
  "hispanic",
  "asian",
  "native_hawaiian_pacific_islander",
  "american_indian_alaskan_native",
] as const;

const plcom2012SmokingStatusValues = ["current", "former"] as const;

export const plcom2012RaceSchema = z.enum(plcom2012RaceValues);
export const plcom2012EducationSchema = z.union([
  z.literal(1),
  z.literal(2),
  z.literal(3),
  z.literal(4),
  z.literal(5),
  z.literal(6),
]);
export const plcom2012SmokingStatusSchema = z.enum(
  plcom2012SmokingStatusValues
);

export const plcom2012InputSchema = z
  .object({
    age: z
      .number({ invalid_type_error: "La edad debe ser un número" })
      .min(40, "Edad mínima 40 años (el modelo se desarrolló con 55–74)")
      .max(90, "Edad máxima 90 años"),
    race: plcom2012RaceSchema,
    education: plcom2012EducationSchema,
    bmi: z
      .number({ invalid_type_error: "El IMC debe ser un número" })
      .min(15, "IMC mínimo 15")
      .max(50, "IMC máximo 50"),
    copd: z.boolean(),
    cancer_hist: z.boolean(),
    family_hist_lung_cancer: z.boolean(),
    smoking_status: plcom2012SmokingStatusSchema,
    smoking_intensity: z
      .number({ invalid_type_error: "Intensidad debe ser un número" })
      .min(1, "Intensidad debe ser al menos 1 cigarrillo/día (use valor cuando fumaba si es exfumador)"),
    duration_smoking: z
      .number({ invalid_type_error: "Duración debe ser un número" })
      .min(1, "Duración del tabaquismo al menos 1 año")
      .max(70, "Duración máxima 70 años"),
    smoking_quit_time: z
      .number({ invalid_type_error: "Años desde abandono debe ser un número" })
      .min(0, "Años desde abandono no puede ser negativo")
      .max(60, "Años desde abandono máximo 60"),
  })
  .refine(
    (data) => {
      if (data.smoking_status === "current") return data.smoking_quit_time === 0;
      return true;
    },
    {
      message: "Si es fumador actual, años desde abandono debe ser 0",
      path: ["smoking_quit_time"],
    }
  )
  .refine((data) => data.duration_smoking + data.smoking_quit_time <= data.age, {
    message: "Los años fumando más los años desde el abandono no pueden superar la edad",
    path: ["duration_smoking"],
  });

/** Age range of the PLCO/NLST cohorts used to develop and validate the model (Tammemägi 2013). */
export const PLCOM2012_COHORT_AGE = { min: 55, max: 74 } as const;

export type Plcom2012InputSchemaType = z.infer<typeof plcom2012InputSchema>;

/**
 * Default 6-year risk threshold for screening eligibility (1.51%): 65th percentile of
 * PLCOm2012 risk (Tammemägi et al., PLoS Med 2014;11:e1001764), not the 2013 NEJM paper.
 */
export const PLCOM2012_DEFAULT_THRESHOLD = 0.0151;
