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

  test("Theme toggle switches light, dark, and system modes", async ({ page }) => {
    await page.goto("/");

    const themeSelector = page.getByRole("group", { name: "Selector de tema" });
    await expect(themeSelector).toBeVisible();

    await themeSelector.getByRole("button", { name: "Claro" }).click();
    await expect(page.locator("html")).toHaveClass(/light/);
    await expect(themeSelector.getByRole("button", { name: "Claro" })).toHaveAttribute("aria-pressed", "true");

    await themeSelector.getByRole("button", { name: "Oscuro" }).click();
    await expect(page.locator("html")).toHaveClass(/dark/);
    await expect(themeSelector.getByRole("button", { name: "Oscuro" })).toHaveAttribute("aria-pressed", "true");

    await themeSelector.getByRole("button", { name: "Sistema" }).click();
    await expect(themeSelector.getByRole("button", { name: "Sistema" })).toHaveAttribute("aria-pressed", "true");
    await expect.poll(() => page.evaluate(() => window.localStorage.getItem("theme"))).toBe("system");
  });
});
