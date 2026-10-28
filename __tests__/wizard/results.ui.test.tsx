"use client";

import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import ResultsStep from "@components/wizard/ResultsStep";
import { AssessmentResult } from "@lib/algorithms";
import { AssessmentInput } from "@lib/schemas/noduleInput";

const baseResult: AssessmentResult = {
  guideline: "lung-rads-2022",
  category: "4A",
  recommendation: "LDCT; PET/CT if solid ≥8mm",
  followUpInterval: "3 months",
  imagingModality: "LDCT",
  rationale: "Growth >1.5mm/12m detected",
};

describe("ResultsStep UI", () => {
  it("shows growth label when follow-up growth detected", () => {
    const input: AssessmentInput = {
      clinicalContext: "screening",
      patient: { clinicalContext: "screening", age: 60 },
      nodule: {
        type: "solid",
        diameterMm: 8,
        solidComponentMm: undefined,
        isMultiple: false,
        isNew: false,
        scanType: "follow-up",
        priorDiameterMm: 4,
        priorScanMonthsAgo: 6,
      },
    };

    render(<ResultsStep result={baseResult} input={input} />);

    expect(screen.getByText(/Crecimiento detectado/)).toBeInTheDocument();
  });

  it("shows total and solid component growth separately for part-solid nodules", () => {
    const input: AssessmentInput = {
      clinicalContext: "screening",
      patient: { clinicalContext: "screening", age: 60 },
      nodule: {
        type: "part-solid",
        diameterMm: 12,
        solidComponentMm: 4,
        isMultiple: false,
        isNew: false,
        scanType: "follow-up",
        priorDiameterMm: 12,
        priorSolidComponentMm: 2,
        priorScanMonthsAgo: 12,
      },
    };

    render(<ResultsStep result={baseResult} input={input} />);

    expect(screen.getByText(/Diámetro total: Sin crecimiento significativo/)).toBeInTheDocument();
    expect(screen.getByText(/Componente sólido: Crecimiento detectado/)).toBeInTheDocument();
  });

  it("marks a solid component that appears (0 -> >0 mm) as new", () => {
    const input: AssessmentInput = {
      clinicalContext: "screening",
      patient: { clinicalContext: "screening", age: 60 },
      nodule: {
        type: "part-solid",
        diameterMm: 12,
        solidComponentMm: 1,
        isMultiple: false,
        isNew: false,
        scanType: "follow-up",
        priorDiameterMm: 12,
        priorSolidComponentMm: 0,
        priorScanMonthsAgo: 12,
      },
    };

    render(<ResultsStep result={baseResult} input={input} />);

    expect(screen.getByText(/Componente sólido: nuevo/)).toBeInTheDocument();
  });

  it("mentions dominant nodule when multiples present", () => {
    const input: AssessmentInput = {
      clinicalContext: "screening",
      patient: { clinicalContext: "screening", age: 60 },
      nodule: {
        type: "solid",
        diameterMm: 5,
        solidComponentMm: undefined,
        isMultiple: true,
        isNew: false,
        scanType: "baseline",
      },
    };

    render(<ResultsStep result={baseResult} input={input} />);

    expect(
      screen.getByText(/Múltiples nódulos: recomendaciones aplican al nódulo dominante/i),
    ).toBeInTheDocument();
  });

  it("explains how each predictive model is calculated", () => {
    const input: AssessmentInput = {
      clinicalContext: "screening",
      patient: { clinicalContext: "screening", age: 60 },
      nodule: {
        type: "solid",
        diameterMm: 8,
        solidComponentMm: undefined,
        isMultiple: false,
        scanType: "baseline",
      },
    };

    render(<ResultsStep result={baseResult} input={input} />);
    fireEvent.click(screen.getByText("Modelos predictivos (beta)"));

    expect(screen.getAllByText("¿Cómo se calcula?")).toHaveLength(3);
    expect(screen.getByText(/−4,739 \+ 3,691 × probabilidad de Mayo/)).toBeInTheDocument();
    expect(screen.getByText(/Bandas de riesgo orientativas/)).toBeInTheDocument();
  });
});
