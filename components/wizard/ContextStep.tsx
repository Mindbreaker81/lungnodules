"use client";

import { useFormContext } from "react-hook-form";
import { AssessmentInput } from "@lib/schemas/noduleInput";

export default function ContextStep() {
  const { register, watch } = useFormContext<AssessmentInput>();
  const context = watch("clinicalContext");

  return (
    <fieldset className="space-y-4" aria-label="Contexto clínico">
      <legend className="text-base font-semibold text-white">
        Selecciona el contexto clínico para aplicar la guía correcta.
      </legend>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label
          className={`flex cursor-pointer items-start gap-3 rounded-lg border p-4 shadow-sm transition-all ${context === "incidental" ? "border-primary bg-primary/10 ring-1 ring-primary/40" : "border-slate-700 bg-surface hover:border-slate-600"}`}
        >
          <input
            type="radio"
            value="incidental"
            aria-label="Incidental (Fleischner 2017)"
            {...register("clinicalContext")}
            className="mt-1 text-primary focus:ring-primary"
          />
          <div>
            <div className="font-semibold text-white">Incidental (Fleischner 2017)</div>
            <p className="text-sm text-slate-400">
              Pacientes ≥35 años, hallazgo casual. Requiere riesgo bajo/alto.
            </p>
          </div>
        </label>
        <label
          className={`flex cursor-pointer items-start gap-3 rounded-lg border p-4 shadow-sm transition-all ${context === "screening" ? "border-primary bg-primary/10 ring-1 ring-primary/40" : "border-slate-700 bg-surface hover:border-slate-600"}`}
        >
          <input
            type="radio"
            value="screening"
            aria-label="Screening (Lung-RADS v2022)"
            {...register("clinicalContext")}
            className="mt-1 text-primary focus:ring-primary"
          />
          <div>
            <div className="font-semibold text-white">Screening (Lung-RADS v2022)</div>
            <p className="text-sm text-slate-400">
              Programas de cribado de alto riesgo; requiere tipo de scan baseline/follow-up.
            </p>
          </div>
        </label>
      </div>
    </fieldset>
  );
}
