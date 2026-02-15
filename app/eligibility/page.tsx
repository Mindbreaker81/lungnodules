"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  eligibilityModels,
  computeEligibility,
  plcom2012InputSchema,
  type Plcom2012Input,
  type Plcom2012InputSchemaType,
  type EligibilityResult,
} from "@lib/eligibility";
import { Button } from "@components/ui/button";
import { Input } from "@components/ui/input";

const defaultValues: Plcom2012InputSchemaType = {
  age: 55,
  race: "white",
  education: 4,
  bmi: 25,
  copd: false,
  cancer_hist: false,
  family_hist_lung_cancer: false,
  smoking_status: "former",
  smoking_intensity: 20,
  duration_smoking: 30,
  smoking_quit_time: 5,
};

const RACE_LABELS: Record<Plcom2012Input["race"], string> = {
  white: "Blanco",
  black: "Negro",
  hispanic: "Hispano",
  asian: "Asiático",
  native_hawaiian_pacific_islander: "Nativo de Hawái / Islas del Pacífico",
  american_indian_alaskan_native: "Indígena americano / Nativo de Alaska",
};

/** Escala PLCO 1–6: NEJM 2013 Tammemägi et al. Traducción al español coherente con cuestionarios de salud (diferenciar “sin título” vs “titulado”). */
const EDUCATION_LABELS: Record<number, string> = {
  1: "Sin graduado en secundaria",
  2: "Graduado en secundaria (bachillerato)",
  3: "Formación tras secundaria (sin estudios universitarios)",
  4: "Estudios universitarios sin terminar (sin título)",
  5: "Graduado universitario (titulado)",
  6: "Posgrado o título profesional",
};

export default function EligibilityPage() {
  const [result, setResult] = useState<EligibilityResult | null>(null);
  const [selectedModelId, setSelectedModelId] = useState(eligibilityModels[0]?.id ?? "plcom2012");

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<Plcom2012InputSchemaType>({
    resolver: zodResolver(plcom2012InputSchema),
    defaultValues,
  });

  const smokingStatus = watch("smoking_status");

  const onSubmit = (data: Plcom2012InputSchemaType) => {
    const res = computeEligibility(selectedModelId, data);
    setResult(res);
  };

  return (
    <section className="space-y-8">
      <header className="space-y-1">
        <p className="text-sm text-slate-500">Elegibilidad para cribado • Riesgo a 6 años</p>
        <h1 className="text-2xl font-semibold text-primary">Elegibilidad para cribado</h1>
        <p className="text-slate-400">
          Calcule el riesgo de cáncer de pulmón a 6 años para valorar elegibilidad para cribado con TC de baja dosis (LDCT). No sustituye el manejo del nódulo (Fleischner / Lung-RADS).
        </p>
      </header>

      <div className="space-y-4">
        <label className="block text-sm font-medium text-slate-300">
          Modelo de riesgo
        </label>
        <select
          className="w-full max-w-xs rounded-md border border-slate-600 bg-transparent px-3 py-2 text-sm text-slate-100 focus-visible:outline focus-visible:ring-1 focus-visible:ring-primary"
          value={selectedModelId}
          onChange={(e) => {
            setSelectedModelId(e.target.value);
            setResult(null);
          }}
          aria-label="Seleccionar modelo de elegibilidad"
        >
          {eligibilityModels.map((m) => (
            <option key={m.id} value={m.id} className="bg-surface">
              {m.label}
            </option>
          ))}
        </select>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <fieldset className="space-y-4 rounded-lg border border-slate-700/60 bg-slate-900/40 p-4">
          <legend className="text-base font-semibold text-white">
            Datos del paciente (PLCOm2012)
          </legend>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-slate-300">Edad (años)</label>
              <Input
                type="number"
                min={40}
                max={90}
                className="mt-1"
                {...register("age", { valueAsNumber: true })}
                aria-invalid={!!errors.age}
              />
              {errors.age && (
                <p className="mt-1 text-sm text-rose-400" role="alert">{errors.age.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300">IMC (kg/m²)</label>
              <Input
                type="number"
                min={15}
                max={50}
                step={0.1}
                className="mt-1"
                {...register("bmi", { valueAsNumber: true })}
                aria-invalid={!!errors.bmi}
              />
              {errors.bmi && (
                <p className="mt-1 text-sm text-rose-400" role="alert">{errors.bmi.message}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300">Raza / etnia</label>
            <select
              className="mt-1 w-full rounded-md border border-slate-600 bg-transparent px-3 py-2 text-sm text-slate-100 focus-visible:outline focus-visible:ring-1 focus-visible:ring-primary"
              {...register("race")}
              aria-invalid={!!errors.race}
            >
              {(Object.entries(RACE_LABELS) as [Plcom2012Input["race"], string][]).map(([value, label]) => (
                <option key={value} value={value} className="bg-surface">
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300">Nivel educativo (1–6)</label>
            <select
              className="mt-1 w-full rounded-md border border-slate-600 bg-transparent px-3 py-2 text-sm text-slate-100 focus-visible:outline focus-visible:ring-1 focus-visible:ring-primary"
              {...register("education", { valueAsNumber: true })}
              aria-invalid={!!errors.education}
            >
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <option key={n} value={n} className="bg-surface">
                  {n} – {EDUCATION_LABELS[n]}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <label className="flex items-center gap-2 text-white">
              <input
                type="checkbox"
                {...register("copd")}
                className="rounded border-slate-600 text-primary focus:ring-primary"
              />
              EPOC
            </label>
            <label className="flex items-center gap-2 text-white">
              <input
                type="checkbox"
                {...register("cancer_hist")}
                className="rounded border-slate-600 text-primary focus:ring-primary"
              />
              Historia personal de cáncer
            </label>
            <label className="flex items-center gap-2 text-white">
              <input
                type="checkbox"
                {...register("family_hist_lung_cancer")}
                className="rounded border-slate-600 text-primary focus:ring-primary"
              />
              Historia familiar de cáncer de pulmón
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300">Tabaquismo</label>
            <select
              className="mt-1 w-full rounded-md border border-slate-600 bg-transparent px-3 py-2 text-sm text-slate-100 focus-visible:outline focus-visible:ring-1 focus-visible:ring-primary"
              {...register("smoking_status")}
              onChange={(e) => {
                const v = e.target.value as "current" | "former";
                setValue("smoking_status", v);
                if (v === "current") setValue("smoking_quit_time", 0);
              }}
            >
              <option value="current" className="bg-surface">Fumador actual</option>
              <option value="former" className="bg-surface">Exfumador</option>
            </select>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-slate-300">
                Cigarrillos/día (cuando fumaba)
              </label>
              <Input
                type="number"
                min={1}
                max={100}
                className="mt-1"
                {...register("smoking_intensity", { valueAsNumber: true })}
                aria-invalid={!!errors.smoking_intensity}
              />
              {errors.smoking_intensity && (
                <p className="mt-1 text-sm text-rose-400" role="alert">{errors.smoking_intensity.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300">Duración tabaquismo (años)</label>
              <Input
                type="number"
                min={1}
                max={70}
                className="mt-1"
                {...register("duration_smoking", { valueAsNumber: true })}
                aria-invalid={!!errors.duration_smoking}
              />
              {errors.duration_smoking && (
                <p className="mt-1 text-sm text-rose-400" role="alert">{errors.duration_smoking.message}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300">
              Años desde que dejó de fumar (0 si fumador actual)
            </label>
            <Input
              type="number"
              min={0}
              max={60}
              className="mt-1 max-w-[12rem]"
              {...register("smoking_quit_time", { valueAsNumber: true })}
              disabled={smokingStatus === "current"}
              aria-invalid={!!errors.smoking_quit_time}
            />
            {errors.smoking_quit_time && (
              <p className="mt-1 text-sm text-rose-400" role="alert">{errors.smoking_quit_time.message}</p>
            )}
          </div>
        </fieldset>

        <Button type="submit" size="lg">
          Calcular riesgo a 6 años
        </Button>
      </form>

      {result && (
        <div
          className="space-y-4 rounded-xl border border-slate-700/60 bg-surface p-6"
          role="status"
          aria-live="polite"
        >
          <h2 className="text-lg font-semibold text-white">Resultado</h2>
          <p className="text-2xl font-bold text-primary">
            Riesgo a 6 años: {(result.probability * 100).toFixed(2)}%
          </p>
          <p className="text-sm text-slate-400">
            Umbral usado: {(result.thresholdUsed * 100).toFixed(2)}%
          </p>
          <p
            className={`rounded-lg px-3 py-2 text-sm font-semibold ${
              result.eligible
                ? "bg-emerald-500/20 text-emerald-200"
                : "bg-slate-600/40 text-slate-300"
            }`}
          >
            {result.eligible ? "Elegible para cribado" : "No elegible según este umbral"}
          </p>
          <p className="text-sm text-slate-500 italic">
            Este riesgo se usa para elegibilidad de cribado. No sustituye Fleischner ni Lung-RADS para el manejo del nódulo.
          </p>
          <Link href="/assessment">
            <Button variant="outline" size="sm">
              Evaluar un nódulo (Fleischner / Lung-RADS)
            </Button>
          </Link>
        </div>
      )}

      <p className="text-xs text-slate-500">
        PLCOm2012: Tammemägi et al. NEJM 2013. Selection Criteria for Lung-Cancer Screening.
      </p>
    </section>
  );
}
