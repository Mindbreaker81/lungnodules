import { test, expect } from "@playwright/test";

test.describe("Smoke navigation", () => {
  test("Landing loads", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Soporte de decisión para nódulos pulmonares" })).toBeVisible();
    await expect(page.getByText(/Fleischner 2017/i)).toBeVisible();
  });

  test("Assessment wizard renders", async ({ page }) => {
    await page.goto("/assessment");
    await expect(page.getByRole("heading", { name: "Asistente de Evaluación" })).toBeVisible();
    await expect(page.getByText(/Contexto/i).first()).toBeVisible();
    await expect(page.getByLabel("Incidental (Fleischner 2017)")).toBeVisible();
    await expect(page.getByLabel("Screening (Lung-RADS v2022)")).toBeVisible();
  });
});
