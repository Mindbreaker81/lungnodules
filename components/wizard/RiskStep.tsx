"use client";

import { useEffect } from "react";
import { useFormContext } from "react-hook-form";
import { AssessmentInput } from "@lib/schemas/noduleInput";
import { RISK_FACTOR_TOOLTIP } from "@config/guidelines";
import { Input } from "@components/ui/input";

interface Props {
  clinicalContext: "incidental" | "screening";
}

export default function RiskStep({ clinicalContext }: Props) {
  const { register, watch, setValue } = useFormContext<AssessmentInput>();
  const scanType = watch("nodule.scanType");
  const hasKnownMalignancy = watch("patient.hasKnownMalignancy");
  const isImmunocompromised = watch("patient.isImmunocompromised");
  const extrathoracicCancerHistory = watch("patient.extrathoracicCancerHistory");
  const hasExclusion = Boolean(hasKnownMalignancy || isImmunocompromised);

  useEffect(() => {
    if (clinicalContext === "screening" && scanType === "baseline") {
      setValue("priorCategory", undefined);
      setValue("priorStatus", undefined);
    }
  }, [clinicalContext, scanType, setValue]);

  return (
    <div className="space-y-4">
      {clinicalContext === "incidental" ? (
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-slate-300">Edad (años)</label>
            <Input
              type="number"
              min={0}
              aria-label="Edad del paciente"
              className="mt-1"
              {...register("patient.age", { valueAsNumber: true })}
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm text-slate-300">
              <span>Riesgo</span>
              <span className="text-xs text-slate-400">Tooltip: {RISK_FACTOR_TOOLTIP.split("\n")[0]}</span>
            </div>
            <div className="flex gap-3">
              <label className="flex items-center gap-2 text-white">
                <input type="radio" value="low" aria-label="Riesgo bajo" {...register("patient.riskLevel")} className="text-primary focus:ring-primary" /> Bajo
              </label>
              <label className="flex items-center gap-2 text-white">
                <input type="radio" value="high" aria-label="Riesgo alto" {...register("patient.riskLevel")} className="text-primary focus:ring-primary" /> Alto
              </label>
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-300">Exclusiones Fleischner</p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <label className="flex items-center gap-2 text-white">
                <input
                  type="checkbox"
                  aria-label="Cáncer conocido"
                  {...register("patient.hasKnownMalignancy")}
                  className="text-primary rounded focus:ring-primary"
                />
                Cáncer conocido
              </label>
              <label className="flex items-center gap-2 text-white">
                <input
                  type="checkbox"
                  aria-label="Inmunocompromiso"
                  {...register("patient.isImmunocompromised")}
                  className="text-primary rounded focus:ring-primary"
                />
                Inmunocompromiso
              </label>
            </div>
            {hasExclusion && (
              <div
                className="rounded-md border border-amber-900/50 bg-amber-900/20 p-3 text-sm text-amber-200"
                role="alert"
              >
                Fleischner no aplica en pacientes con cáncer conocido o inmunocompromiso. Usa guía clínica específica.
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-slate-300">Tipo de scan</label>
            <select
              className="mt-1 w-full rounded-md border border-slate-600 bg-transparent px-3 py-2 text-sm text-slate-100 shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              aria-label="Tipo de scan"
              {...register("nodule.scanType")}
            >
              <option value="baseline" className="bg-surface">Baseline</option>
              <option value="follow-up" className="bg-surface">Follow-up</option>
            </select>
          </div>
          {scanType === "follow-up" && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-slate-300">Diámetro previo (mm)</label>
                <Input
                  type="number"
                  min={0}
                  aria-label="Diámetro previo en mm"
                  className="mt-1"
                  {...register("nodule.priorDiameterMm", { valueAsNumber: true })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300">Meses desde scan previo</label>
                <Input
                  type="number"
                  min={0}
                  aria-label="Meses desde el scan previo"
                  className="mt-1"
                  {...register("nodule.priorScanMonthsAgo", { valueAsNumber: true })}
                />
              </div>
            </div>
          )}
          {scanType === "follow-up" && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-300">Stepped management (opcional)</p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-slate-300">Categoría previa</label>
                  <select
                    className="mt-1 w-full rounded-md border border-slate-600 bg-transparent px-3 py-2 text-sm text-slate-100"
                    aria-label="Categoría Lung-RADS previa"
                    defaultValue=""
                    {...register("priorCategory", { setValueAs: (value) => value || undefined })}
                  >
                    <option value="" className="bg-surface">Sin categoría previa</option>
                    <option value="0" className="bg-surface">0</option>
                    <option value="1" className="bg-surface">1</option>
                    <option value="2" className="bg-surface">2</option>
                    <option value="3" className="bg-surface">3</option>
                    <option value="4A" className="bg-surface">4A</option>
                    <option value="4B" className="bg-surface">4B</option>
                    <option value="4X" className="bg-surface">4X</option>
                    <option value="S" className="bg-surface">S</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300">Estado previo</label>
                  <select
                    className="mt-1 w-full rounded-md border border-slate-600 bg-transparent px-3 py-2 text-sm text-slate-100"
                    aria-label="Estado Lung-RADS previo"
                    defaultValue=""
                    {...register("priorStatus", { setValueAs: (value) => value || undefined })}
                  >
                    <option value="" className="bg-surface">Sin estado previo</option>
                    <option value="stable" className="bg-surface">Estable (step-down permitido)</option>
                    <option value="progression" className="bg-surface">Progresión</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="space-y-3 rounded-lg border border-slate-700/60 bg-slate-900/40 p-3">
        <p className="text-sm font-medium text-slate-300">Factores para modelos predictivos (opcional)</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-slate-300">Sexo</label>
            <select
              className="mt-1 w-full rounded-md border border-slate-600 bg-transparent px-3 py-2 text-sm text-slate-100"
              aria-label="Sexo del paciente"
              defaultValue=""
              {...register("patient.sex", { setValueAs: (value) => value || undefined })}
            >
              <option value="" className="bg-surface">Sin especificar</option>
              <option value="female" className="bg-surface">Femenino</option>
              <option value="male" className="bg-surface">Masculino</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300">Tabaquismo</label>
            <select
              className="mt-1 w-full rounded-md border border-slate-600 bg-transparent px-3 py-2 text-sm text-slate-100"
              aria-label="Estado de tabaquismo"
              defaultValue=""
              {...register("patient.smokingStatus", { setValueAs: (value) => value || undefined })}
            >
              <option value="" className="bg-surface">Sin especificar</option>
              <option value="never" className="bg-surface">Nunca fumador</option>
              <option value="former" className="bg-surface">Exfumador</option>
              <option value="current" className="bg-surface">Fumador actual</option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-slate-300">Cáncer extratorácico</label>
            <select
              className="mt-1 w-full rounded-md border border-slate-600 bg-transparent px-3 py-2 text-sm text-slate-100"
              aria-label="Historia de cáncer extratorácico"
              defaultValue=""
              {...register("patient.extrathoracicCancerHistory", { setValueAs: (value) => value || undefined })}
            >
              <option value="" className="bg-surface">Sin especificar</option>
              <option value="none" className="bg-surface">No</option>
              <option value="over5y" className="bg-surface">Sí, &gt;5 años</option>
              <option value="recent" className="bg-surface">Sí, &lt;5 años</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <label className="flex items-center gap-2 text-white">
            <input
              type="checkbox"
              aria-label="Antecedentes familiares de cáncer de pulmón"
              {...register("patient.hasFamilyHistoryLungCancer")}
              className="text-primary rounded focus:ring-primary"
            />
            Antecedentes familiares de cáncer de pulmón
          </label>
          <label className="flex items-center gap-2 text-white">
            <input
              type="checkbox"
              aria-label="Enfisema en TC"
              {...register("patient.hasEmphysema")}
              className="text-primary rounded focus:ring-primary"
            />
            Enfisema en TC
          </label>
        </div>
        {extrathoracicCancerHistory === "recent" && (
          <div className="rounded-md border border-amber-900/50 bg-amber-900/20 p-3 text-sm text-amber-200" role="alert">
            Mayo no aplica si el cáncer extratorácico fue diagnosticado en los últimos 5 años.
          </div>
        )}
      </div>
    </div>
  );
}
