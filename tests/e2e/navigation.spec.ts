import { test, expect } from "@playwright/test";

const BASE = "http://localhost:3000";

test.describe("Page Sites", () => {
  test("La page /sites se charge", async ({ page }) => {
    await page.goto(`${BASE}/sites`);
    await expect(page.locator("h1")).toBeVisible({ timeout: 8000 });
    await expect(page.locator("h1")).toContainText(/site/i);
  });

  test("Les cartes de sites sont affichées", async ({ page }) => {
    await page.goto(`${BASE}/sites`);
    await expect(page.locator(".sitesKpiCard, .panel").first()).toBeVisible({ timeout: 8000 });
  });

  test("Le panel de comparaison sites est visible", async ({ page }) => {
    await page.goto(`${BASE}/sites`);
    await expect(page.locator("svg").first()).toBeVisible({ timeout: 8000 });
  });
});

test.describe("Page Calendrier", () => {
  test("La page /calendrier se charge", async ({ page }) => {
    await page.goto(`${BASE}/calendrier`);
    await expect(page.locator("h1")).toBeVisible({ timeout: 8000 });
    await expect(page.locator("h1")).toContainText(/calendrier/i);
  });

  test("Le tableau des échéances s'affiche", async ({ page }) => {
    await page.goto(`${BASE}/calendrier`);
    await expect(page.locator("table, .panel").first()).toBeVisible({ timeout: 8000 });
  });

  test("Les filtres urgence sont présents", async ({ page }) => {
    await page.goto(`${BASE}/calendrier`);
    // Des boutons de filtre urgence
    await expect(page.locator("button").filter({ hasText: /retard|urgent|semaine|bientot/i }).first())
      .toBeVisible({ timeout: 8000 });
  });
});

test.describe("Page Alertes", () => {
  test("La page /alerts se charge", async ({ page }) => {
    await page.goto(`${BASE}/alerts`);
    await expect(page.locator("main")).toBeVisible({ timeout: 8000 });
  });
});

test.describe("Page Rapports", () => {
  test("La page /reports se charge", async ({ page }) => {
    await page.goto(`${BASE}/reports`);
    await expect(page.locator("h1")).toBeVisible({ timeout: 8000 });
    await expect(page.locator("h1")).toContainText(/rapport|documentaire/i);
  });

  test("Les liens export PDF/Word sont présents", async ({ page }) => {
    await page.goto(`${BASE}/reports`);
    await expect(page.getByRole("link", { name: /pdf/i }).first()).toBeVisible({ timeout: 6000 });
    await expect(page.getByRole("link", { name: /word/i }).first()).toBeVisible({ timeout: 6000 });
  });
});

test.describe("Navigation — liens actifs", () => {
  test("Cockpit marque le lien actif correctement", async ({ page }) => {
    await page.goto(BASE);
    await expect(page.locator(".topNavLink.active").first()).toBeVisible({ timeout: 6000 });
  });

  test("Le lien Sites est dans la nav", async ({ page }) => {
    await page.goto(BASE);
    await expect(page.getByRole("link", { name: /sites/i }).first()).toBeVisible({ timeout: 6000 });
  });

  test("Le lien Calendrier est dans la nav", async ({ page }) => {
    await page.goto(BASE);
    await expect(page.getByRole("link", { name: /calendrier/i }).first()).toBeVisible({ timeout: 6000 });
  });

  test("Le lien Alertes est dans la nav", async ({ page }) => {
    await page.goto(BASE);
    await expect(page.getByRole("link", { name: /alertes/i }).first()).toBeVisible({ timeout: 6000 });
  });
});

test.describe("API — endpoints de santé", () => {
  test("GET /api/alerts retourne 200", async ({ request }) => {
    const res = await request.get(`${BASE}/api/alerts`, {
      headers: { "x-user-id": "tenant-admin-acme" },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.alerts)).toBe(true);
  });

  test("GET /api/modules retourne la liste des modules", async ({ request }) => {
    const res = await request.get(`${BASE}/api/modules`, {
      headers: { "x-user-id": "tenant-admin-acme" },
    });
    expect(res.status()).toBe(200);
  });

  test("GET /api/notifications/email retourne la config", async ({ request }) => {
    const res = await request.get(`${BASE}/api/notifications/email`, {
      headers: { "x-user-id": "tenant-admin-acme" },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(typeof body.configured).toBe("boolean");
  });
});
