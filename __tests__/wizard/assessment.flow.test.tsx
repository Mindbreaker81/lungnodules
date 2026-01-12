import { render, screen } from "@testing-library/react";
import { act } from "react-dom/test-utils";
import userEvent from "@testing-library/user-event";
import WizardContainer from "@components/wizard/WizardContainer";
import { AssessmentResult } from "@lib/algorithms";

jest.mock("@lib/algorithms", () => {
  const actual = jest.requireActual("@lib/algorithms");
  return {
    ...actual,
    assessFleischner: jest.fn((): AssessmentResult => ({
      guideline: "fleischner-2017",
      category: "Solid <6mm (single, low risk)",
      recommendation: "No routine follow-up",
      followUpInterval: "None",
      rationale: "Mocked rationale",
    })),
    assessLungRads: jest.fn((): AssessmentResult => ({
      guideline: "lung-rads-2022",
      category: "2",
      recommendation: "Continue annual LDCT",
      followUpInterval: "12 months",
      rationale: "Mocked rationale",
    })),
  };
});

describe("WizardContainer", () => {
  test("flujo incidental feliz muestra resultados", async () => {
    const user = userEvent.setup();

    render(<WizardContainer />);

    // Paso 1: Contexto ya seleccionado como incidental por defecto -> avanzar
    await act(async () => {
      await user.click(screen.getAllByRole("button", { name: /siguiente|finalizar/i })[0]);
    });

    // Paso 2: Riesgo/edad -> continuar
    await act(async () => {
      await user.click(screen.getAllByRole("button", { name: /siguiente|finalizar/i })[0]);
    });

    // Paso 3: Nódulo -> continuar a resultados
    await act(async () => {
      await user.click(screen.getAllByRole("button", { name: /siguiente|finalizar/i })[0]);
    });

    // Debe mostrar resultados mocked de Fleischner
    expect(await screen.findByText(/No routine follow-up/i)).toBeInTheDocument();
    expect(screen.getByText(/Solid <6mm/)).toBeInTheDocument();
  });

  test("flujo screening feliz muestra resultados", async () => {
    const user = userEvent.setup();

    render(<WizardContainer />);

    const screeningRadio = screen.getByLabelText(/Lung-RADS v2022/i);
    await act(async () => {
      await user.click(screeningRadio);
    });

    // Paso 1 -> Riesgo/Scan
    await act(async () => {
      await user.click(screen.getAllByRole("button", { name: /siguiente|finalizar/i })[0]);
    });

    // Seleccionar follow-up en tipo de scan
    const scanSelect = await screen.findByRole("combobox", { name: /Tipo de scan/i });
    await act(async () => {
      await user.selectOptions(scanSelect, "follow-up");
    });

    // Completar datos obligatorios de follow-up
    const priorDiameterInput = screen.getByLabelText(/Diámetro previo en mm/i);
    await act(async () => {
      await user.type(priorDiameterInput, "4");
    });
    const priorMonthsInput = screen.getByLabelText(/Meses desde el scan previo/i);
    await act(async () => {
      await user.type(priorMonthsInput, "6");
    });

    // Riesgo/Scan -> Nódulo
    await act(async () => {
      await user.click(screen.getAllByRole("button", { name: /siguiente|finalizar/i })[0]);
    });

    // Nódulo -> Resultados
    await act(async () => {
      await user.click(screen.getAllByRole("button", { name: /siguiente|finalizar/i })[0]);
    });

    // Debe mostrar resultados mocked de Lung-RADS
    expect(await screen.findByText(/Continue annual LDCT/i)).toBeInTheDocument();
    expect(screen.getByText(/lung-rads-2022/i)).toBeInTheDocument();
  });
});
