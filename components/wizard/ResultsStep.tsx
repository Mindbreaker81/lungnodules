"use client";

import { AssessmentResult, calculateLungRadsGrowth } from "@lib/algorithms";
import { AssessmentInput } from "@lib/schemas/noduleInput";
import { Button } from "@components/ui/button";

interface Props {
  result: AssessmentResult | null;
  input?: AssessmentInput | null;
}

export default function ResultsStep({ result, input }: Props) {
  if (!result) {
    return <p className="text-slate-600" aria-live="polite">Completa los pasos para ver la recomendación.</p>;
  }

  const isScreening = input?.clinicalContext === "screening";
  const scanType = isScreening ? input?.nodule.scanType : undefined;
  const isFollowUp = scanType === "follow-up";
  const isGrowing =
    isFollowUp && input
      ? calculateLungRadsGrowth(input.nodule.diameterMm, input.nodule.priorDiameterMm, input.nodule.priorScanMonthsAgo)
      : false;
  const growthLabel = isFollowUp ? (isGrowing ? "Crecimiento detectado (>1.5mm/12m)" : "Sin crecimiento significativo") : null;
  const hasMultiple = input?.nodule.isMultiple;

  return (
    <section
      className="space-y-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
      aria-live="polite"
      aria-label="Resultados de la evaluación"
    >
      <header className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">Guía</p>
          <h2 className="text-lg font-semibold text-slate-900">{result.guideline}</h2>
        </div>
        <div className="rounded-md bg-primary px-3 py-1 text-sm font-semibold text-white" aria-label="Categoría asignada">
          {result.category}
        </div>
      </header>

      <div className="space-y-1">
        <p className="text-sm text-slate-500">Recomendación</p>
        <p className="text-lg font-semibold text-slate-900">{result.recommendation}</p>
        <p className="text-sm text-slate-700">Intervalo: {result.followUpInterval}</p>
        {result.imagingModality && <p className="text-sm text-slate-700">Modalidad: {result.imagingModality}</p>}
        {result.malignancyRisk && <p className="text-sm text-slate-700">Riesgo estimado: {result.malignancyRisk}</p>}
        {growthLabel && (
          <p
            className={`text-sm ${isGrowing ? "text-amber-800" : "text-emerald-700"}`}
            aria-label="Estado de crecimiento"
          >
            {growthLabel}
          </p>
        )}
        {hasMultiple && (
          <p className="text-sm text-slate-700">
            Múltiples nódulos: recomendaciones aplican al nódulo dominante; evaluar el resto con la misma guía.
          </p>
        )}
      </div>

      <div className="space-y-1">
        <p className="text-sm text-slate-500">Racional</p>
        <p className="text-sm text-slate-800">{result.rationale}</p>
      </div>

      {result.warnings && result.warnings.length > 0 && (
        <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800" role="alert">
          <p className="font-semibold">Warnings</p>
          <ul className="list-disc space-y-1 pl-5">
            {result.warnings.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="rounded-md border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
          ⚠️ MEDICAL DISCLAIMER: Decision support only; verificar contra guías actuales. No aplica a &lt;35 años,
          inmunocomprometidos o cáncer conocido.
        </div>
        {/* Placeholder para futura acción de copiar/exportar */}
        <Button type="button" variant="outline" size="sm" aria-label="Copiar recomendación" disabled>
          Copiar (próx.)
        </Button>
      </div>
    </section>
  );
}
