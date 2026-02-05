import "@testing-library/jest-dom";
import { render, screen, fireEvent } from "@testing-library/react";
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

    // Paso 2: Riesgo/edad -> seleccionar factor y continuar
    const ageInput = await screen.findByLabelText(/Edad del paciente/i);
    await act(async () => {
      fireEvent.change(ageInput, { target: { value: "70" } });
      fireEvent.blur(ageInput);
    });

    const ageRiskFactor = screen.getByLabelText(/Edad >65 años/i);
    await act(async () => {
      await user.click(ageRiskFactor);
    });
    expect(screen.getByText(/Riesgo calculado/i)).toBeInTheDocument();

    await act(async () => {
      await user.click(screen.getAllByRole("button", { name: /siguiente|finalizar/i })[0]);
    });

    // Paso 3: Nódulo
    expect(await screen.findByRole("combobox", { name: /Tipo de nódulo/i })).toBeInTheDocument();

    // Paso 3: Nódulo -> validar estado por defecto (único)
    expect(screen.getByText(/Diámetro medio/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/Número de nódulos/i)).not.toBeInTheDocument();

    const diameterInput = screen.getByLabelText(/Diámetro en milímetros/i);
    await act(async () => {
      await user.clear(diameterInput);
      await user.type(diameterInput, "5");
    });
    expect(diameterInput).toHaveValue(5);

    // Continuar a resultados
    await act(async () => {
      await user.click(screen.getAllByRole("button", { name: /siguiente|finalizar/i })[0]);
    });

    // Debe mostrar resultados mocked de Fleischner
    expect(await screen.findByText(/No routine follow-up/i)).toBeInTheDocument();
    expect(screen.getByText(/Solid <6mm/)).toBeInTheDocument();
  });

  test("bloquea Fleischner si hay exclusiones", async () => {
    const user = userEvent.setup();

    render(<WizardContainer />);

    // Paso 1: Contexto -> Riesgo
    await act(async () => {
      await user.click(screen.getAllByRole("button", { name: /siguiente|finalizar/i })[0]);
    });

    const malignancyCheckbox = screen.getByLabelText(/Cáncer conocido/i);
    await act(async () => {
      await user.click(malignancyCheckbox);
    });

    // Intentar avanzar al paso de nódulo
    await act(async () => {
      await user.click(screen.getAllByRole("button", { name: /siguiente|finalizar/i })[0]);
    });

    // The error message now appears in both the RiskStep inline alert and the form error banner
    expect(screen.getAllByText(/Fleischner no aplica en pacientes con cáncer conocido/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/Exclusiones Fleischner/i)).toBeInTheDocument();
    expect(screen.queryByRole("combobox", { name: /Tipo de nódulo/i })).not.toBeInTheDocument();
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
    expect(screen.getByText(/Lung-RADS v2022/i)).toBeInTheDocument();
  });

  test("valida stepped management cuando falta estado previo", async () => {
    const user = userEvent.setup();

    render(<WizardContainer />);

    const screeningRadio = screen.getByLabelText(/Lung-RADS v2022/i);
    await act(async () => {
      await user.click(screeningRadio);
    });

    await act(async () => {
      await user.click(screen.getAllByRole("button", { name: /siguiente|finalizar/i })[0]);
    });

    const scanSelect = await screen.findByRole("combobox", { name: /Tipo de scan/i });
    await act(async () => {
      await user.selectOptions(scanSelect, "follow-up");
    });

    const priorDiameterInput = screen.getByLabelText(/Diámetro previo en mm/i);
    await act(async () => {
      await user.type(priorDiameterInput, "4");
    });
    const priorMonthsInput = screen.getByLabelText(/Meses desde el scan previo/i);
    await act(async () => {
      await user.type(priorMonthsInput, "6");
    });

    const priorCategorySelect = screen.getByLabelText(/Categoría Lung-RADS previa/i);
    await act(async () => {
      await user.selectOptions(priorCategorySelect, "3");
    });
    expect(priorCategorySelect).toHaveValue("3");

    // Intentar avanzar sin estado previo: debe bloquear el cambio de paso
    await act(async () => {
      await user.click(screen.getAllByRole("button", { name: /siguiente|finalizar/i })[0]);
    });
    expect(screen.queryByRole("combobox", { name: /Tipo de nódulo/i })).not.toBeInTheDocument();

    const priorStatusSelect = screen.getByLabelText(/Estado Lung-RADS previo/i);
    await act(async () => {
      await user.selectOptions(priorStatusSelect, "stable");
    });

    // Ahora sí debería permitir avanzar a Nódulo
    await act(async () => {
      await user.click(screen.getAllByRole("button", { name: /siguiente|finalizar/i })[0]);
    });
    expect(await screen.findByRole("combobox", { name: /Tipo de nódulo/i })).toBeInTheDocument();
  });
});
