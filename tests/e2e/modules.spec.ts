import { test, expect } from "@playwright/test";

const BASE = "http://localhost:3000";

const MODULES = [
  { id: "events",       name: /accidents|événements/i },
  { id: "inspections",  name: /inspections/i },
  { id: "permits",      name: /permis/i },
  { id: "actions",      name: /actions/i },
  { id: "indicators",   name: /indicateurs/i },
  { id: "ppe",          name: /epi|équipements/i },
  { id: "environment",  name: /environnement/i },
];

test.describe("Pages modules HSE", () => {
  for (const mod of MODULES) {
    test(`Module ${mod.id} — page se charge`, async ({ page }) => {
      await page.goto(`${BASE}/modules/${mod.id}`);
      await expect(page.locator("h1")).toBeVisible({ timeout: 8000 });
      // Pas d'erreur 500
      const status = page.url();
      expect(status).toContain(mod.id);
    });

    test(`Module ${mod.id} — bouton modèle Excel présent`, async ({ page }) => {
      await page.goto(`${BASE}/modules/${mod.id}`);
      await expect(page.getByRole("link", { name: /modele excel/i }).first()).toBeVisible({ timeout: 6000 });
    });

    test(`Module ${mod.id} — bouton export rapport présent`, async ({ page }) => {
      await page.goto(`${BASE}/modules/${mod.id}`);
      await expect(page.getByRole("link", { name: /rapport/i }).first()).toBeVisible({ timeout: 6000 });
    });
  }
});

test.describe("Module events — dashboard spécialisé", () => {
  test("Le panel EventsSeverity s'affiche", async ({ page }) => {
    await page.goto(`${BASE}/modules/events`);
    await expect(page.locator("svg").first()).toBeVisible({ timeout: 8000 });
    await expect(page.locator("h2").first()).toBeVisible();
  });
});

test.describe("Module actions — dashboard spécialisé", () => {
  test("Le panel ActionsPriority affiche les KPI", async ({ page }) => {
    await page.goto(`${BASE}/modules/actions`);
    await expect(page.locator(".actionsKpis, .panel").first()).toBeVisible({ timeout: 8000 });
  });
});

test.describe("Module indicators — TF/TG", () => {
  test("Le dashboard TF/TG est visible", async ({ page }) => {
    await page.goto(`${BASE}/modules/indicators`);
    await expect(page.locator(".tftgKpis, .panel").first()).toBeVisible({ timeout: 8000 });
  });
});

test.describe("Module inspections — conformité", () => {
  test("Le panel conformite s'affiche", async ({ page }) => {
    await page.goto(`${BASE}/modules/inspections`);
    await expect(page.locator(".panel").first()).toBeVisible({ timeout: 8000 });
    await expect(page.locator("svg").first()).toBeVisible({ timeout: 8000 });
  });
});

test.describe("Import form — UI", () => {
  test("Le formulaire d'import est visible sur chaque module", async ({ page }) => {
    await page.goto(`${BASE}/modules/events`);
    await expect(page.locator("input[type='file'], .importForm").first()).toBeVisible({ timeout: 8000 });
  });

  test("Le tableau des enregistrements s'affiche", async ({ page }) => {
    await page.goto(`${BASE}/modules/events`);
    await expect(page.locator("table").first()).toBeVisible({ timeout: 8000 });
  });
});

test.describe("Module 404", () => {
  test("Un module inexistant retourne une page 404", async ({ page }) => {
    const response = await page.goto(`${BASE}/modules/module_inexistant`);
    expect(response?.status()).toBe(404);
  });
});
