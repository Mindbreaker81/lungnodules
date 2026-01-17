"use client";

import { useState } from "react";
import { AssessmentResult, calculateLungRadsGrowth } from "@lib/algorithms";
import { AssessmentInput } from "@lib/schemas/noduleInput";
import {
  getPredictiveSummaries,
  getRecommendedPredictiveModel,
  PredictiveModelId,
  PredictiveModelSummary,
} from "@lib/predictive";
import { analytics } from "@lib/analytics";
import { DISCLAIMERS, APP_VERSION, GUIDELINE_VERSIONS } from "@config/guidelines";
import GuidelineVersion from "@components/GuidelineVersion";
import { Button } from "@components/ui/button";

interface Props {
  result: AssessmentResult | null;
  input?: AssessmentInput | null;
}

const NODULE_TYPE_LABELS: Record<string, string> = {
  solid: "Sólido",
  "ground-glass": "Vidrio esmerilado (GGN / no sólido)",
  "part-solid": "Parte-sólido (sub-sólido)",
};

const PREDICTIVE_MODEL_LABELS: Record<PredictiveModelId, string> = {
  mayo: "Mayo Clinic",
  brock: "Brock (Pan-Can)",
  herder: "Herder (post-PET)",
};

const PREDICTIVE_STATUS_LABELS: Record<PredictiveModelSummary["status"], string> = {
  available: "Calculado",
  insufficient_data: "Datos incompletos",
  not_applicable: "No aplica",
};

const PREDICTIVE_STATUS_STYLES: Record<PredictiveModelSummary["status"], string> = {
  available: "border-emerald-900/50 bg-emerald-900/20 text-emerald-200",
  insufficient_data: "border-amber-900/50 bg-amber-900/20 text-amber-200",
  not_applicable: "border-slate-700 bg-slate-900/40 text-slate-400",
};

const PREDICTIVE_RISK_LABELS: Record<NonNullable<PredictiveModelSummary["riskBand"]>, string> = {
  low: "Bajo",
  intermediate: "Intermedio",
  high: "Alto",
};

const formatNoduleType = (type: string) => NODULE_TYPE_LABELS[type] ?? type;
const formatProbability = (value: number) => `${(value * 100).toFixed(1)}%`;

function formatResultForCopy(result: AssessmentResult, input: AssessmentInput | null): string {
  const guidelineInfo =
    result.guideline === "fleischner-2017"
      ? GUIDELINE_VERSIONS.fleischner
      : GUIDELINE_VERSIONS.lungRads;
  const measurementContext = input?.clinicalContext;
  const formatMeasurement = (value: number) => {
    if (measurementContext === "incidental") {
      return Math.round(value).toString();
    }
    if (measurementContext === "screening") {
      return value.toFixed(1);
    }
    return value.toString();
  };
  const lines = [
    `LUNG NODULE ASSESSMENT REPORT`,
    `Generated: ${new Date().toISOString()}`,
    `Tool Version: ${APP_VERSION}`,
    ``,
    `GUIDELINE: ${guidelineInfo.label} (v${guidelineInfo.version})`,
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
      `  Nodule Type: ${formatNoduleType(input.nodule.type)}`,
      `  Diameter: ${formatMeasurement(input.nodule.diameterMm)}mm`,
      input.nodule.solidComponentMm !== undefined
        ? `  Solid Component: ${formatMeasurement(input.nodule.solidComponentMm)}mm`
        : null,
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
  const [showPredictive, setShowPredictive] = useState(false);

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

  const guidelineInfo =
    result.guideline === "fleischner-2017"
      ? GUIDELINE_VERSIONS.fleischner
      : GUIDELINE_VERSIONS.lungRads;
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
  const measurementNote =
    input?.clinicalContext === "incidental"
      ? "Fleischner: medición redondeada al mm; crecimiento significativo ≥2 mm."
      : null;
  const hasMultiple = input?.nodule.isMultiple;
  const predictiveSummaries = input ? getPredictiveSummaries(input) : [];
  const recommendedModel = input ? getRecommendedPredictiveModel(input) : null;
  const recommendedSummary = predictiveSummaries.find((summary) => summary.id === recommendedModel);

  return (
    <section
      className="space-y-4 rounded-xl border border-slate-700 bg-surface p-4 shadow-sm"
      aria-live="polite"
      aria-label="Resultados de la evaluación"
    >
      <header className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-400">Guía</p>
          <h2 className="text-lg font-semibold text-white">{guidelineInfo.label}</h2>
          <GuidelineVersion guideline={result.guideline} compact showLabel={false} />
        </div>
        <div className="rounded-md bg-primary/20 border border-primary/50 px-3 py-1 text-sm font-semibold text-primary" aria-label="Categoría asignada">
          {result.category}
        </div>
      </header>

      <div className="space-y-1">
        <p className="text-sm text-slate-400">Recomendación</p>
        <p className="text-lg font-semibold text-white">{result.recommendation}</p>
        <p className="text-sm text-slate-300">Intervalo: {result.followUpInterval}</p>
        {result.imagingModality && <p className="text-sm text-slate-300">Modalidad: {result.imagingModality}</p>}
        {result.malignancyRisk && <p className="text-sm text-slate-300">Riesgo estimado: {result.malignancyRisk}</p>}
        {growthLabel && (
          <p
            className={`text-sm ${isGrowing ? "text-amber-400" : "text-emerald-400"}`}
            aria-label="Estado de crecimiento"
          >
            {growthLabel}
          </p>
        )}
        {measurementNote && <p className="text-sm text-slate-400">{measurementNote}</p>}
        {hasMultiple && (
          <p className="text-sm text-slate-300">
            Múltiples nódulos: recomendaciones aplican al nódulo dominante; evaluar el resto con la misma guía.
          </p>
        )}
      </div>

      <div className="space-y-1">
        <p className="text-sm text-slate-400">Racional</p>
        <p className="text-sm text-slate-300">{result.rationale}</p>
      </div>

      {result.warnings && result.warnings.length > 0 && (
        <div className="rounded-md border border-amber-900/50 bg-amber-900/20 p-3 text-sm text-amber-200" role="alert">
          <p className="font-semibold">Warnings</p>
          <ul className="list-disc space-y-1 pl-5">
            {result.warnings.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="rounded-lg border border-slate-700/60 bg-slate-900/40 p-3">
        <button
          type="button"
          onClick={() => setShowPredictive((prev) => !prev)}
          className="flex w-full items-center justify-between text-left text-sm font-medium text-slate-200"
        >
          <span>Modelos predictivos (beta)</span>
          <span className="text-slate-400">{showPredictive ? "Ocultar" : "Ver"}</span>
        </button>
        {showPredictive && (
          <div className="mt-3 space-y-3">
            {recommendedSummary && (
              <p className="text-sm text-slate-300">
                Modelo recomendado por contexto: <span className="font-semibold text-white">{recommendedSummary.label}</span>
                {recommendedSummary.probability !== undefined && recommendedSummary.riskBand && (
                  <span className="ml-2 text-xs text-slate-400">
                    ({formatProbability(recommendedSummary.probability)} · {PREDICTIVE_RISK_LABELS[recommendedSummary.riskBand]})
                  </span>
                )}
              </p>
            )}
            <div className="space-y-3">
              {predictiveSummaries.map((summary) => (
                <div key={summary.id} className="rounded-md border border-slate-700/60 bg-slate-950/40 p-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-white">{summary.label}</p>
                    <span className={`rounded-full border px-2 py-0.5 text-xs ${PREDICTIVE_STATUS_STYLES[summary.status]}`}>
                      {PREDICTIVE_STATUS_LABELS[summary.status]}
                    </span>
                  </div>
                  {summary.probability !== undefined && summary.riskBand && (
                    <p className="mt-2 text-sm text-slate-200">
                      Probabilidad: <span className="font-semibold text-white">{formatProbability(summary.probability)}</span>
                      <span className="ml-2 text-xs text-slate-400">{PREDICTIVE_RISK_LABELS[summary.riskBand]}</span>
                    </p>
                  )}
                  {summary.preTestProbability !== undefined && summary.preTestModelId && (
                    <p className="mt-2 text-xs text-slate-400">
                      Pre-test ({PREDICTIVE_MODEL_LABELS[summary.preTestModelId]}): {formatProbability(summary.preTestProbability)}
                    </p>
                  )}
                  {summary.reason && (
                    <p className="mt-2 text-xs text-slate-400">{summary.reason}</p>
                  )}
                  {summary.missingFields && summary.missingFields.length > 0 && (
                    <div className="mt-2 text-xs text-slate-400">
                      <p className="font-medium text-slate-300">Campos requeridos:</p>
                      <ul className="mt-1 list-disc space-y-1 pl-4">
                        {summary.missingFields.map((field) => (
                          <li key={field}>{field}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {summary.notes && summary.notes.length > 0 && (
                    <ul className="mt-2 text-xs text-slate-400">
                      {summary.notes.map((note) => (
                        <li key={note}>• {note}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
            <p className="text-xs text-slate-500">
              Modelos calculados con coeficientes publicados (Mayo/Brock/Herder). Verifica la aplicabilidad clínica y
              complementa con juicio médico.
            </p>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 rounded-md border border-slate-700 bg-slate-800/50 p-3 text-xs text-slate-400">
          ⚠️ MEDICAL DISCLAIMER: Decision support only; verificar contra guías actuales. No aplica a &lt;35 años,
          inmunocomprometidos o cáncer conocido.
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          aria-label="Copiar recomendación"
          onClick={handleCopy}
          className={copyStatus === 'copied' ? 'bg-green-900/20 text-green-400 border-green-800' : copyStatus === 'error' ? 'bg-red-900/20 text-red-400 border-red-800' : ''}
        >
          {copyStatus === 'copied' ? '✓ Copiado' : copyStatus === 'error' ? 'Error' : 'Copiar'}
        </Button>
      </div>
    </section>
  );
}
