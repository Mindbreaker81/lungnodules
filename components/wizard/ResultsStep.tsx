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
import { UI_TEXTS } from "@config/i18n";
import GuidelineVersion from "@components/GuidelineVersion";
import { Button } from "@components/ui/button";

interface Props {
  result: AssessmentResult | null;
  input?: AssessmentInput | null;
}

const NODULE_TYPE_LABELS: Record<string, string> = {
  solid: "Sólido",
  "ground-glass": "Vidrio deslustrado (GGN / no sólido)",
  "part-solid": "Semi-sólido",
};

const PREDICTIVE_MODEL_LABELS: Record<PredictiveModelId, string> = {
  mayo: "Mayo Clinic",
  brock: "Brock (Pan-Can)",
  herder: "Herder (BTS · LR)",
  "herder-logistic": "Herder (logístico · 2005)",
};

const PREDICTIVE_STATUS_LABELS: Record<PredictiveModelSummary["status"], string> = {
  available: "Calculado",
  insufficient_data: "Datos incompletos",
  not_applicable: "No aplica",
};

const PREDICTIVE_STATUS_STYLES: Record<PredictiveModelSummary["status"], string> = {
  available: "border-success/50 bg-success/20 text-success",
  insufficient_data: "border-warning/50 bg-warning/20 text-foreground",
  not_applicable: "border-border bg-muted/40 text-muted-foreground",
};

const PREDICTIVE_RISK_LABELS: Record<NonNullable<PredictiveModelSummary["riskBand"]>, string> = {
  low: "Bajo",
  intermediate: "Intermedio",
  high: "Alto",
};

const formatNoduleType = (type: string) => NODULE_TYPE_LABELS[type] ?? type;
const formatProbability = (value: number) => `${(value * 100).toFixed(1)}%`;
const hasNumber = (value: unknown): value is number => typeof value === "number" && !Number.isNaN(value);

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
    `REPORTE DE EVALUACIÓN DE NÓDULO PULMONAR`,
    `Generado: ${new Date().toISOString()}`,
    `Versión de Herramienta: ${APP_VERSION}`,
    ``,
    `GUÍA: ${guidelineInfo.label} (v${guidelineInfo.version})`,
    `CATEGORÍA: ${result.category}`,
    ``,
    `RECOMENDACIÓN: ${result.recommendation}`,
    `INTERVALO DE SEGUIMIENTO: ${result.followUpInterval}`,
    result.imagingModality ? `MODALIDAD DE IMAGEN: ${result.imagingModality}` : null,
    result.malignancyRisk ? `RIESGO ESTIMADO DE MALIGNIDAD: ${result.malignancyRisk}` : null,
    ``,
    `RACIONAL: ${result.rationale}`,
  ].filter(Boolean);

  if (result.warnings && result.warnings.length > 0) {
    lines.push(``, `ADVERTENCIAS:`);
    result.warnings.forEach(w => lines.push(`  - ${w}`));
  }

  if (input) {
    lines.push(
      ``,
      `DATOS DE ENTRADA:`,
      `  Contexto: ${input.clinicalContext}`,
      `  Tipo de Nódulo: ${formatNoduleType(input.nodule.type)}`,
      hasNumber(input.nodule.diameterMm) ? `  Diámetro: ${formatMeasurement(input.nodule.diameterMm)}mm` : null,
      input.nodule.solidComponentMm !== undefined
        ? `  Componente Sólido: ${formatMeasurement(input.nodule.solidComponentMm)}mm`
        : null,
      `  Múltiple: ${input.nodule.isMultiple ? 'Sí' : 'No'}`,
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
    return <p className="text-muted-foreground" aria-live="polite">Completa los pasos para ver la recomendación.</p>;
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
    isFollowUp &&
    screeningInput &&
    hasNumber(screeningInput.nodule.diameterMm)
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
      className="space-y-4 rounded-xl border border-border bg-card p-4 shadow-sm"
      aria-live="polite"
      aria-label="Resultados de la evaluación"
    >
      <header className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Guía</p>
          <h2 className="text-lg font-semibold text-card-foreground">{guidelineInfo.label}</h2>
          <GuidelineVersion guideline={result.guideline} compact showLabel={false} />
        </div>
        <div className="rounded-md bg-primary/20 border border-primary/50 px-3 py-1 text-sm font-semibold text-primary" aria-label="Categoría asignada">
          {result.category}
        </div>
      </header>

      <div className="space-y-1">
        <p className="text-sm text-muted-foreground">Recomendación</p>
        <p className="text-lg font-semibold text-card-foreground">{result.recommendation}</p>
        <p className="text-sm text-card-foreground">Intervalo: {result.followUpInterval}</p>
        {result.imagingModality && <p className="text-sm text-card-foreground">Modalidad: {result.imagingModality}</p>}
        {result.malignancyRisk && <p className="text-sm text-card-foreground">Riesgo estimado: {result.malignancyRisk}</p>}
        {growthLabel && (
          <p
            className={`text-sm ${isGrowing ? "text-warning" : "text-success"}`}
            aria-label="Estado de crecimiento"
          >
            {growthLabel}
          </p>
        )}
        {measurementNote && <p className="text-sm text-muted-foreground">{measurementNote}</p>}
        {hasMultiple && (
          <p className="text-sm text-card-foreground">
            Múltiples nódulos: recomendaciones aplican al nódulo dominante; evaluar el resto con la misma guía.
          </p>
        )}
      </div>

      <div className="space-y-1">
        <p className="text-sm text-muted-foreground">Racional</p>
        <p className="text-sm text-card-foreground">{result.rationale}</p>
      </div>

      {result.warnings && result.warnings.length > 0 && (
        <div className="rounded-md border border-warning/50 bg-warning/20 p-3 text-sm text-foreground" role="alert">
          <p className="font-semibold">Advertencias</p>
          <ul className="list-disc space-y-1 pl-5">
            {result.warnings.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="rounded-lg border border-border bg-muted/40 p-3">
        <button
          type="button"
          onClick={() => setShowPredictive((prev) => !prev)}
          className="flex w-full items-center justify-between text-left text-sm font-medium text-foreground"
        >
          <span>{UI_TEXTS.results.predictiveModels.title}</span>
          <span className="text-muted-foreground">{showPredictive ? UI_TEXTS.results.predictiveModels.hide : UI_TEXTS.results.predictiveModels.show}</span>
        </button>
        {showPredictive && (
          <div className="mt-3 space-y-3">
            {recommendedSummary && (
              <p className="text-sm text-card-foreground">
                Modelo recomendado por contexto: <span className="font-semibold text-card-foreground">{recommendedSummary.label}</span>
                {recommendedSummary.probability !== undefined && recommendedSummary.riskBand && (
                  <span className="ml-2 text-xs text-muted-foreground">
                    ({formatProbability(recommendedSummary.probability)} · {PREDICTIVE_RISK_LABELS[recommendedSummary.riskBand]})
                  </span>
                )}
              </p>
            )}
            <div className="space-y-3">
              {predictiveSummaries.map((summary) => (
                <div key={summary.id} className="rounded-md border border-border bg-muted/40 p-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-card-foreground">{summary.label}</p>
                    <span className={`rounded-full border px-2 py-0.5 text-xs ${PREDICTIVE_STATUS_STYLES[summary.status]}`}>
                      {PREDICTIVE_STATUS_LABELS[summary.status]}
                    </span>
                  </div>
                  {summary.probability !== undefined && summary.riskBand && (
                    <>
                      <p className="mt-2 text-sm text-foreground">
                        {UI_TEXTS.results.predictiveModels.probability}: <span className="font-semibold text-card-foreground">{formatProbability(summary.probability)}</span>
                        <span className="ml-2 text-xs text-muted-foreground">{PREDICTIVE_RISK_LABELS[summary.riskBand]}</span>
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        <span className="font-semibold text-foreground">Sugerencia clínica: </span>
                        {summary.riskBand === 'low' && "Riesgo bajo (<5%). Se sugiere vigilancia activa con TC (watchful waiting)."}
                        {summary.riskBand === 'intermediate' && "Riesgo intermedio (5-65%). Considerar PET-CT o biopsia no quirúrgica."}
                        {summary.riskBand === 'high' && "Riesgo alto (>65%). Considerar evaluación para biopsia quirúrgica o escisión."}
                      </p>
                    </>
                  )}
                  {summary.preTestProbability !== undefined && summary.preTestModelId && (
                    <p className="mt-2 text-xs text-muted-foreground">
                      {UI_TEXTS.results.predictiveModels.preTest} ({PREDICTIVE_MODEL_LABELS[summary.preTestModelId]}): {formatProbability(summary.preTestProbability)}
                    </p>
                  )}
                  {summary.reason && (
                    <p className="mt-2 text-xs text-muted-foreground">{summary.reason}</p>
                  )}
                  {summary.missingFields && summary.missingFields.length > 0 && (
                    <div className="mt-2 text-xs text-muted-foreground">
                      <p className="font-medium text-foreground">{UI_TEXTS.results.predictiveModels.missingFields}</p>
                      <ul className="mt-1 list-disc space-y-1 pl-4">
                        {summary.missingFields.map((field) => (
                          <li key={field}>{field}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {summary.notes && summary.notes.length > 0 && (
                    <ul className="mt-2 text-xs text-muted-foreground">
                      {summary.notes.map((note) => (
                        <li key={note}>• {note}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              {UI_TEXTS.results.predictiveModels.disclaimer}
            </p>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex-1 rounded-md border border-border bg-muted/50 p-3 text-xs text-muted-foreground">
          {UI_TEXTS.results.medicalDisclaimer}
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          aria-label="Copiar recomendación"
          onClick={handleCopy}
          className={`shrink-0 ${copyStatus === 'copied' ? 'bg-success/20 text-success border-success/50' : copyStatus === 'error' ? 'bg-destructive/20 text-destructive border-destructive/50' : ''}`}
        >
          {copyStatus === 'copied' ? UI_TEXTS.results.copyButton.copied : copyStatus === 'error' ? UI_TEXTS.results.copyButton.error : UI_TEXTS.results.copyButton.idle}
        </Button>
      </div>
    </section>
  );
}
