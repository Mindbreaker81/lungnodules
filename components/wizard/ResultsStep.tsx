"use client";

import { useState } from "react";
import { AssessmentResult, calculateLungRadsGrowth } from "@lib/algorithms";
import { AssessmentInput } from "@lib/schemas/noduleInput";
import { analytics } from "@lib/analytics";
import { DISCLAIMERS, APP_VERSION, GUIDELINE_VERSIONS } from "@config/guidelines";
import { Button } from "@components/ui/button";

interface Props {
  result: AssessmentResult | null;
  input?: AssessmentInput | null;
}

function formatResultForCopy(result: AssessmentResult, input: AssessmentInput | null): string {
  const lines = [
    `LUNG NODULE ASSESSMENT REPORT`,
    `Generated: ${new Date().toISOString()}`,
    `Tool Version: ${APP_VERSION}`,
    ``,
    `GUIDELINE: ${result.guideline === 'fleischner-2017'
      ? GUIDELINE_VERSIONS.fleischner.label
      : GUIDELINE_VERSIONS.lungRads.label}`,
    `CATEGORY: ${result.category}`,
    ``,
    `RECOMMENDATION: ${result.recommendation}`,
    `FOLLOW-UP INTERVAL: ${result.followUpInterval}`,
    result.imagingModality ? `IMAGING MODALITY: ${result.imagingModality}` : null,
    result.malignancyRisk ? `ESTIMATED MALIGNANCY RISK: ${result.malignancyRisk}` : null,
    ``,
    `RATIONALE: ${result.rationale}`,
  ].filter(Boolean);

  if (result.warnings && result.warnings.length > 0) {
    lines.push(``, `WARNINGS:`);
    result.warnings.forEach(w => lines.push(`  - ${w}`));
  }

  if (input) {
    lines.push(
      ``,
      `INPUT DATA:`,
      `  Context: ${input.clinicalContext}`,
      `  Nodule Type: ${input.nodule.type}`,
      `  Diameter: ${input.nodule.diameterMm}mm`,
      input.nodule.solidComponentMm ? `  Solid Component: ${input.nodule.solidComponentMm}mm` : null,
      `  Multiple: ${input.nodule.isMultiple ? 'Yes' : 'No'}`,
    );
  }

  lines.push(
    ``,
    `---`,
    DISCLAIMERS.export,
  );

  return lines.filter(Boolean).join('\n');
}

export default function ResultsStep({ result, input }: Props) {
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied' | 'error'>('idle');

  if (!result) {
    return <p className="text-slate-600" aria-live="polite">Completa los pasos para ver la recomendación.</p>;
  }

  const handleCopy = async () => {
    try {
      const text = formatResultForCopy(result, input ?? null);
      await navigator.clipboard.writeText(text);
      setCopyStatus('copied');
      analytics.resultCopied(result.guideline, result.category);
      setTimeout(() => setCopyStatus('idle'), 2000);
    } catch {
      setCopyStatus('error');
      analytics.errorDisplayed('clipboard', 'Failed to copy to clipboard');
      setTimeout(() => setCopyStatus('idle'), 2000);
    }
  };

  const screeningInput = input && input.clinicalContext === "screening" ? input : undefined;
  const isFollowUp = screeningInput?.nodule.scanType === "follow-up";
  const isGrowing =
    isFollowUp && screeningInput
      ? calculateLungRadsGrowth(
        screeningInput.nodule.diameterMm,
        screeningInput.nodule.priorDiameterMm,
        screeningInput.nodule.priorScanMonthsAgo
      )
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

      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 rounded-md border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
          ⚠️ MEDICAL DISCLAIMER: Decision support only; verificar contra guías actuales. No aplica a &lt;35 años,
          inmunocomprometidos o cáncer conocido.
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          aria-label="Copiar recomendación"
          onClick={handleCopy}
          className={copyStatus === 'copied' ? 'bg-green-50 text-green-700 border-green-300' : copyStatus === 'error' ? 'bg-red-50 text-red-700 border-red-300' : ''}
        >
          {copyStatus === 'copied' ? '✓ Copiado' : copyStatus === 'error' ? 'Error' : 'Copiar'}
        </Button>
      </div>
    </section>
  );
}
