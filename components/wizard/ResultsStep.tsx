"use client";

import { useState } from "react";
import { AssessmentResult, calculateLungRadsGrowthResult } from "@lib/algorithms";
import { AssessmentInput } from "@lib/schemas/noduleInput";
import { hasNumber, inputParameterLines } from "@lib/reportFormat";
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

const PREDICTIVE_MODEL_LABELS: Record<PredictiveModelId, string> = {
  mayo: "Mayo Clinic",
  brock: "Brock (Pan-Can)",
  herder: "Herder (2005)",
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

// ACCP 2013 pre-test bands (Mayo, Brock).
const PRE_TEST_SUGGESTIONS: Record<NonNullable<PredictiveModelSummary["riskBand"]>, string> = {
  low: "Riesgo bajo (<5%). Se sugiere vigilancia activa con TC (watchful waiting).",
  intermediate: "Riesgo intermedio (5-65%). Considerar PET-CT o biopsia no quirúrgica.",
  high: "Riesgo alto (>65%). Considerar evaluación para biopsia quirúrgica o escisión.",
};

// BTS 2015 post-PET bands (Herder).
const POST_PET_SUGGESTIONS: Record<NonNullable<PredictiveModelSummary["riskBand"]>, string> = {
  low: "Riesgo bajo tras PET (<10%). Considerar vigilancia con TC.",
  intermediate: "Riesgo intermedio tras PET (10-70%). Considerar biopsia guiada por imagen; alternativas: biopsia escisional o vigilancia según riesgo y preferencia.",
  high: "Riesgo alto tras PET (>70%). Ofrecer resección quirúrgica; tratamiento no quirúrgico si no es candidato.",
};

const formatProbability = (value: number) => `${(value * 100).toFixed(1)}%`;

export function formatResultForCopy(result: AssessmentResult, input: AssessmentInput | null): string {
  const guidelineInfo =
    result.guideline === "fleischner-2017"
      ? GUIDELINE_VERSIONS.fleischner
      : GUIDELINE_VERSIONS.lungRads;
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
      ...inputParameterLines(input).map((line) => `  ${line}`),
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
  const screeningNodule = screeningInput?.nodule;
  const isFollowUp = screeningNodule?.scanType === "follow-up";
  const describeGrowth = (growth: { isGrowing: boolean; isIntervalGrowth: boolean }) =>
    growth.isGrowing
      ? "Crecimiento detectado (>1,5 mm/12m)"
      : growth.isIntervalGrowth
        ? "Aumento en intervalo >12 meses (no cumple la definición de crecimiento ACR)"
        : "Sin crecimiento significativo";
  const growthLines: { text: string; highlight: boolean; label: string }[] = [];
  if (isFollowUp && screeningNodule && hasNumber(screeningNodule.diameterMm)) {
    if (screeningNodule.isNew) {
      growthLines.push({
        text: "Diámetro total: nódulo nuevo (sin medición previa)",
        highlight: true,
        label: "Estado de crecimiento",
      });
    } else {
      const totalGrowth = calculateLungRadsGrowthResult(
        screeningNodule.diameterMm,
        screeningNodule.priorDiameterMm,
        screeningNodule.priorScanMonthsAgo,
      );
      growthLines.push({
        text: `Diámetro total: ${describeGrowth(totalGrowth)}`,
        highlight: totalGrowth.isGrowing || totalGrowth.isIntervalGrowth,
        label: "Estado de crecimiento",
      });
      if (screeningNodule.type === "part-solid") {
        const priorSolid = screeningNodule.priorSolidComponentMm;
        const currentSolid = screeningNodule.solidComponentMm;
        if (priorSolid === undefined) {
          growthLines.push({
            text: "Componente sólido: sin medición previa",
            highlight: false,
            label: "Estado de crecimiento del componente sólido",
          });
        } else if (priorSolid === 0 && (currentSolid ?? 0) > 0) {
          growthLines.push({
            text: "Componente sólido: nuevo (apareció desde la medición previa)",
            highlight: true,
            label: "Estado de crecimiento del componente sólido",
          });
        } else if (currentSolid !== undefined) {
          const solidGrowth = calculateLungRadsGrowthResult(
            currentSolid,
            priorSolid,
            screeningNodule.priorScanMonthsAgo,
            true,
          );
          growthLines.push({
            text: `Componente sólido: ${describeGrowth(solidGrowth)}`,
            highlight: solidGrowth.isGrowing || solidGrowth.isIntervalGrowth,
            label: "Estado de crecimiento del componente sólido",
          });
        }
      }
    }
  }
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
        {growthLines.map((line) => (
          <p
            key={line.label}
            className={`text-sm ${line.highlight ? "text-warning" : "text-success"}`}
            aria-label={line.label}
          >
            {line.text}
          </p>
        ))}
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
                        {(summary.id === 'herder' ? POST_PET_SUGGESTIONS : PRE_TEST_SUGGESTIONS)[summary.riskBand]}
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
                  <details className="mt-2 text-xs text-muted-foreground">
                    <summary className="cursor-pointer font-medium text-foreground">
                      {UI_TEXTS.results.predictiveModels.howTitle}
                    </summary>
                    <dl className="mt-2 space-y-1">
                      {(["purpose", "variables", "method", "applicability"] as const).map((key) => (
                        <div key={key}>
                          <dt className="font-medium text-foreground">{UI_TEXTS.results.predictiveModels.labels[key]}</dt>
                          <dd>{UI_TEXTS.results.predictiveModels.explanations[summary.id][key]}</dd>
                        </div>
                      ))}
                    </dl>
                  </details>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              {UI_TEXTS.results.predictiveModels.riskBands}
            </p>
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
