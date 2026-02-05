"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { assessmentInputSchema, AssessmentInput } from "@lib/schemas/noduleInput";
import { assessFleischner, assessLungRads, AssessmentResult, ClinicalContext } from "@lib/algorithms";
import { analytics } from "@lib/analytics";
import ContextStep from "./ContextStep";
import RiskStep from "./RiskStep";
import NoduleStep from "./NoduleStep";
import ResultsStep from "./ResultsStep";
import { Button } from "@components/ui/button";

const steps = [
  { id: "context", label: "Contexto" },
  { id: "risk", label: "Riesgo / Scan" },
  { id: "nodule", label: "Nódulo" },
  { id: "results", label: "Resultados" },
] as const;

type StepId = (typeof steps)[number]["id"];

const defaultValues = {
  clinicalContext: "incidental",
  patient: {
    clinicalContext: "incidental",
    age: 50,
    riskLevel: "low",
    riskFactors: {
      age65: false,
      smoking30: false,
      currentSmoker: false,
      familyHistory: false,
      emphysema: false,
      carcinogenExposure: false,
    },
    hasKnownMalignancy: false,
    isImmunocompromised: false,
    sex: undefined,
    smokingStatus: undefined,
    extrathoracicCancerHistory: undefined,
    hasFamilyHistoryLungCancer: false,
    hasEmphysema: false,
  },
  nodule: {
    type: "solid",
    diameterMm: 5,
    solidComponentMm: undefined,
    isMultiple: false,
    isPerifissural: false,
    hasSpiculation: false,
    isUpperLobe: false,
    noduleCount: undefined,
    hasPet: false,
    petUptake: undefined,
    isJuxtapleural: false,
    isAirway: false,
    isAtypicalCyst: false,
    isBenign: false,
    hasSignificantFinding: false,
    isInflammatory: false,
    inflammatoryCategory: undefined,
    airwayLocation: undefined,
    airwayPersistent: false,
    atypicalCystCategory: undefined,
    isNew: false,
  },
  priorCategory: undefined,
  priorStatus: undefined,
} satisfies AssessmentInput;

export default function WizardContainer() {
  const methods = useForm<AssessmentInput>({
    mode: "onChange",
    resolver: zodResolver(assessmentInputSchema),
    defaultValues,
  });

  const [currentStep, setCurrentStep] = useState<StepId>("context");
  const [result, setResult] = useState<AssessmentResult | null>(null);
  const [lastInput, setLastInput] = useState<AssessmentInput | null>(null);
  const hasTrackedStart = useRef(false);

  const rawContext = methods.watch("clinicalContext");
  const context: ClinicalContext = rawContext === "screening" ? "screening" : "incidental";

  // Track assessment start on first step change
  useEffect(() => {
    if (!hasTrackedStart.current && currentStep !== "context") {
      const guideline = context === "screening" ? "lung-rads-2022" : "fleischner-2017";
      analytics.assessmentStarted(guideline);
      hasTrackedStart.current = true;
    }
  }, [currentStep, context]);
  const { isSubmitting, errors } = methods.formState;

  // Mantener sincronizado patient.clinicalContext con el contexto raíz.
  useEffect(() => {
    methods.setValue("patient.clinicalContext", context);
    if (context === "screening") {
      methods.setValue("patient.riskLevel", undefined);
      methods.setValue("nodule.scanType" as any, methods.getValues("nodule.scanType") ?? "baseline");
    } else {
      const riskFactors = methods.getValues("patient.riskFactors");
      const hasHighRisk = riskFactors ? Object.values(riskFactors).some(Boolean) : false;
      methods.setValue("patient.riskLevel", hasHighRisk ? "high" : "low");
      methods.setValue("nodule.scanType" as any, undefined);
      methods.setValue("nodule.priorDiameterMm" as any, undefined);
      methods.setValue("nodule.priorScanMonthsAgo" as any, undefined);
      methods.setValue("priorCategory", undefined);
      methods.setValue("priorStatus", undefined);
    }
  }, [context, methods]);

  const stepIndex = steps.findIndex((s) => s.id === currentStep);
  const nextStepId = steps[stepIndex + 1]?.id;
  const isLastInputStep = nextStepId === "results";

  const validateStep = (step: StepId) => {
    methods.clearErrors();

    if (step === "risk") {
      if (context === "incidental") {
        const age = methods.getValues("patient.age");
        const riskLevel = methods.getValues("patient.riskLevel");
        const hasKnownMalignancy = methods.getValues("patient.hasKnownMalignancy");
        const isImmunocompromised = methods.getValues("patient.isImmunocompromised");

        if (age === undefined || Number.isNaN(age)) {
          methods.setError("patient.age", { type: "manual", message: "La edad debe ser positiva" });
          return false;
        }
        if (age < 35) {
          methods.setError("patient.age", { type: "manual", message: "Las guías Fleischner aplican a pacientes ≥35 años" });
          return false;
        }
        if (!riskLevel) {
          methods.setError("patient.riskLevel" as any, { type: "manual", message: "El nivel de riesgo es requerido para Fleischner" });
          return false;
        }
        if (hasKnownMalignancy) {
          methods.setError("patient.hasKnownMalignancy", {
            type: "manual",
            message: "Fleischner no aplica en pacientes con cáncer conocido",
          });
          return false;
        }
        if (isImmunocompromised) {
          methods.setError("patient.isImmunocompromised", {
            type: "manual",
            message: "Fleischner no aplica en pacientes inmunocomprometidos",
          });
          return false;
        }
        return true;
      }

      const scanType = methods.getValues("nodule.scanType" as any);
      if (!scanType) {
        methods.setError("nodule.scanType" as any, { type: "manual", message: "Tipo de scan requerido" });
        return false;
      }
      if (scanType === "follow-up") {
        const priorDiameter = methods.getValues("nodule.priorDiameterMm" as any);
        const priorMonths = methods.getValues("nodule.priorScanMonthsAgo" as any);
        if (priorDiameter === undefined || Number.isNaN(priorDiameter) ||
            priorMonths === undefined || Number.isNaN(priorMonths)) {
          methods.setError("nodule.priorDiameterMm" as any, {
            type: "manual",
            message: "El diámetro previo y el intervalo son requeridos para seguimiento",
          });
          return false;
        }

        const priorCategory = methods.getValues("priorCategory");
        const priorStatus = methods.getValues("priorStatus");
        if (priorCategory && !priorStatus) {
          methods.setError("priorStatus" as any, { type: "manual", message: "Estado Lung-RADS previo requerido" });
          return false;
        }
        if (priorStatus && !priorCategory) {
          methods.setError("priorCategory" as any, { type: "manual", message: "Categoría Lung-RADS previa requerida" });
          return false;
        }
      }
      return true;
    }

    if (step === "nodule") {
      const diameter = methods.getValues("nodule.diameterMm");
      if (diameter === undefined || Number.isNaN(diameter)) {
        methods.setError("nodule.diameterMm" as any, { type: "manual", message: "Ingresa un diámetro entre 1 y 100 mm" });
        return false;
      }
      if (diameter < 1 || diameter > 100) {
        methods.setError("nodule.diameterMm" as any, { type: "manual", message: "Ingresa un diámetro entre 1 y 100 mm" });
        return false;
      }
      const type = methods.getValues("nodule.type");
      if (type === "part-solid") {
        const solidComponent = methods.getValues("nodule.solidComponentMm");
        if (solidComponent !== undefined && Number.isNaN(solidComponent)) {
          methods.setValue("nodule.solidComponentMm", undefined);
        } else if (solidComponent !== undefined && solidComponent <= 0) {
          methods.setError("nodule.solidComponentMm" as any, {
            type: "manual",
            message: "Un nódulo semi-sólido con componente sólido 0 mm es vidrio esmerilado; cambia el tipo o ingresa un valor >0",
          });
          return false;
        } else if (solidComponent !== undefined && solidComponent > diameter) {
          methods.setError("nodule.solidComponentMm" as any, {
            type: "manual",
            message: "El componente sólido no puede exceder el diámetro total",
          });
          return false;
        }
      }
      const isMultiple = methods.getValues("nodule.isMultiple");
      if (isMultiple) {
        const count = methods.getValues("nodule.noduleCount");
        if (count === undefined || Number.isNaN(count) || count < 1) {
          methods.setError("nodule.noduleCount" as any, { type: "manual", message: "Ingresa el número de nódulos" });
          return false;
        }
      }
      return true;
    }

    return true;
  };

  const submit = methods.handleSubmit(
    (data) => {
      setLastInput(data);
      if (data.clinicalContext === "incidental") {
        const assessment = assessFleischner({
          patient: data.patient,
          nodule: data.nodule,
        });
        setResult(assessment);
        setCurrentStep("results");
        analytics.assessmentCompleted("fleischner-2017", assessment.category, data.nodule.type);
        return;
      }
      const assessment = assessLungRads({
        patient: data.patient,
        nodule: data.nodule as any,
        priorCategory: data.priorCategory,
        priorStatus: data.priorStatus,
      });
      setResult(assessment);
      setCurrentStep("results");
      analytics.assessmentCompleted("lung-rads-2022", assessment.category, data.nodule.type);
    },
    (validationErrors) => {
      // Log validation errors for debugging (avoid JSON.stringify — refs can be circular)
      console.error("Form validation failed:", validationErrors);
      try {
        const flatErrors = Object.entries(validationErrors)
          .map(([key, value]) => `${key}: ${(value as any)?.message || "invalid"}`)
          .join("; ");
        if (flatErrors) {
          analytics.errorDisplayed("validation", flatErrors);
        }
      } catch {
        analytics.errorDisplayed("validation", "Form validation failed");
      }
    }
  );

  const handleNext = async () => {
    if (currentStep === "context") {
      if (nextStepId) {
        analytics.stepChanged(nextStepId, stepIndex + 1);
        setCurrentStep(nextStepId);
      }
      return;
    }

    const valid = validateStep(currentStep);
    if (!valid) return;

    if (isLastInputStep) {
      await submit();
      return;
    }

    if (nextStepId) {
      analytics.stepChanged(nextStepId, stepIndex + 1);
      setCurrentStep(nextStepId);
    }
  };

  const handleBack = () => {
    if (stepIndex === 0) return;
    setCurrentStep(steps[stepIndex - 1].id);
  };

  const handleReset = () => {
    methods.reset(defaultValues);
    setResult(null);
    setLastInput(null);
    setCurrentStep("context");
    analytics.stepChanged("context", 0);
  };

  const content = useMemo(() => {
    switch (currentStep) {
      case "context":
        return <ContextStep />;
      case "risk":
        return <RiskStep clinicalContext={context} />;
      case "nodule":
        return <NoduleStep clinicalContext={context} />;
      case "results":
        return <ResultsStep result={result} input={lastInput} />;
      default:
        return null;
    }
  }, [context, currentStep, result, lastInput]);

  const extractFirstError = (errs: Record<string, unknown>, depth = 0): string | undefined => {
    if (depth > 5) return undefined;
    for (const value of Object.values(errs)) {
      if (!value || typeof value !== "object") continue;
      const val = value as Record<string, unknown>;
      if (typeof val.message === "string") return val.message;
      if (val.root && typeof (val.root as any).message === "string") return (val.root as any).message;
      const nested = extractFirstError(val as Record<string, unknown>, depth + 1);
      if (nested) return nested;
    }
    return undefined;
  };
  const firstErrorMessage = extractFirstError(errors as Record<string, unknown>);

  return (
    <FormProvider {...methods}>
      <form className="space-y-6 pb-20" onSubmit={submit}>
        <div className="flex flex-wrap items-center gap-2 text-sm text-slate-400">
          {steps.map((step) => (
            <div key={step.id} className="flex items-center gap-1">
              <div
                className={`h-2 w-2 rounded-full ${step.id === currentStep ? "bg-primary" : "bg-slate-700"}`}
                aria-hidden
              />
              <span className={step.id === currentStep ? "font-semibold text-white" : ""}>{step.label}</span>
              {step.id !== "results" && <span className="text-slate-600">/</span>}
            </div>
          ))}
        </div>

        {content}

        {firstErrorMessage && (
          <div className="rounded-md border border-amber-900/50 bg-amber-900/20 p-3 text-sm text-amber-200" role="alert">
            {firstErrorMessage as string}
          </div>
        )}

        <div className="hidden items-center justify-between md:flex">
          <Button type="button" onClick={handleBack} disabled={stepIndex === 0} variant="outline">
            Atrás
          </Button>
          {currentStep !== "results" ? (
            <Button
              type="button"
              onClick={handleNext}
              disabled={isSubmitting}
            >
              {isLastInputStep ? "Finalizar" : "Siguiente"}
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={handleReset}>
                Nueva evaluación
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                Recalcular
              </Button>
            </div>
          )}
        </div>

        {/* Barra fija inferior para mobile */}
        <div className="fixed bottom-0 left-0 right-0 z-10 flex items-center justify-between border-t border-slate-800 bg-background/95 backdrop-blur-md px-4 py-3 shadow-md md:hidden">
          <Button type="button" onClick={handleBack} disabled={stepIndex === 0} variant="outline" size="sm">
            Atrás
          </Button>
          {currentStep !== "results" ? (
            <Button
              type="button"
              onClick={handleNext}
              size="sm"
              disabled={isSubmitting}
            >
              {isLastInputStep ? "Finalizar" : "Siguiente"}
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button type="button" variant="outline" size="sm" onClick={handleReset}>
                Nueva evaluación
              </Button>
              <Button type="submit" size="sm" disabled={isSubmitting}>
                Recalcular
              </Button>
            </div>
          )}
        </div>
      </form>
    </FormProvider>
  );
}
