"use client";

import { useFormContext } from "react-hook-form";
import { AssessmentInput } from "@lib/schemas/noduleInput";
import { RISK_FACTOR_TOOLTIP } from "@config/guidelines";
import { Input } from "@components/ui/input";

interface Props {
  clinicalContext: "incidental" | "screening";
}

export default function RiskStep({ clinicalContext }: Props) {
  const { register, watch } = useFormContext<AssessmentInput>();
  const scanType = watch("nodule.scanType");

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
        </div>
      )}
    </div>
  );
}
