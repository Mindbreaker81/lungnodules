"use client";

import React from "react";
import { render, screen } from "@testing-library/react";
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
});
