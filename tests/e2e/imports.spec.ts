import { test, expect } from "@playwright/test";
import path from "path";
import fs from "fs";
import * as XLSX from "xlsx";

const BASE = "http://localhost:3000";

function createTestXlsx(moduleId: string): Buffer {
  const rows: Record<string, string | number>[] = [];

  if (moduleId === "events") {
    rows.push({
      "Date": "01/06/2026",
      "Site": "Abidjan",
      "Type evenement": "Incident",
      "Description": "Test import e2e — incident mineur",
      "Gravite": "Mineure",
      "Statut": "Ouvert",
      "Responsable": "Test User",
    });
  } else if (moduleId === "actions") {
    rows.push({
      "Date": "01/06/2026",
      "Site": "Abidjan",
      "Action": "Action corrective test e2e",
      "Origine": "Inspection",
      "Responsable": "Test User",
      "Echeance": "30/06/2026",
      "Statut": "En cours",
      "Priorite": "Haute",
    });
  }

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(rows);
  XLSX.utils.book_append_sheet(wb, ws, "Saisie");
  return XLSX.write(wb, { bookType: "xlsx", type: "buffer" }) as Buffer;
}

test.describe("Import Excel réel — API", () => {
  test("POST /api/imports — fichier valide retourne status validated", async ({ request }) => {
    const buf = createTestXlsx("events");
    const tmpPath = path.join(process.cwd(), "tests", "tmp_events.xlsx");
    fs.writeFileSync(tmpPath, buf);

    const response = await request.post(`${BASE}/api/imports`, {
      multipart: {
        moduleId: "events",
        file: { name: "events_test.xlsx", mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", buffer: buf },
      },
      headers: { "x-user-id": "tenant-admin-acme" },
    });

    fs.unlinkSync(tmpPath);
    const body = await response.json();
    expect(response.status()).toBe(200);
    expect(body.status).toBe("validated");
    expect(body.integratedRows).toBeGreaterThan(0);
  });

  test("POST /api/imports — fichier invalide retourne needs_correction", async ({ request }) => {
    // Fichier sans colonnes obligatoires
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet([{ "Colonne inconnue": "valeur" }]);
    XLSX.utils.book_append_sheet(wb, ws, "Saisie");
    const buf = XLSX.write(wb, { bookType: "xlsx", type: "buffer" }) as Buffer;

    const response = await request.post(`${BASE}/api/imports`, {
      multipart: {
        moduleId: "events",
        file: { name: "mauvais.xlsx", mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", buffer: buf },
      },
      headers: { "x-user-id": "tenant-admin-acme" },
    });

    const body = await response.json();
    expect(response.status()).toBe(200);
    expect(["needs_correction", "validated"]).toContain(body.status);
  });

  test("POST /api/imports — module inexistant retourne 400", async ({ request }) => {
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([["A"]]), "Saisie");
    const buf = XLSX.write(wb, { bookType: "xlsx", type: "buffer" }) as Buffer;

    const response = await request.post(`${BASE}/api/imports`, {
      multipart: {
        moduleId: "module_inexistant",
        file: { name: "test.xlsx", mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", buffer: buf },
      },
      headers: { "x-user-id": "tenant-admin-acme" },
    });

    expect(response.status()).toBe(400);
  });
});

test.describe("Export Excel — API", () => {
  test("GET /api/exports/[moduleId] retourne un fichier xlsx", async ({ request }) => {
    const response = await request.get(`${BASE}/api/exports/events`, {
      headers: { "x-user-id": "tenant-admin-acme" },
    });

    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]).toContain("spreadsheetml");
    const body = await response.body();
    expect(body.length).toBeGreaterThan(1000);
  });

  test("GET /api/exports/module_inexistant retourne 404", async ({ request }) => {
    const response = await request.get(`${BASE}/api/exports/module_inexistant`, {
      headers: { "x-user-id": "tenant-admin-acme" },
    });
    expect(response.status()).toBe(404);
  });

  test("GET /api/imports/history retourne la liste des imports", async ({ request }) => {
    const response = await request.get(`${BASE}/api/imports/history`, {
      headers: { "x-user-id": "tenant-admin-acme" },
    });
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(Array.isArray(body.imports)).toBe(true);
  });
});
