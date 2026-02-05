'use client';

import { useState } from 'react';
import { AssessmentResult } from '@lib/algorithms/types';
import { AssessmentInput } from '@lib/schemas/noduleInput';
import {
  getPredictiveSummaries,
  getRecommendedPredictiveModel,
  PredictiveModelId,
  PredictiveModelSummary,
} from '@lib/predictive';
import { analytics } from '@lib/analytics';
import { DISCLAIMERS, APP_VERSION, GUIDELINE_VERSIONS } from '@config/guidelines';
import GuidelineVersion from '@components/GuidelineVersion';
import { Button } from '@components/ui/button';

interface ExportResultsProps {
  result: AssessmentResult;
  input: AssessmentInput | null;
}

type ExportFormat = 'txt' | 'json' | 'clipboard';

const NODULE_TYPE_LABELS: Record<string, string> = {
  solid: 'Sólido',
  'ground-glass': 'Vidrio deslustrado (GGN / no sólido)',
  'part-solid': 'Semi-sólido',
};

const PREDICTIVE_MODEL_LABELS: Record<PredictiveModelId, string> = {
  mayo: 'Mayo Clinic',
  brock: 'Brock (Pan-Can)',
  herder: 'Herder (post-PET)',
};

const PREDICTIVE_STATUS_LABELS: Record<PredictiveModelSummary['status'], string> = {
  available: 'Calculado',
  insufficient_data: 'Datos incompletos',
  not_applicable: 'No aplica',
};

const PREDICTIVE_RISK_LABELS: Record<NonNullable<PredictiveModelSummary['riskBand']>, string> = {
  low: 'Bajo',
  intermediate: 'Intermedio',
  high: 'Alto',
};

const formatNoduleType = (type: string) => NODULE_TYPE_LABELS[type] ?? type;
const formatProbability = (value: number) => `${(value * 100).toFixed(1)}%`;

function formatAsText(result: AssessmentResult, input: AssessmentInput | null): string {
  const guidelineInfo = result.guideline === 'fleischner-2017'
    ? GUIDELINE_VERSIONS.fleischner
    : GUIDELINE_VERSIONS.lungRads;
  const measurementContext = input?.clinicalContext;
  const formatMeasurement = (value: number) => {
    if (measurementContext === 'incidental') {
      return Math.round(value).toString();
    }
    if (measurementContext === 'screening') {
      return value.toFixed(1);
    }
    return value.toString();
  };

  const lines = [
    '═'.repeat(60),
    'REPORTE DE EVALUACIÓN DE NÓDULO PULMONAR',
    '═'.repeat(60),
    '',
    `Generado: ${new Date().toLocaleString()}`,
    `Versión de Herramienta: ${APP_VERSION}`,
    `Guía: ${guidelineInfo.label} (v${guidelineInfo.version})`,
    '',
    '─'.repeat(60),
    'RESULTADO DE EVALUACIÓN',
    '─'.repeat(60),
    '',
    `Categoría: ${result.category}`,
    `Recomendación: ${result.recommendation}`,
    `Intervalo de Seguimiento: ${result.followUpInterval}`,
    result.imagingModality ? `Modalidad de Imagen: ${result.imagingModality}` : null,
    result.malignancyRisk ? `Riesgo Estimado de Malignidad: ${result.malignancyRisk}` : null,
    '',
    `Racional: ${result.rationale}`,
  ].filter(Boolean);

  if (result.warnings && result.warnings.length > 0) {
    lines.push('', '─'.repeat(60), 'ADVERTENCIAS', '─'.repeat(60), '');
    result.warnings.forEach(w => lines.push(`  ⚠ ${w}`));
  }

  if (input) {
    lines.push(
      '',
      '─'.repeat(60),
      'PARÁMETROS DE ENTRADA',
      '─'.repeat(60),
      '',
      `Contexto Clínico: ${input.clinicalContext === 'incidental' ? 'Hallazgo Incidental' : 'Cribado Cáncer Pulmón'}`,
      `Edad del Paciente: ${input.patient.age} años`,
      input.patient.riskLevel ? `Nivel de Riesgo: ${input.patient.riskLevel}` : null,
      '',
      `Tipo de Nódulo: ${formatNoduleType(input.nodule.type)}`,
      `Diámetro: ${formatMeasurement(input.nodule.diameterMm)} mm`,
      input.nodule.solidComponentMm !== undefined
        ? `Componente Sólido: ${formatMeasurement(input.nodule.solidComponentMm)} mm`
        : null,
      `Nódulos Múltiples: ${input.nodule.isMultiple ? 'Sí' : 'No'}`,
    );

    const predictiveSummaries = getPredictiveSummaries(input);
    if (predictiveSummaries.length > 0) {
      lines.push('', '─'.repeat(60), 'MODELOS PREDICTIVOS', '─'.repeat(60), '');
      predictiveSummaries.forEach((summary) => {
        lines.push(`${summary.label}: ${PREDICTIVE_STATUS_LABELS[summary.status]}`);
        if (summary.probability !== undefined && summary.riskBand) {
          lines.push(
            `  Probabilidad: ${formatProbability(summary.probability)} (${PREDICTIVE_RISK_LABELS[summary.riskBand]})`
          );
        }
        if (summary.preTestProbability !== undefined && summary.preTestModelId) {
          lines.push(
            `  Pre-test (${PREDICTIVE_MODEL_LABELS[summary.preTestModelId]}): ${formatProbability(summary.preTestProbability)}`
          );
        }
        if (summary.reason) {
          lines.push(`  Nota: ${summary.reason}`);
        }
        if (summary.missingFields && summary.missingFields.length > 0) {
          lines.push(`  Faltante: ${summary.missingFields.join(', ')}`);
        }
        if (summary.notes && summary.notes.length > 0) {
          summary.notes.forEach((note) => lines.push(`  • ${note}`));
        }
        lines.push('');
      });
    }
  }

  lines.push(
    '',
    '═'.repeat(60),
    'AVISO LEGAL',
    '═'.repeat(60),
    '',
    DISCLAIMERS.general,
    '',
    '─'.repeat(60),
    `Referencia: ${guidelineInfo.citation}`,
    '═'.repeat(60),
  );

  return lines.filter(Boolean).join('\n');
}

function formatAsJSON(result: AssessmentResult, input: AssessmentInput | null): string {
  const guidelineInfo = result.guideline === 'fleischner-2017'
    ? GUIDELINE_VERSIONS.fleischner
    : GUIDELINE_VERSIONS.lungRads;
  const predictiveSummaries = input ? getPredictiveSummaries(input) : [];
  const recommendedModel = input ? getRecommendedPredictiveModel(input) : null;

  return JSON.stringify({
    metadata: {
      generatedAt: new Date().toISOString(),
      toolVersion: APP_VERSION,
      guideline: {
        id: result.guideline,
        label: guidelineInfo.label,
        version: guidelineInfo.version,
        citation: guidelineInfo.citation,
      },
    },
    result: {
      category: result.category,
      recommendation: result.recommendation,
      followUpInterval: result.followUpInterval,
      imagingModality: result.imagingModality,
      malignancyRisk: result.malignancyRisk,
      rationale: result.rationale,
      warnings: result.warnings,
    },
    input: input ? {
      clinicalContext: input.clinicalContext,
      patient: input.patient,
      nodule: input.nodule,
    } : null,
    predictive: input ? {
      recommendedModel,
      summaries: predictiveSummaries,
    } : null,
    disclaimer: DISCLAIMERS.general,
  }, null, 2);
}

export default function ExportResults({ result, input }: ExportResultsProps) {
  const [exportStatus, setExportStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [isOpen, setIsOpen] = useState(false);

  const handleExport = async (format: ExportFormat) => {
    try {
      const content = format === 'json'
        ? formatAsJSON(result, input)
        : formatAsText(result, input);

      if (format === 'clipboard') {
        await navigator.clipboard.writeText(content);
        analytics.resultCopied(result.guideline, result.category);
      } else {
        const blob = new Blob([content], {
          type: format === 'json' ? 'application/json' : 'text/plain'
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `lung-nodule-assessment-${new Date().toISOString().split('T')[0]}.${format}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        analytics.resultExported(result.guideline, result.category);
      }

      setExportStatus('success');
      setTimeout(() => {
        setExportStatus('idle');
        setIsOpen(false);
      }, 1500);
    } catch {
      setExportStatus('error');
      analytics.errorDisplayed('export', `Failed to export as ${format}`);
      setTimeout(() => setExportStatus('idle'), 2000);
    }
  };

  return (
    <div className="relative">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className={exportStatus === 'success' ? 'bg-green-50 text-green-700 border-green-300' : ''}
      >
        {exportStatus === 'success' ? '✓ Exportado' : 'Exportar'}
      </Button>

      {isOpen && (
        <div className="absolute right-0 top-full z-10 mt-2 w-64 rounded-md border border-slate-700 bg-surface shadow-lg">
          <div className="border-b border-slate-700 px-3 py-2">
            <GuidelineVersion guideline={result.guideline} compact />
          </div>
          <div className="p-1">
            <button
              onClick={() => handleExport('clipboard')}
              className="flex w-full items-center gap-2 rounded px-3 py-2 text-sm text-slate-100 hover:bg-slate-800"
            >
              <span>📋</span>
              Copiar al portapapeles
            </button>
            <button
              onClick={() => handleExport('txt')}
              className="flex w-full items-center gap-2 rounded px-3 py-2 text-sm text-slate-100 hover:bg-slate-800"
            >
              <span>📄</span>
              Descargar como .txt
            </button>
            <button
              onClick={() => handleExport('json')}
              className="flex w-full items-center gap-2 rounded px-3 py-2 text-sm text-slate-100 hover:bg-slate-800"
            >
              <span>📊</span>
              Descargar como .json
            </button>
          </div>
        </div>
      )}

      {isOpen && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}
