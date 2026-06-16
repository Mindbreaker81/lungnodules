"use client";

import { useEffect } from "react";
import { useFormContext } from "react-hook-form";
import { AssessmentInput } from "@lib/schemas/noduleInput";
import { RISK_FACTORS, RISK_FACTOR_TOOLTIP } from "@config/guidelines";
import { Input } from "@components/ui/input";

interface Props {
  clinicalContext: "incidental" | "screening";
}

const parseOptionalNumber = (value: unknown) => {
  if (value === "" || value === undefined || value === null) return undefined;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? undefined : parsed;
};

export default function RiskStep({ clinicalContext }: Props) {
  const { register, watch, setValue } = useFormContext<AssessmentInput>();
  const scanType = watch("nodule.scanType");
  const hasKnownMalignancy = watch("patient.hasKnownMalignancy");
  const isImmunocompromised = watch("patient.isImmunocompromised");
  const extrathoracicCancerHistory = watch("patient.extrathoracicCancerHistory");
  const riskFactors = watch("patient.riskFactors");
  const hasExclusion = Boolean(hasKnownMalignancy || isImmunocompromised);
  const hasHighRisk = riskFactors ? Object.values(riskFactors).some(Boolean) : false;

  useEffect(() => {
    if (clinicalContext === "screening" && scanType === "baseline") {
      setValue("priorCategory", undefined);
      setValue("priorStatus", undefined);
    }
  }, [clinicalContext, scanType, setValue]);

  useEffect(() => {
    if (clinicalContext !== "incidental") return;
    setValue("patient.riskLevel", hasHighRisk ? "high" : "low", { shouldValidate: true });
  }, [clinicalContext, hasHighRisk, setValue]);

  const age = watch("patient.age");
  useEffect(() => {
    if (clinicalContext === "incidental" && age !== undefined && !Number.isNaN(age)) {
      setValue("patient.riskFactors.age65", age > 65, { shouldValidate: true });
    }
  }, [clinicalContext, age, setValue]);

  return (
    <div className="space-y-4">
      {clinicalContext === "incidental" ? (
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-foreground">Edad (años)</label>
            <Input
              type="number"
              min={0}
              aria-label="Edad del paciente"
              placeholder="Edad del paciente"
              className="mt-1"
              {...register("patient.age", { setValueAs: parseOptionalNumber })}
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-foreground">
              <span>Factores de riesgo (Fleischner)</span>
              <span
                className="text-xs text-muted-foreground cursor-help"
                title={RISK_FACTOR_TOOLTIP}
                aria-label="Factores de alto riesgo (Fleischner)"
              >
                (?)
              </span>
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {RISK_FACTORS.high.map((factor) => (
                <label key={factor.id} className="flex items-center gap-2 text-foreground">
                  <input
                    type="checkbox"
                    aria-label={factor.label}
                    {...register(`patient.riskFactors.${factor.id}` as const)}
                    className="text-primary rounded focus:ring-primary"
                  />
                  {factor.label}
                </label>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-2 rounded-md border border-border bg-muted/40 px-3 py-2 text-sm">
              <span className="text-foreground">Riesgo calculado:</span>
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                  hasHighRisk ? "bg-destructive/20 text-destructive" : "bg-success/20 text-success"
                }`}
              >
                {hasHighRisk ? "ALTO" : "BAJO"}
              </span>
              <span className="text-xs text-muted-foreground">Se ajusta automáticamente según los factores seleccionados.</span>
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">Exclusiones Fleischner</p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <label className="flex items-center gap-2 text-foreground">
                <input
                  type="checkbox"
                  aria-label="Cáncer conocido"
                  {...register("patient.hasKnownMalignancy")}
                  className="text-primary rounded focus:ring-primary"
                />
                Cáncer conocido
              </label>
              <label className="flex items-center gap-2 text-foreground">
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
                className="rounded-md border border-warning/50 bg-warning/20 p-3 text-sm text-foreground"
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
            <label className="block text-sm font-medium text-foreground">Tipo de scan</label>
            <select
              className="mt-1 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              aria-label="Tipo de scan"
              {...register("nodule.scanType")}
            >
              <option value="baseline" className="bg-popover">Baseline</option>
              <option value="follow-up" className="bg-popover">Follow-up</option>
            </select>
          </div>
          {scanType === "follow-up" && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-foreground">Diámetro previo (mm)</label>
                <Input
                  type="number"
                  min={0}
                  aria-label="Diámetro previo en mm"
                  className="mt-1"
                  {...register("nodule.priorDiameterMm", {
                    setValueAs: parseOptionalNumber,
                  })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground">Meses desde scan previo</label>
                <Input
                  type="number"
                  min={0}
                  aria-label="Meses desde el scan previo"
                  className="mt-1"
                  {...register("nodule.priorScanMonthsAgo", {
                    setValueAs: parseOptionalNumber,
                  })}
                />
              </div>
            </div>
          )}
          {scanType === "follow-up" && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">Stepped management (opcional)</p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-foreground">Categoría previa</label>
                  <select
                    className="mt-1 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm text-foreground"
                    aria-label="Categoría Lung-RADS previa"
                    defaultValue=""
                    {...register("priorCategory", { setValueAs: (value) => value || undefined })}
                  >
                    <option value="" className="bg-popover">Sin categoría previa</option>
                    <option value="0" className="bg-popover">0</option>
                    <option value="1" className="bg-popover">1</option>
                    <option value="2" className="bg-popover">2</option>
                    <option value="3" className="bg-popover">3</option>
                    <option value="4A" className="bg-popover">4A</option>
                    <option value="4B" className="bg-popover">4B</option>
                    <option value="4X" className="bg-popover">4X</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground">Estado previo</label>
                  <select
                    className="mt-1 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm text-foreground"
                    aria-label="Estado Lung-RADS previo"
                    defaultValue=""
                    {...register("priorStatus", { setValueAs: (value) => value || undefined })}
                  >
                    <option value="" className="bg-popover">Sin estado previo</option>
                    <option value="stable" className="bg-popover">Estable (step-down permitido)</option>
                    <option value="decreasing" className="bg-popover">Decreciente (step-down permitido)</option>
                    <option value="progression" className="bg-popover">Progresión</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="space-y-3 rounded-lg border border-border bg-muted/40 p-3">
        <p className="text-sm font-medium text-foreground">Factores para modelos predictivos (opcional)</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {clinicalContext === "screening" && (
            <div>
              <label className="block text-sm font-medium text-foreground">
                Edad (años) <span className="text-xs text-muted-foreground">(opcional, para Brock)</span>
              </label>
              <Input
                type="number"
                min={0}
                aria-label="Edad del paciente para modelos predictivos"
                placeholder="Edad del paciente"
                className="mt-1"
                {...register("patient.age", { setValueAs: parseOptionalNumber })}
              />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-foreground">Sexo</label>
            <select
              className="mt-1 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm text-foreground"
              aria-label="Sexo del paciente"
              defaultValue=""
              {...register("patient.sex", { setValueAs: (value) => value || undefined })}
            >
              <option value="" className="bg-popover">Sin especificar</option>
              <option value="female" className="bg-popover">Femenino</option>
              <option value="male" className="bg-popover">Masculino</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground">Tabaquismo</label>
            <select
              className="mt-1 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm text-foreground"
              aria-label="Estado de tabaquismo"
              defaultValue=""
              {...register("patient.smokingStatus", { setValueAs: (value) => value || undefined })}
            >
              <option value="" className="bg-popover">Sin especificar</option>
              <option value="never" className="bg-popover">Nunca fumador</option>
              <option value="former" className="bg-popover">Exfumador</option>
              <option value="current" className="bg-popover">Fumador actual</option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-foreground">Cáncer extratorácico</label>
            <select
              className="mt-1 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm text-foreground"
              aria-label="Historia de cáncer extratorácico"
              defaultValue=""
              {...register("patient.extrathoracicCancerHistory", { setValueAs: (value) => value || undefined })}
            >
              <option value="" className="bg-popover">Sin especificar</option>
              <option value="none" className="bg-popover">No</option>
              <option value="over5y" className="bg-popover">Sí, &gt;5 años</option>
              <option value="recent" className="bg-popover">Sí, &lt;5 años</option>
            </select>
          </div>
        </div>
        {clinicalContext === "screening" && (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <label className="flex items-center gap-2 text-foreground">
              <input
                type="checkbox"
                aria-label="Antecedentes familiares de cáncer de pulmón"
                {...register("patient.hasFamilyHistoryLungCancer")}
                className="text-primary rounded focus:ring-primary"
              />
              Antecedentes familiares de cáncer de pulmón
            </label>
            <label className="flex items-center gap-2 text-foreground">
              <input
                type="checkbox"
                aria-label="Enfisema en TC"
                {...register("patient.hasEmphysema")}
                className="text-primary rounded focus:ring-primary"
              />
              Enfisema en TC
            </label>
          </div>
        )}
        {extrathoracicCancerHistory === "recent" && (
          <div className="rounded-md border border-warning/50 bg-warning/20 p-3 text-sm text-foreground" role="alert">
            Mayo no aplica si el cáncer extratorácico fue diagnosticado en los últimos 5 años.
          </div>
        )}
      </div>
    </div>
  );
}
