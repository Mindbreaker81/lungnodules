"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { assessmentInputSchema, AssessmentInput } from "@lib/schemas/noduleInput";
import { assessFleischner, assessLungRads, AssessmentResult, RiskLevel } from "@lib/algorithms";
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
    hasKnownMalignancy: false,
    isImmunocompromised: false,
  },
  nodule: {
    type: "solid",
    diameterMm: 5,
    solidComponentMm: undefined,
    isMultiple: false,
    isPerifissural: false,
    hasSpiculation: false,
    isJuxtapleural: false,
    isAirway: false,
    isAtypicalCyst: false,
    isNew: false,
  },
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

  const context = methods.watch("clinicalContext");

  // Track assessment start on first step change
  useEffect(() => {
    if (!hasTrackedStart.current && currentStep !== "context") {
      const guideline = context === "screening" ? "lung-rads-2022" : "fleischner-2017";
      analytics.assessmentStarted(guideline);
      hasTrackedStart.current = true;
    }
  }, [currentStep, context]);
  const { isValid, isSubmitting, errors } = methods.formState;

  // Mantener sincronizado patient.clinicalContext con el contexto raíz.
  useEffect(() => {
    methods.setValue("patient.clinicalContext", context);
    if (context === "screening") {
      methods.setValue("patient.riskLevel", undefined);
      methods.setValue("nodule.scanType" as any, methods.getValues("nodule.scanType") ?? "baseline");
    } else {
      const risk = (methods.getValues("patient.riskLevel") as RiskLevel | undefined) ?? "low";
      methods.setValue("patient.riskLevel", risk);
      methods.setValue("nodule.scanType" as any, undefined);
      methods.setValue("nodule.priorDiameterMm" as any, undefined);
      methods.setValue("nodule.priorScanMonthsAgo" as any, undefined);
    }
  }, [context, methods]);

  const stepIndex = steps.findIndex((s) => s.id === currentStep);
  const nextStepId = steps[stepIndex + 1]?.id;
  const isLastInputStep = nextStepId === "results";

  const submit = methods.handleSubmit((data) => {
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
    });
    setResult(assessment);
    setCurrentStep("results");
    analytics.assessmentCompleted("lung-rads-2022", assessment.category, data.nodule.type);
  });

  const handleNext = async () => {
    if (currentStep === "context") {
      if (nextStepId) {
        analytics.stepChanged(nextStepId, stepIndex + 1);
        setCurrentStep(nextStepId);
      }
      return;
    }

    const valid = await methods.trigger();
    if (!valid) {
      const errorMessages = Object.values(errors)
        .map((e) => (e as any)?.message)
        .filter(Boolean)
        .join('; ');
      if (errorMessages) {
        analytics.errorDisplayed('validation', errorMessages);
      }
      return;
    }

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

  const firstErrorMessage =
    Object.values(errors).find((e) => (e as any)?.message)?.message ??
    Object.values(errors).flatMap((e) => (e as any)?.root?.message ?? [])?.[0];

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
              disabled={currentStep !== "context" && (!isValid || isSubmitting)}
            >
              {isLastInputStep ? "Finalizar" : "Siguiente"}
            </Button>
          ) : (
            <Button type="submit" disabled={isSubmitting}>
              Recalcular
            </Button>
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
              disabled={currentStep !== "context" && (!isValid || isSubmitting)}
            >
              {isLastInputStep ? "Finalizar" : "Siguiente"}
            </Button>
          ) : (
            <Button type="submit" size="sm" disabled={isSubmitting}>
              Recalcular
            </Button>
          )}
        </div>
      </form>
    </FormProvider>
  );
}
