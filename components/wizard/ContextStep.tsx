"use client";

import { useFormContext } from "react-hook-form";
import { AssessmentInput } from "@lib/schemas/noduleInput";

export default function ContextStep() {
  const { register, watch } = useFormContext<AssessmentInput>();
  const context = watch("clinicalContext");

  return (
    <fieldset className="space-y-4" aria-label="Contexto clínico">
      <legend className="text-base font-semibold text-slate-900">
        Selecciona el contexto clínico para aplicar la guía correcta.
      </legend>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label
          className={`flex cursor-pointer items-start gap-3 rounded-lg border p-4 shadow-sm ${context === "incidental" ? "border-primary bg-blue-50 ring-1 ring-primary/40" : "border-slate-200"}`}
        >
          <input
            type="radio"
            value="incidental"
            aria-label="Incidental (Fleischner 2017)"
            {...register("clinicalContext")}
          />
          <div>
            <div className="font-semibold text-slate-900">Incidental (Fleischner 2017)</div>
            <p className="text-sm text-slate-600">
              Pacientes ≥35 años, hallazgo casual. Requiere riesgo bajo/alto.
            </p>
          </div>
        </label>
        <label
          className={`flex cursor-pointer items-start gap-3 rounded-lg border p-4 shadow-sm ${context === "screening" ? "border-primary bg-blue-50 ring-1 ring-primary/40" : "border-slate-200"}`}
        >
          <input
            type="radio"
            value="screening"
            aria-label="Screening (Lung-RADS v2022)"
            {...register("clinicalContext")}
          />
          <div>
            <div className="font-semibold text-slate-900">Screening (Lung-RADS v2022)</div>
            <p className="text-sm text-slate-600">
              Programas de cribado de alto riesgo; requiere tipo de scan baseline/follow-up.
            </p>
          </div>
        </label>
      </div>
    </fieldset>
  );
}
