import { AlignmentType, Document, Footer, Header, HeadingLevel, Packer, PageBreak, PageNumber, Paragraph, Table, TableCell, TableRow, TextRun, WidthType } from "docx";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import * as XLSX from "xlsx";
import { getAlertSummary, getAlertsForTenant } from "@/lib/alerts-data";
import type { AuditEvent } from "@/lib/audit-data";
import { kpis, modules } from "@/lib/hse-data";
import type { ModuleTemplate } from "@/lib/hse-templates";
import { getModuleDashboardData } from "@/lib/module-dashboard-data";
import { getModuleRecords, type ModuleRecord } from "@/lib/module-records-data";
import { getImportHistory, getIntegratedModuleRecords } from "@/lib/import-store";
import { getTenant, getTenantActiveModules, getTenantSummary } from "@/lib/tenant-analytics";
import { drawHorizontalBarChart, drawComplianceGauge } from "@/lib/chart-renderer";

export function generateTemplateXlsx(template: ModuleTemplate) {
  const entryRows = [
    template.columns.map((column) => column.label),
    ...Array.from({ length: 25 }, () => template.columns.map(() => "")),
  ];

  const dictionaryRows = [
    ["Colonne", "Cle technique", "Obligatoire", "Type", "Valeurs autorisees"],
    ...template.columns.map((column) => [
      column.label,
      column.key,
      column.required ? "Oui" : "Non",
      column.type,
      column.values?.join(", ") ?? "",
    ]),
  ];

  const referenceRows = [
    ["Cle", "Valeur"],
    ...template.columns.flatMap((column) => (column.values ?? []).map((value) => [column.key, value])),
  ];

  const workbook = XLSX.utils.book_new();
  const entrySheet = XLSX.utils.aoa_to_sheet(entryRows);
  const dictionarySheet = XLSX.utils.aoa_to_sheet(dictionaryRows);
  const referenceSheet = XLSX.utils.aoa_to_sheet(referenceRows);

  entrySheet["!cols"] = template.columns.map((column) => ({ wch: Math.max(18, column.label.length + 4) }));
  dictionarySheet["!cols"] = [{ wch: 28 }, { wch: 22 }, { wch: 14 }, { wch: 12 }, { wch: 48 }];
  referenceSheet["!cols"] = [{ wch: 24 }, { wch: 28 }];

  XLSX.utils.book_append_sheet(workbook, entrySheet, "Saisie");
  XLSX.utils.book_append_sheet(workbook, dictionarySheet, "Dictionnaire");
  XLSX.utils.book_append_sheet(workbook, referenceSheet, "Referentiels");

  return XLSX.write(workbook, { bookType: "xlsx", type: "buffer" }) as Buffer;
}

export async function generateGlobalReportDocx() {
  const importHistory = getImportHistory().slice(0, 10);
  const importedByModule = modules.map((m) => ({
    ...m,
    imported: getIntegratedModuleRecords(m.id).length,
  }));

  const moduleRows = [
    new TableRow({
      tableHeader: true,
      children: ["Module", "Lignes (ref.)", "Imports reels", "Conformite", "Ouverts"].map(
        (label) =>
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: label, bold: true })] })],
          }),
      ),
    }),
    ...importedByModule.map(
      (module) =>
        new TableRow({
          children: [
            module.shortName,
            String(module.records),
            module.imported > 0 ? String(module.imported) : "—",
            `${module.compliance}%`,
            String(module.pendingItems),
          ].map((value) => new TableCell({ children: [new Paragraph(value)] })),
        }),
    ),
  ];

  const historyRows = [
    new TableRow({
      tableHeader: true,
      children: ["Date", "Module", "Fichier", "Lignes", "Statut"].map(
        (label) =>
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: label, bold: true })] })],
          }),
      ),
    }),
    ...importHistory.map(
      (item) =>
        new TableRow({
          children: [item.date, item.module, item.filename, `${item.acceptedRows}/${item.rows}`, item.status].map(
            (value) => new TableCell({ children: [new Paragraph(value)] }),
          ),
        }),
    ),
  ];

  const dateStr = new Date().toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
  const headerPara = new Header({
    children: [
      new Paragraph({
        alignment: AlignmentType.RIGHT,
        children: [
          new TextRun({ text: "Rapport Global HSE — ", size: 18, color: "444444" }),
          new TextRun({ text: dateStr, size: 18, color: "444444" }),
        ],
        border: { bottom: { color: "0f766e", size: 6, style: "single", space: 4 } },
      }),
    ],
  });
  const footerPara = new Footer({
    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({ text: "Page ", size: 16, color: "888888" }),
          new TextRun({ children: [PageNumber.CURRENT], size: 16, color: "888888" }),
          new TextRun({ text: " / ", size: 16, color: "888888" }),
          new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 16, color: "888888" }),
          new TextRun({ text: "  —  HSE Cockpit  —  Confidentiel", size: 16, color: "888888" }),
        ],
      }),
    ],
  });

  const doc = new Document({
    sections: [
      // Section 1 — Page de garde
      {
        properties: {},
        children: [
          new Paragraph({ spacing: { before: 2400 } }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: "RAPPORT GLOBAL HSE", bold: true, size: 52, color: "0f766e" })],
            spacing: { after: 200 },
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: "Synthese consolidee des indicateurs, modules et imports", size: 26, color: "444444" })],
            spacing: { after: 400 },
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: dateStr, size: 22, color: "666666" })],
            spacing: { after: 200 },
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: "Document confidentiel — usage interne", size: 18, italics: true, color: "888888" })],
          }),
          new Paragraph({ children: [new PageBreak()] }),
        ],
      },
      // Section 2 — Sommaire + contenu
      {
        properties: {},
        headers: { default: headerPara },
        footers: { default: footerPara },
        children: [
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            children: [new TextRun({ text: "Sommaire", bold: true, size: 32 })],
            spacing: { after: 200 },
          }),
          ...["1. Indicateurs cles", "2. Synthese par module", "3. Historique des imports recents"].map(
            (entry) => new Paragraph({ text: entry, spacing: { after: 80 } }),
          ),
          new Paragraph({ children: [new PageBreak()] }),
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            children: [new TextRun({ text: "1. Indicateurs cles", bold: true, size: 28, color: "0f766e" })],
            spacing: { before: 120, after: 160 },
          }),
          ...kpis.map((kpi) => new Paragraph({ text: `${kpi.label}: ${kpi.value} — ${kpi.trend}`, spacing: { after: 80 } })),
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            children: [new TextRun({ text: "2. Synthese par module", bold: true, size: 28, color: "0f766e" })],
            spacing: { before: 300, after: 160 },
          }),
          new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: moduleRows }),
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            children: [new TextRun({ text: "3. Historique des imports recents", bold: true, size: 28, color: "0f766e" })],
            spacing: { before: 300, after: 160 },
          }),
          importHistory.length > 0
            ? new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: historyRows })
            : new Paragraph({ text: "Aucun import enregistre." }),
        ],
      },
    ],
  });

  return Buffer.from(await Packer.toBuffer(doc));
}

function drawPageHeader(page: ReturnType<PDFDocument["addPage"]>, bold: Awaited<ReturnType<PDFDocument["embedFont"]>>, dateStr: string) {
  const w = page.getWidth();
  page.drawRectangle({ x: 0, y: page.getHeight() - 28, width: w, height: 28, color: rgb(0.06, 0.46, 0.43) });
  page.drawText("HSE Cockpit — Rapport Global", { x: 16, y: page.getHeight() - 19, size: 9, font: bold, color: rgb(1, 1, 1) });
  page.drawText(dateStr, { x: w - 100, y: page.getHeight() - 19, size: 9, font: bold, color: rgb(1, 1, 1) });
}

function drawPageFooter(page: ReturnType<PDFDocument["addPage"]>, regular: Awaited<ReturnType<PDFDocument["embedFont"]>>, pageNum: number, totalPages: number) {
  const w = page.getWidth();
  const muted = rgb(0.5, 0.5, 0.5);
  page.drawLine({ start: { x: 40, y: 36 }, end: { x: w - 40, y: 36 }, thickness: 0.5, color: muted });
  page.drawText(`Page ${pageNum} / ${totalPages}`, { x: 40, y: 22, size: 8, font: regular, color: muted });
  page.drawText("Confidentiel — usage interne", { x: w / 2 - 50, y: 22, size: 8, font: regular, color: muted });
}

export async function generateGlobalReportPdf() {
  const importedByModule = modules.map((m) => ({
    ...m,
    imported: getIntegratedModuleRecords(m.id).length,
  }));
  const importHistory = getImportHistory().slice(0, 12);
  const totalImported = importedByModule.reduce((s, m) => s + m.imported, 0);
  const dateStr = new Date().toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });

  const doc = await PDFDocument.create();
  const regular = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const ink = rgb(0.07, 0.09, 0.14);
  const muted = rgb(0.28, 0.32, 0.4);
  const brand = rgb(0.06, 0.46, 0.43);

  // ── Page de garde ──────────────────────────────────────────────────────────
  const coverPage = doc.addPage([595.28, 841.89]);
  coverPage.drawRectangle({ x: 0, y: 680, width: 595.28, height: 161.89, color: brand });
  coverPage.drawText("RAPPORT GLOBAL HSE", { x: 48, y: 760, size: 32, font: bold, color: rgb(1, 1, 1) });
  coverPage.drawText("Synthese consolidee des indicateurs, modules et imports", { x: 48, y: 720, size: 13, font: regular, color: rgb(0.85, 0.95, 0.93) });
  coverPage.drawText(dateStr, { x: 48, y: 560, size: 14, font: bold, color: ink });
  coverPage.drawText("Document confidentiel — usage interne exclusivement", { x: 48, y: 536, size: 10, font: regular, color: muted });
  const sommaire = [
    "1. Indicateurs cles HSE",
    "2. Synthese par module et imports reels",
    "3. Historique des imports recents",
  ];
  coverPage.drawText("Sommaire", { x: 48, y: 480, size: 13, font: bold, color: ink });
  sommaire.forEach((entry, i) => {
    coverPage.drawText(entry, { x: 60, y: 458 - i * 20, size: 11, font: regular, color: ink });
  });

  // ── Page contenu ──────────────────────────────────────────────────────────
  const contentPage = doc.addPage([595.28, 841.89]);
  let y = 800;
  drawPageHeader(contentPage, bold, dateStr);
  y -= 20;
  contentPage.drawText("Rapport global HSE", { x: 48, y, size: 22, font: bold, color: ink });
  y -= 28;
  contentPage.drawText("Synthese consolidee des modules, indicateurs et actions HSE.", { x: 48, y, size: 10, font: regular, color: muted });

  y -= 42;
  contentPage.drawText("1. Indicateurs cles HSE", { x: 48, y, size: 14, font: bold, color: brand });
  y -= 20;
  kpis.forEach((kpi) => {
    contentPage.drawText(`${kpi.label}: ${kpi.value} — ${kpi.trend}`, { x: 58, y, size: 10, font: regular, color: ink });
    y -= 16;
  });

  y -= 20;
  contentPage.drawText(`Donnees importees: ${totalImported} ligne(s) sur ${importHistory.length} import(s) valide(s)`, {
    x: 58, y, size: 10, font: regular, color: ink,
  });

  y -= 28;
  contentPage.drawText("2. Synthese par module", { x: 48, y, size: 14, font: bold, color: brand });
  y -= 22;
  contentPage.drawText("Module", { x: 58, y, size: 10, font: bold, color: ink });
  contentPage.drawText("Ref.", { x: 210, y, size: 10, font: bold, color: ink });
  contentPage.drawText("Imports reels", { x: 270, y, size: 10, font: bold, color: ink });
  contentPage.drawText("Conformite", { x: 380, y, size: 10, font: bold, color: ink });
  contentPage.drawText("Ouverts", { x: 470, y, size: 10, font: bold, color: ink });
  y -= 16;

  importedByModule.forEach((module) => {
    contentPage.drawText(module.shortName, { x: 58, y, size: 10, font: regular, color: ink });
    contentPage.drawText(String(module.records), { x: 210, y, size: 10, font: regular, color: ink });
    contentPage.drawText(module.imported > 0 ? String(module.imported) : "—", { x: 270, y, size: 10, font: regular, color: ink });
    contentPage.drawText(`${module.compliance}%`, { x: 380, y, size: 10, font: regular, color: ink });
    contentPage.drawText(String(module.pendingItems), { x: 470, y, size: 10, font: regular, color: ink });
    y -= 16;
  });

  if (importHistory.length > 0) {
    y -= 20;
    contentPage.drawText("3. Historique des imports recents", { x: 48, y, size: 14, font: bold, color: brand });
    y -= 18;
    contentPage.drawText("Date", { x: 58, y, size: 9, font: bold, color: ink });
    contentPage.drawText("Module", { x: 170, y, size: 9, font: bold, color: ink });
    contentPage.drawText("Fichier", { x: 280, y, size: 9, font: bold, color: ink });
    contentPage.drawText("Lignes", { x: 430, y, size: 9, font: bold, color: ink });
    contentPage.drawText("Statut", { x: 490, y, size: 9, font: bold, color: ink });
    y -= 14;
    importHistory.forEach((item) => {
      if (y < 60) return;
      contentPage.drawText(item.date.slice(0, 16), { x: 58, y, size: 8, font: regular, color: ink });
      contentPage.drawText(item.module.slice(0, 18), { x: 170, y, size: 8, font: regular, color: ink });
      contentPage.drawText(item.filename.slice(0, 22), { x: 280, y, size: 8, font: regular, color: ink });
      contentPage.drawText(`${item.acceptedRows}/${item.rows}`, { x: 430, y, size: 8, font: regular, color: ink });
      contentPage.drawText(item.status, { x: 490, y, size: 8, font: regular, color: ink });
      y -= 13;
    });
  }

  // ── Page graphiques ──────────────────────────────────────────────────────────
  const chartsPage = doc.addPage([595.28, 841.89]);
  drawPageHeader(chartsPage, bold, dateStr);

  const conformiteItems = importedByModule.map((m) => ({
    label: m.shortName,
    value: m.compliance,
    color: m.compliance >= 80 ? [0.06, 0.46, 0.43] as [number,number,number] : m.compliance >= 60 ? [0.85, 0.47, 0.04] as [number,number,number] : [0.86, 0.15, 0.15] as [number,number,number],
  }));

  const ouvertsItems = importedByModule.map((m) => ({
    label: m.shortName,
    value: m.pendingItems,
    color: [0.77, 0.25, 0.05] as [number, number, number],
  }));

  let cy = 790;
  chartsPage.drawText("Tableaux de bord graphiques", { x: 48, y: cy, size: 16, font: bold, color: rgb(0.07, 0.09, 0.14) });
  cy -= 30;

  cy = drawHorizontalBarChart(chartsPage, "Conformite par module (%)", conformiteItems, {
    x: 48, y: cy, width: 500, barHeight: 16, barGap: 6, labelWidth: 110, maxValue: 100, font: regular, boldFont: bold,
  });

  cy -= 20;
  cy = drawHorizontalBarChart(chartsPage, "Elements ouverts par module", ouvertsItems, {
    x: 48, y: cy, width: 500, barHeight: 16, barGap: 6, labelWidth: 110, font: regular, boldFont: bold,
  });

  cy -= 20;
  chartsPage.drawText("Conformite par module — synthese", { x: 48, y: cy, size: 11, font: bold, color: rgb(0.06, 0.46, 0.43) });
  cy -= 14;
  importedByModule.forEach((m, i) => {
    drawComplianceGauge(chartsPage, m.shortName, m.compliance, {
      x: 48 + (i % 4) * 130,
      y: cy - Math.floor(i / 4) * 60,
      font: regular,
      boldFont: bold,
    });
  });

  const pages = doc.getPages();
  pages.slice(1).forEach((p, i) => drawPageFooter(p, regular, i + 1, pages.length - 1));

  return Buffer.from(await doc.save());
}

export async function generateTenantReportDocx(tenantId: string) {
  const tenant = getTenant(tenantId);

  if (!tenant) {
    return null;
  }

  const activeModules = getTenantActiveModules(tenantId);
  const summary = getTenantSummary(tenantId);
  const rows = [
    new TableRow({
      tableHeader: true,
      children: ["Module", "Lignes", "Conformite", "Ouverts", "Dernier import"].map(
        (label) =>
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: label, bold: true })] })],
          }),
      ),
    }),
    ...activeModules.map(
      (module) =>
        new TableRow({
          children: [
            module.shortName,
            String(module.records),
            `${module.compliance}%`,
            String(module.pendingItems),
            module.lastImport,
          ].map((value) => new TableCell({ children: [new Paragraph(value)] })),
        }),
    ),
  ];

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({
            children: [new TextRun({ text: `Rapport HSE entreprise - ${tenant.name}`, bold: true, size: 34 })],
            spacing: { after: 240 },
          }),
          new Paragraph({
            text: `${tenant.sector} - ${tenant.country} - ${activeModules.length} module(s) actif(s).`,
            spacing: { after: 240 },
          }),
          new Paragraph({
            children: [new TextRun({ text: "KPI consolides", bold: true, size: 26 })],
            spacing: { before: 120, after: 120 },
          }),
          new Paragraph({ text: `Lignes consolidees: ${summary.totalRecords}` }),
          new Paragraph({ text: `Imports valides: ${summary.totalImports}` }),
          new Paragraph({ text: `Elements ouverts: ${summary.totalOpenItems}` }),
          new Paragraph({ text: `Conformite moyenne: ${summary.averageCompliance}%` }),
          new Paragraph({ text: `Alertes: ${summary.totalAlerts}` }),
          new Paragraph({
            children: [new TextRun({ text: "Modules actifs", bold: true, size: 26 })],
            spacing: { before: 300, after: 120 },
          }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows,
          }),
        ],
      },
    ],
  });

  return Buffer.from(await Packer.toBuffer(doc));
}

export async function generateTenantReportPdf(tenantId: string) {
  const tenant = getTenant(tenantId);

  if (!tenant) {
    return null;
  }

  const activeModules = getTenantActiveModules(tenantId);
  const summary = getTenantSummary(tenantId);
  const doc = await PDFDocument.create();
  const page = doc.addPage([595.28, 841.89]);
  const regular = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const ink = rgb(0.07, 0.09, 0.14);
  const muted = rgb(0.28, 0.32, 0.4);
  let y = 790;

  page.drawText(`Rapport HSE - ${tenant.name}`.slice(0, 72), { x: 48, y, size: 22, font: bold, color: ink });
  y -= 28;
  page.drawText(`${tenant.sector} - ${tenant.country} - ${activeModules.length} module(s) actif(s)`, {
    x: 48,
    y,
    size: 10,
    font: regular,
    color: muted,
  });

  y -= 42;
  page.drawText("KPI consolides", { x: 48, y, size: 14, font: bold, color: ink });
  y -= 20;
  [
    `Lignes consolidees: ${summary.totalRecords}`,
    `Imports valides: ${summary.totalImports}`,
    `Elements ouverts: ${summary.totalOpenItems}`,
    `Conformite moyenne: ${summary.averageCompliance}%`,
    `Alertes: ${summary.totalAlerts}`,
  ].forEach((line) => {
    page.drawText(line, { x: 58, y, size: 10, font: regular, color: ink });
    y -= 16;
  });

  y -= 20;
  page.drawText("Modules actifs", { x: 48, y, size: 14, font: bold, color: ink });
  y -= 22;
  page.drawText("Module", { x: 58, y, size: 10, font: bold, color: ink });
  page.drawText("Lignes", { x: 210, y, size: 10, font: bold, color: ink });
  page.drawText("Conformite", { x: 300, y, size: 10, font: bold, color: ink });
  page.drawText("Ouverts", { x: 420, y, size: 10, font: bold, color: ink });
  y -= 16;

  activeModules.forEach((module) => {
    page.drawText(module.shortName, { x: 58, y, size: 10, font: regular, color: ink });
    page.drawText(String(module.records), { x: 210, y, size: 10, font: regular, color: ink });
    page.drawText(`${module.compliance}%`, { x: 300, y, size: 10, font: regular, color: ink });
    page.drawText(String(module.pendingItems), { x: 420, y, size: 10, font: regular, color: ink });
    y -= 16;
  });

  return Buffer.from(await doc.save());
}

export async function generateModuleReportDocx(moduleId: string) {
  const module = modules.find((item) => item.id === moduleId);
  const dashboard = getModuleDashboardData(moduleId);

  if (!module || !dashboard) {
    return null;
  }

  const importedRecords = getIntegratedModuleRecords(moduleId);

  const importedRows = importedRecords.length > 0 ? [
    new TableRow({
      tableHeader: true,
      children: ["Date", "Site", "Element", "Categorie", "Responsable", "Statut"].map(
        (label) => new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: label, bold: true })] })] }),
      ),
    }),
    ...importedRecords.slice(0, 30).map(
      (rec) => new TableRow({
        children: [rec.date, rec.site, rec.label, rec.category, rec.owner, rec.status].map(
          (value) => new TableCell({ children: [new Paragraph(String(value))] }),
        ),
      }),
    ),
  ] : null;

  const indicatorRows = [
    new TableRow({
      tableHeader: true,
      children: ["Indicateur", "Valeur", "Tendance", "Statut"].map(
        (label) =>
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: label, bold: true })] })],
          }),
      ),
    }),
    ...dashboard.table.map(
      (row) =>
        new TableRow({
          children: [
            String(row.indicateur),
            String(row.valeur),
            String(row.tendance),
            String(row.statut),
          ].map((value) => new TableCell({ children: [new Paragraph(value)] })),
        }),
    ),
  ];

  const siteRows = [
    new TableRow({
      tableHeader: true,
      children: ["Site", "Conformite", "Alertes"].map(
        (label) =>
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: label, bold: true })] })],
          }),
      ),
    }),
    ...dashboard.siteComparison.map(
      (site) =>
        new TableRow({
          children: [
            site.site,
            `${site.conformite}%`,
            String(site.alertes),
          ].map((value) => new TableCell({ children: [new Paragraph(value)] })),
        }),
    ),
  ];

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({
            children: [new TextRun({ text: `Rapport module - ${module.name}`, bold: true, size: 32 })],
            spacing: { after: 220 },
          }),
          new Paragraph({ text: module.description, spacing: { after: 220 } }),
          new Paragraph({
            children: [new TextRun({ text: "KPI principaux", bold: true, size: 24 })],
            spacing: { before: 120, after: 120 },
          }),
          ...dashboard.headline.map((kpi) => new Paragraph({ text: `${kpi.label}: ${kpi.value} - ${kpi.detail}` })),
          new Paragraph({
            children: [new TextRun({ text: "Indicateurs de pilotage", bold: true, size: 24 })],
            spacing: { before: 260, after: 120 },
          }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: indicatorRows,
          }),
          new Paragraph({
            children: [new TextRun({ text: "Comparatif sites", bold: true, size: 24 })],
            spacing: { before: 260, after: 120 },
          }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: siteRows,
          }),
          new Paragraph({
            children: [new TextRun({ text: `Donnees importees (${importedRecords.length} ligne${importedRecords.length !== 1 ? "s" : ""})`, bold: true, size: 24 })],
            spacing: { before: 260, after: 120 },
          }),
          ...(importedRows
            ? [new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: importedRows })]
            : [new Paragraph({ text: "Aucun enregistrement importe pour ce module." })]),
        ],
      },
    ],
  });

  return Buffer.from(await Packer.toBuffer(doc));
}

export async function generateModuleReportPdf(moduleId: string) {
  const module = modules.find((item) => item.id === moduleId);
  const dashboard = getModuleDashboardData(moduleId);

  if (!module || !dashboard) {
    return null;
  }

  const importedRecords = getIntegratedModuleRecords(moduleId);
  const doc = await PDFDocument.create();
  const page = doc.addPage([595.28, 841.89]);
  const regular = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const ink = rgb(0.07, 0.09, 0.14);
  const muted = rgb(0.28, 0.32, 0.4);
  let y = 790;

  page.drawText(`Rapport module - ${module.shortName}`, { x: 48, y, size: 21, font: bold, color: ink });
  y -= 26;
  page.drawText(module.name.slice(0, 84), { x: 48, y, size: 10, font: regular, color: muted });

  y -= 40;
  page.drawText("KPI principaux", { x: 48, y, size: 14, font: bold, color: ink });
  y -= 20;
  dashboard.headline.forEach((kpi) => {
    page.drawText(`${kpi.label}: ${kpi.value} - ${kpi.detail}`.slice(0, 96), { x: 58, y, size: 10, font: regular, color: ink });
    y -= 16;
  });

  y -= 18;
  page.drawText("Indicateurs de pilotage", { x: 48, y, size: 14, font: bold, color: ink });
  y -= 20;
  dashboard.table.forEach((row) => {
    page.drawText(`${row.indicateur}: ${row.valeur} | ${row.tendance} | ${row.statut}`.slice(0, 98), {
      x: 58,
      y,
      size: 10,
      font: regular,
      color: ink,
    });
    y -= 16;
  });

  y -= 18;
  page.drawText("Comparatif sites", { x: 48, y, size: 14, font: bold, color: ink });
  y -= 20;
  dashboard.siteComparison.forEach((site) => {
    page.drawText(`${site.site}: ${site.conformite}% conformite | ${site.alertes} alerte(s)`, {
      x: 58, y, size: 10, font: regular, color: ink,
    });
    y -= 16;
  });

  if (importedRecords.length > 0) {
    y -= 20;
    page.drawText(`Donnees importees (${importedRecords.length} ligne${importedRecords.length !== 1 ? "s" : ""})`, {
      x: 48, y, size: 14, font: bold, color: ink,
    });
    y -= 18;
    page.drawText("Date", { x: 58, y, size: 9, font: bold, color: ink });
    page.drawText("Site", { x: 130, y, size: 9, font: bold, color: ink });
    page.drawText("Element", { x: 210, y, size: 9, font: bold, color: ink });
    page.drawText("Responsable", { x: 380, y, size: 9, font: bold, color: ink });
    page.drawText("Statut", { x: 480, y, size: 9, font: bold, color: ink });
    y -= 14;
    importedRecords.slice(0, 20).forEach((rec) => {
      if (y < 60) return;
      page.drawText(rec.date.slice(0, 10), { x: 58, y, size: 8, font: regular, color: ink });
      page.drawText(rec.site.slice(0, 14), { x: 130, y, size: 8, font: regular, color: ink });
      page.drawText(rec.label.slice(0, 30), { x: 210, y, size: 8, font: regular, color: ink });
      page.drawText(rec.owner.slice(0, 18), { x: 380, y, size: 8, font: regular, color: ink });
      page.drawText(rec.status, { x: 480, y, size: 8, font: regular, color: ink });
      y -= 13;
    });
  }

  return Buffer.from(await doc.save());
}

export async function generateAlertsReportDocx(tenantId?: string | null) {
  const alerts = getAlertsForTenant(tenantId);
  const summary = getAlertSummary(alerts);
  const perimeter = alerts[0]?.tenantName ?? tenantId ?? "Plateforme";
  const rows = [
    new TableRow({
      tableHeader: true,
      children: ["Entreprise", "Module", "Site", "Alerte", "Severite", "Statut", "Echeance", "Responsable"].map(
        (label) =>
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: label, bold: true })] })],
          }),
      ),
    }),
    ...alerts.map(
      (alert) =>
        new TableRow({
          children: [
            alert.tenantName,
            alert.moduleName,
            alert.site,
            alert.title,
            alert.severity,
            alert.status,
            alert.dueDate,
            alert.owner,
          ].map((value) => new TableCell({ children: [new Paragraph(value)] })),
        }),
    ),
  ];

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({
            children: [new TextRun({ text: `Rapport alertes HSE - ${perimeter}`, bold: true, size: 32 })],
            spacing: { after: 220 },
          }),
          new Paragraph({
            text: "Synthese des alertes critiques, echeances proches et recommandations de traitement.",
            spacing: { after: 220 },
          }),
          new Paragraph({
            children: [new TextRun({ text: "KPI alertes", bold: true, size: 24 })],
            spacing: { before: 120, after: 120 },
          }),
          new Paragraph({ text: `Alertes totales: ${summary.total}` }),
          new Paragraph({ text: `Critiques: ${summary.critical}` }),
          new Paragraph({ text: `Hautes: ${summary.high}` }),
          new Paragraph({ text: `Ouvertes: ${summary.open}` }),
          new Paragraph({
            children: [new TextRun({ text: "Registre prioritaire", bold: true, size: 24 })],
            spacing: { before: 260, after: 120 },
          }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows,
          }),
        ],
      },
    ],
  });

  return Buffer.from(await Packer.toBuffer(doc));
}

export async function generateAlertsReportPdf(tenantId?: string | null) {
  const alerts = getAlertsForTenant(tenantId);
  const summary = getAlertSummary(alerts);
  const perimeter = alerts[0]?.tenantName ?? tenantId ?? "Plateforme";
  const doc = await PDFDocument.create();
  const page = doc.addPage([595.28, 841.89]);
  const regular = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const ink = rgb(0.07, 0.09, 0.14);
  const muted = rgb(0.28, 0.32, 0.4);
  let y = 790;

  page.drawText(`Rapport alertes HSE - ${perimeter}`.slice(0, 72), { x: 48, y, size: 21, font: bold, color: ink });
  y -= 28;
  page.drawText("Alertes critiques, echeances proches et recommandations operationnelles.", {
    x: 48,
    y,
    size: 10,
    font: regular,
    color: muted,
  });

  y -= 42;
  page.drawText("KPI alertes", { x: 48, y, size: 14, font: bold, color: ink });
  y -= 20;
  [
    `Alertes totales: ${summary.total}`,
    `Critiques: ${summary.critical}`,
    `Hautes: ${summary.high}`,
    `Ouvertes: ${summary.open}`,
  ].forEach((line) => {
    page.drawText(line, { x: 58, y, size: 10, font: regular, color: ink });
    y -= 16;
  });

  y -= 20;
  page.drawText("Registre prioritaire", { x: 48, y, size: 14, font: bold, color: ink });
  y -= 22;
  page.drawText("Module", { x: 58, y, size: 9, font: bold, color: ink });
  page.drawText("Site", { x: 140, y, size: 9, font: bold, color: ink });
  page.drawText("Sev.", { x: 220, y, size: 9, font: bold, color: ink });
  page.drawText("Statut", { x: 280, y, size: 9, font: bold, color: ink });
  page.drawText("Echeance", { x: 360, y, size: 9, font: bold, color: ink });
  page.drawText("Alerte", { x: 430, y, size: 9, font: bold, color: ink });
  y -= 16;

  alerts.slice(0, 24).forEach((alert) => {
    page.drawText(alert.moduleName.slice(0, 15), { x: 58, y, size: 8, font: regular, color: ink });
    page.drawText(alert.site.slice(0, 15), { x: 140, y, size: 8, font: regular, color: ink });
    page.drawText(alert.severity.slice(0, 9), { x: 220, y, size: 8, font: regular, color: ink });
    page.drawText(alert.status.slice(0, 12), { x: 280, y, size: 8, font: regular, color: ink });
    page.drawText(alert.dueDate, { x: 360, y, size: 8, font: regular, color: ink });
    page.drawText(alert.title.slice(0, 34), { x: 430, y, size: 8, font: regular, color: ink });
    y -= 15;
  });

  return Buffer.from(await doc.save());
}

export function generateAuditReportXlsx(events: AuditEvent[], perimeter: string) {
  const rows = events.map((event) => ({
    Date: event.date,
    Entreprise: event.tenant,
    Acteur: event.actor,
    Action: event.action,
    Cible: event.target,
    Niveau: event.severity,
  }));
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(rows);
  worksheet["!cols"] = [
    { wch: 18 },
    { wch: 22 },
    { wch: 22 },
    { wch: 28 },
    { wch: 42 },
    { wch: 14 },
  ];
  XLSX.utils.book_append_sheet(workbook, worksheet, `Audit ${perimeter}`.slice(0, 31));

  return XLSX.write(workbook, { bookType: "xlsx", type: "buffer" }) as Buffer;
}

export async function generateAuditReportDocx(events: AuditEvent[], perimeter: string) {
  const rows = [
    new TableRow({
      tableHeader: true,
      children: ["Date", "Entreprise", "Acteur", "Action", "Cible", "Niveau"].map(
        (label) =>
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: label, bold: true })] })],
          }),
      ),
    }),
    ...events.map(
      (event) =>
        new TableRow({
          children: [event.date, event.tenant, event.actor, event.action, event.target, event.severity].map(
            (value) => new TableCell({ children: [new Paragraph(value)] }),
          ),
        }),
    ),
  ];

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({
            children: [new TextRun({ text: `Journal d'audit HSE - ${perimeter}`, bold: true, size: 32 })],
            spacing: { after: 220 },
          }),
          new Paragraph({
            text: "Trace des actions critiques, changements de droits, parametrages et operations sensibles.",
            spacing: { after: 220 },
          }),
          new Paragraph({ text: `Evenements: ${events.length}`, spacing: { after: 160 } }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows,
          }),
        ],
      },
    ],
  });

  return Buffer.from(await Packer.toBuffer(doc));
}

export async function generateAuditReportPdf(events: AuditEvent[], perimeter: string) {
  const doc = await PDFDocument.create();
  const page = doc.addPage([595.28, 841.89]);
  const regular = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const ink = rgb(0.07, 0.09, 0.14);
  const muted = rgb(0.28, 0.32, 0.4);
  let y = 790;

  page.drawText(`Journal d'audit HSE - ${perimeter}`.slice(0, 72), { x: 48, y, size: 21, font: bold, color: ink });
  y -= 28;
  page.drawText("Actions sensibles, droits, parametrages et operations auditees.", {
    x: 48,
    y,
    size: 10,
    font: regular,
    color: muted,
  });
  y -= 36;
  page.drawText(`Evenements: ${events.length}`, { x: 48, y, size: 12, font: bold, color: ink });
  y -= 26;

  page.drawText("Date", { x: 48, y, size: 8, font: bold, color: ink });
  page.drawText("Entreprise", { x: 126, y, size: 8, font: bold, color: ink });
  page.drawText("Acteur", { x: 212, y, size: 8, font: bold, color: ink });
  page.drawText("Action", { x: 300, y, size: 8, font: bold, color: ink });
  page.drawText("Cible", { x: 412, y, size: 8, font: bold, color: ink });
  page.drawText("Niv.", { x: 540, y, size: 8, font: bold, color: ink });
  y -= 14;

  events.slice(0, 32).forEach((event) => {
    page.drawText(event.date.slice(0, 16), { x: 48, y, size: 7, font: regular, color: ink });
    page.drawText(event.tenant.slice(0, 17), { x: 126, y, size: 7, font: regular, color: ink });
    page.drawText(event.actor.slice(0, 17), { x: 212, y, size: 7, font: regular, color: ink });
    page.drawText(event.action.slice(0, 23), { x: 300, y, size: 7, font: regular, color: ink });
    page.drawText(event.target.slice(0, 25), { x: 412, y, size: 7, font: regular, color: ink });
    page.drawText(event.severity.slice(0, 4), { x: 540, y, size: 7, font: regular, color: ink });
    y -= 13;
  });

  return Buffer.from(await doc.save());
}

export function generateModuleRecordsXlsx(moduleId: string, providedRecords?: ModuleRecord[]) {
  const module = modules.find((item) => item.id === moduleId);
  const records = providedRecords ?? getModuleRecords(moduleId);

  if (!module) {
    return null;
  }

  const rows = records.map((record) => ({
    Date: record.date,
    Site: record.site,
    Entite: record.entity,
    Element: record.label,
    Categorie: record.category,
    Responsable: record.owner,
    Priorite: record.priority,
    Echeance: record.dueDate,
    Statut: record.status,
  }));
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(rows);
  worksheet["!cols"] = [
    { wch: 14 },
    { wch: 18 },
    { wch: 24 },
    { wch: 42 },
    { wch: 24 },
    { wch: 20 },
    { wch: 14 },
    { wch: 14 },
    { wch: 14 },
  ];
  XLSX.utils.book_append_sheet(workbook, worksheet, module.shortName);

  return XLSX.write(workbook, { bookType: "xlsx", type: "buffer" }) as Buffer;
}
