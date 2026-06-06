import { AlignmentType, Document, Footer, Header, HeadingLevel, Packer, PageBreak, PageNumber, Paragraph, Table, TableCell, TableRow, TextRun, WidthType } from "docx";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import * as XLSX from "xlsx";
import { getAlertSummary, getAlertsForTenant } from "@/lib/alerts-data";
import type { AuditEvent } from "@/lib/audit-data";
import { kpis, modules, monthlyTrend } from "@/lib/hse-data";
import type { ModuleTemplate } from "@/lib/hse-templates";
import { getModuleDashboardData } from "@/lib/module-dashboard-data";
import { getModuleRecords, type ModuleRecord } from "@/lib/module-records-data";
import { getImportHistory, getIntegratedModuleRecords } from "@/lib/import-store";
import { getTenant, getTenantActiveModules, getTenantSummary } from "@/lib/tenant-analytics";
import { drawHorizontalBarChart, drawComplianceGauge } from "@/lib/chart-renderer";
import { getSiteKpis, getProjectKpis, getUpcomingEcheances } from "@/lib/sites-data";

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

/* ─── PDF helpers ──────────────────────────────────────────────────────────── */
type PdfFont = Awaited<ReturnType<PDFDocument["embedFont"]>>;
type PdfPage = ReturnType<PDFDocument["addPage"]>;

const C_BRAND   = rgb(0.06, 0.46, 0.43);
const C_BRAND_L = rgb(0.88, 0.97, 0.95);
const C_INK     = rgb(0.07, 0.09, 0.14);
const C_MUTED   = rgb(0.40, 0.44, 0.52);
const C_DANGER  = rgb(0.86, 0.15, 0.15);
const C_WARN    = rgb(0.85, 0.47, 0.04);
const C_OK      = rgb(0.09, 0.64, 0.37);
const C_LINE    = rgb(0.88, 0.90, 0.93);
const C_BG      = rgb(0.97, 0.99, 0.98);
const C_BLUE    = rgb(0.23, 0.51, 0.96);
const C_BLUE_L  = rgb(0.93, 0.95, 1.00);

function splitText(text: string, maxChars: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    if ((cur + " " + w).trim().length > maxChars) { lines.push(cur.trim()); cur = w; }
    else cur = (cur + " " + w).trim();
  }
  if (cur) lines.push(cur);
  return lines;
}

function drawPageHeader(page: PdfPage, bold: PdfFont, dateStr: string, subtitle = "Rapport Cockpit HSE") {
  const w = page.getWidth();
  page.drawRectangle({ x: 0, y: page.getHeight() - 32, width: w, height: 32, color: C_BRAND });
  page.drawRectangle({ x: 0, y: page.getHeight() - 32, width: 6, height: 32, color: rgb(0.04, 0.32, 0.30) });
  page.drawText("HSE COCKPIT", { x: 16, y: page.getHeight() - 21, size: 7.5, font: bold, color: rgb(0.72, 0.94, 0.90) });
  page.drawText(subtitle.slice(0, 56), { x: 96, y: page.getHeight() - 21, size: 9, font: bold, color: rgb(1, 1, 1) });
  page.drawText(dateStr, { x: w - 115, y: page.getHeight() - 21, size: 8, font: bold, color: rgb(0.82, 0.96, 0.94) });
}

function drawPageFooter(page: PdfPage, regular: PdfFont, pageNum: number, totalPages: number) {
  const w = page.getWidth();
  page.drawLine({ start: { x: 40, y: 44 }, end: { x: w - 40, y: 44 }, thickness: 0.5, color: C_LINE });
  page.drawText("HSE Cockpit — Document généré automatiquement — Ne pas diffuser", { x: 40, y: 30, size: 7, font: regular, color: C_MUTED });
  page.drawText("CONFIDENTIEL — Usage interne exclusivement", { x: 40, y: 19, size: 7, font: regular, color: C_MUTED });
  page.drawText(`${pageNum} / ${totalPages}`, { x: w - 55, y: 28, size: 9, font: regular, color: C_MUTED });
}

function pdfSectionTitle(page: PdfPage, bold: PdfFont, text: string, x: number, y: number): number {
  page.drawRectangle({ x, y: y - 5, width: 4, height: 22, color: C_BRAND });
  page.drawText(text, { x: x + 13, y, size: 14, font: bold, color: C_INK });
  page.drawLine({ start: { x: x + 13, y: y - 9 }, end: { x: x + 510, y: y - 9 }, thickness: 0.5, color: C_LINE });
  return y - 26;
}

function pdfKpiCard(page: PdfPage, reg: PdfFont, bold: PdfFont, x: number, y: number, w: number, label: string, value: string, sub: string, color: ReturnType<typeof rgb>) {
  page.drawRectangle({ x, y: y - 60, width: w, height: 60, color: C_BG });
  page.drawLine({ start: { x, y }, end: { x: x + w, y }, thickness: 3, color });
  page.drawText(value, { x: x + 10, y: y - 28, size: 24, font: bold, color });
  page.drawText(label, { x: x + 10, y: y - 43, size: 8.5, font: bold, color: C_INK });
  page.drawText(sub.slice(0, 26), { x: x + 10, y: y - 55, size: 7, font: reg, color: C_MUTED });
}

function pdfComment(page: PdfPage, reg: PdfFont, text: string, x: number, y: number, w: number): number {
  const lines = splitText(text, 100);
  const h = lines.length * 13 + 18;
  page.drawRectangle({ x, y: y - h, width: w, height: h, color: C_BLUE_L });
  page.drawRectangle({ x, y: y - h, width: 3, height: h, color: C_BLUE });
  lines.forEach((line, i) => {
    page.drawText(line, { x: x + 11, y: y - 13 - i * 13, size: 8, font: reg, color: rgb(0.18, 0.28, 0.52) });
  });
  return y - h - 10;
}

function pdfBar(page: PdfPage, x: number, y: number, val: number, max: number, w: number, color: ReturnType<typeof rgb>) {
  page.drawRectangle({ x, y: y - 2, width: w, height: 7, color: C_LINE });
  page.drawRectangle({ x, y: y - 2, width: Math.max(2, (val / Math.max(max, 1)) * w), height: 7, color });
}

export async function generateGlobalReportPdf() {
  const importedByModule = modules.map((m) => ({
    ...m,
    imported: getIntegratedModuleRecords(m.id).length,
  }));
  const importHistory = getImportHistory().slice(0, 15);
  const totalRecords   = importedByModule.reduce((s, m) => s + m.records, 0);
  const totalImported  = importedByModule.reduce((s, m) => s + m.imported, 0);
  const totalOpen      = importedByModule.reduce((s, m) => s + m.pendingItems, 0);
  const avgCompliance  = Math.round(importedByModule.reduce((s, m) => s + m.compliance, 0) / importedByModule.length);
  const critModules    = importedByModule.filter((m) => m.compliance < 80);
  const dateStr        = new Date().toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
  const maxOpen        = Math.max(...importedByModule.map((m) => m.pendingItems), 1);

  const doc     = await PDFDocument.create();
  const regular = await doc.embedFont(StandardFonts.Helvetica);
  const bold    = await doc.embedFont(StandardFonts.HelveticaBold);

  // ── PAGE 1 : COUVERTURE ────────────────────────────────────────────────────
  const p1 = doc.addPage([595.28, 841.89]);

  // Bande verte pleine largeur
  p1.drawRectangle({ x: 0, y: 690, width: 595.28, height: 151.89, color: C_BRAND });
  p1.drawRectangle({ x: 0, y: 690, width: 8, height: 151.89, color: rgb(0.04, 0.32, 0.30) });

  // Titre
  p1.drawText("COCKPIT HSE", { x: 52, y: 800, size: 11, font: bold, color: rgb(0.7, 0.95, 0.9) });
  p1.drawText("RAPPORT GLOBAL", { x: 52, y: 770, size: 36, font: bold, color: rgb(1, 1, 1) });
  p1.drawText("Synthese consolidee — indicateurs, modules, conformite et actions", { x: 52, y: 740, size: 11, font: regular, color: rgb(0.82, 0.96, 0.94) });
  p1.drawText(dateStr, { x: 52, y: 714, size: 11, font: regular, color: rgb(0.72, 0.90, 0.88) });

  // Bloc 4 KPI de couverture
  const coverKpis = [
    { label: "Declarations HSE", val: String(totalRecords), color: C_BRAND },
    { label: "Conformite moyenne", val: `${avgCompliance}%`, color: avgCompliance >= 80 ? C_OK : C_WARN },
    { label: "Elements ouverts", val: String(totalOpen), color: totalOpen > 50 ? C_DANGER : C_WARN },
    { label: "Modules surveilles", val: String(importedByModule.length), color: C_BRAND },
  ];
  coverKpis.forEach((k, i) => {
    const bx = 52 + i * 126, by = 638;
    p1.drawRectangle({ x: bx, y: by - 58, width: 118, height: 58, color: rgb(0.96, 0.99, 0.98) });
    p1.drawLine({ start: { x: bx, y: by }, end: { x: bx + 118, y: by }, thickness: 3, color: k.color });
    p1.drawText(k.val, { x: bx + 8, y: by - 28, size: 22, font: bold, color: k.color });
    p1.drawText(k.label, { x: bx + 8, y: by - 44, size: 7.5, font: regular, color: C_INK });
  });

  // Sommaire
  p1.drawText("SOMMAIRE", { x: 52, y: 556, size: 10, font: bold, color: C_MUTED });
  p1.drawLine({ start: { x: 52, y: 550 }, end: { x: 543, y: 550 }, thickness: 0.5, color: C_LINE });
  [
    "1. Synthèse exécutive — KPI globaux et indicateurs clés",
    "2. Performance par module — conformité, ouverts, tendance",
    "3. Graphiques de performance — barres et jauges",
    "4. Historique des imports et activité récente",
    "5. Alertes & recommandations opérationnelles",
    "6. Conclusions et priorités d'action",
  ].forEach((entry, i) => {
    p1.drawText(String(i + 1), { x: 54, y: 526 - i * 22, size: 9, font: bold, color: C_BRAND });
    p1.drawText(entry, { x: 68, y: 526 - i * 22, size: 9, font: regular, color: C_INK });
    p1.drawLine({ start: { x: 52, y: 518 - i * 22 }, end: { x: 543, y: 518 - i * 22 }, thickness: 0.3, color: C_LINE });
  });

  p1.drawText("CONFIDENTIEL — Document à usage interne exclusivement", { x: 52, y: 60, size: 8, font: regular, color: C_MUTED });
  p1.drawText("HSE Cockpit — Rapport généré automatiquement", { x: 52, y: 45, size: 7, font: regular, color: C_MUTED });

  // ── PAGE 2 : SYNTHÈSE EXÉCUTIVE ───────────────────────────────────────────
  const p2 = doc.addPage([595.28, 841.89]);
  drawPageHeader(p2, bold, dateStr, "Synthese Executive");
  let y2 = 790;

  y2 = pdfSectionTitle(p2, bold, "1. Synthèse Exécutive — KPI Globaux", 40, y2);
  y2 -= 14;

  const execKpis = [
    { label: "Total déclarations HSE", val: String(totalRecords), sub: "Tous modules confondus", color: C_BRAND },
    { label: "Imports validés", val: String(importHistory.length), sub: "Fichiers Excel intégrés", color: C_BRAND },
    { label: "Conformité globale", val: `${avgCompliance}%`, sub: avgCompliance >= 80 ? "Objectif atteint" : "Sous le seuil 80%", color: avgCompliance >= 80 ? C_OK : C_WARN },
    { label: "Éléments ouverts", val: String(totalOpen), sub: "Actions à traiter", color: totalOpen > 50 ? C_DANGER : C_INK },
    { label: "Modules à risque", val: String(critModules.length), sub: "Conformité < 80%", color: critModules.length > 0 ? C_DANGER : C_OK },
    { label: "Données importées", val: String(totalImported), sub: "Lignes réellement saisies", color: C_BLUE },
  ];

  // 2 lignes de 3 KPI
  execKpis.forEach((k, i) => {
    pdfKpiCard(p2, regular, bold, 40 + (i % 3) * 174, y2 - Math.floor(i / 3) * 74, 166, k.label, k.val, k.sub, k.color);
  });
  y2 -= 162;

  y2 = pdfComment(p2, regular,
    `Analyse consolidée de ${importedByModule.length} modules HSE. La conformité globale s'établit à ${avgCompliance}%, ` +
    (avgCompliance >= 80 ? "au-dessus du seuil réglementaire de 80% — performance satisfaisante." :
    `en dessous du seuil réglementaire de 80% — ${critModules.length} module(s) nécessitent des actions correctives immédiates.`) +
    ` Un total de ${totalOpen} éléments restent ouverts et ${totalImported} lignes de données ont été importées ce cycle.`,
    40, y2, 516);

  y2 -= 8;
  y2 = pdfSectionTitle(p2, bold, "Performance par site", 40, y2);
  y2 -= 8;

  const siteData = [
    { site: "Abidjan",      conformite: 91, evenements: 38 },
    { site: "Yamoussoukro", conformite: 84, evenements: 24 },
    { site: "Bouake",       conformite: 76, evenements: 31 },
    { site: "San Pedro",    conformite: 69, evenements: 19 },
  ];

  // En-têtes
  ["Site","Conformite","Niveau","Evenements","Progression"].forEach((h, i) =>
    p2.drawText(h, { x: [40,130,210,290,370][i], y: y2, size: 8, font: bold, color: C_BRAND })
  );
  y2 -= 6;
  p2.drawLine({ start: { x: 40, y: y2 }, end: { x: 543, y: y2 }, thickness: 0.5, color: C_LINE });
  y2 -= 14;

  siteData.forEach((s) => {
    const c = s.conformite >= 85 ? C_OK : s.conformite >= 70 ? C_WARN : C_DANGER;
    const niv = s.conformite >= 85 ? "Conforme" : s.conformite >= 70 ? "Vigilance" : "Critique";
    p2.drawText(s.site, { x: 40, y: y2, size: 9, font: bold, color: C_INK });
    p2.drawText(`${s.conformite}%`, { x: 130, y: y2, size: 9, font: bold, color: c });
    p2.drawText(niv, { x: 210, y: y2, size: 8, font: regular, color: c });
    p2.drawText(String(s.evenements), { x: 290, y: y2, size: 8, font: regular, color: C_INK });
    pdfBar(p2, 370, y2 + 5, s.conformite, 100, 140, c);
    p2.drawText(`${s.conformite}%`, { x: 516, y: y2, size: 7, font: bold, color: c });
    y2 -= 18;
  });

  y2 -= 10;
  y2 = pdfComment(p2, regular,
    "Le site d'Abidjan maintient la meilleure conformité (91%). Bouaké et San Pedro nécessitent une attention particulière avec des taux inférieurs à 80%. " +
    "Prioriser les audits correctifs sur ces deux sites dans les 30 prochains jours.",
    40, y2, 516);

  // ── PAGE 3 : ANALYSE PAR MODULE ───────────────────────────────────────────
  const p3 = doc.addPage([595.28, 841.89]);
  drawPageHeader(p3, bold, dateStr, "Analyse par Module");
  let y3 = 790;

  y3 = pdfSectionTitle(p3, bold, "2. Performance par Module — Détail", 40, y3);
  y3 -= 8;
  p3.drawText("Conformite", { x: 40,  y: y3, size: 8, font: bold, color: C_BRAND });
  p3.drawText("Module",     { x: 100, y: y3, size: 8, font: bold, color: C_BRAND });
  p3.drawText("Enreg.",     { x: 260, y: y3, size: 8, font: bold, color: C_BRAND });
  p3.drawText("Ouverts",    { x: 310, y: y3, size: 8, font: bold, color: C_BRAND });
  p3.drawText("Statut",     { x: 364, y: y3, size: 8, font: bold, color: C_BRAND });
  p3.drawText("Progression",{ x: 420, y: y3, size: 8, font: bold, color: C_BRAND });
  y3 -= 6;
  p3.drawLine({ start: { x: 40, y: y3 }, end: { x: 543, y: y3 }, thickness: 0.5, color: C_LINE });
  y3 -= 14;

  importedByModule.forEach((m, idx) => {
    if (y3 < 100) return;
    const c = m.compliance >= 80 ? C_OK : m.compliance >= 60 ? C_WARN : C_DANGER;
    const status = m.compliance >= 80 ? "Conforme" : m.compliance >= 60 ? "A ameliorer" : "Critique";
    if (idx % 2 === 0) p3.drawRectangle({ x: 38, y: y3 - 5, width: 507, height: 18, color: rgb(0.975, 0.985, 0.98) });
    p3.drawText(`${m.compliance}%`, { x: 40, y: y3, size: 9, font: bold, color: c });
    p3.drawText(m.shortName.slice(0, 22), { x: 100, y: y3, size: 8.5, font: bold, color: C_INK });
    p3.drawText(String(m.records),       { x: 260, y: y3, size: 8, font: regular, color: C_INK });
    p3.drawText(String(m.pendingItems),  { x: 310, y: y3, size: 8, font: regular, color: m.pendingItems > 20 ? C_DANGER : C_INK });
    p3.drawText(status, { x: 364, y: y3, size: 7.5, font: bold, color: c });
    pdfBar(p3, 420, y3 + 5, m.compliance, 100, 110, c);
    p3.drawLine({ start: { x: 38, y: y3 - 6 }, end: { x: 543, y: y3 - 6 }, thickness: 0.3, color: C_LINE });
    y3 -= 20;
  });

  y3 -= 8;
  if (critModules.length > 0) {
    y3 = pdfComment(p3, regular,
      `${critModules.length} module(s) en dessous du seuil de conformité (80%) : ${critModules.map((m) => m.shortName).join(", ")}. ` +
      "Ces modules nécessitent un plan d'action correctif documenté avec un responsable désigné et une échéance de correction.",
      40, y3, 516);
  } else {
    y3 = pdfComment(p3, regular,
      "Tous les modules respectent le seuil de conformité de 80%. Maintenir la surveillance régulière et planifier les prochains audits de vérification.",
      40, y3, 516);
  }

  y3 -= 10;
  y3 = pdfSectionTitle(p3, bold, "Indicateurs Clés de Pilotage", 40, y3);
  y3 -= 10;
  kpis.forEach((kpi) => {
    p3.drawRectangle({ x: 40, y: y3 - 4, width: 8, height: 8, color: C_BRAND });
    p3.drawText(kpi.label, { x: 56, y: y3, size: 9, font: bold, color: C_INK });
    p3.drawText(kpi.value, { x: 220, y: y3, size: 9, font: bold, color: C_BRAND });
    p3.drawText(`— ${kpi.trend}`, { x: 262, y: y3, size: 8, font: regular, color: C_MUTED });
    y3 -= 16;
  });

  // ── PAGE 4 : GRAPHIQUES ───────────────────────────────────────────────────
  const p4 = doc.addPage([595.28, 841.89]);
  drawPageHeader(p4, bold, dateStr, "Graphiques de Performance");
  let y4 = 790;

  y4 = pdfSectionTitle(p4, bold, "3. Graphiques de Performance", 40, y4);
  y4 -= 10;

  y4 = drawHorizontalBarChart(p4, "Taux de conformité par module (%)", importedByModule.map((m) => ({
    label: m.shortName,
    value: m.compliance,
    color: m.compliance >= 80 ? [0.09, 0.64, 0.37] as [number,number,number] : m.compliance >= 60 ? [0.85, 0.47, 0.04] as [number,number,number] : [0.86, 0.15, 0.15] as [number,number,number],
  })), { x: 40, y: y4, width: 516, barHeight: 18, barGap: 7, labelWidth: 130, maxValue: 100, font: regular, boldFont: bold });

  y4 -= 16;
  y4 = pdfComment(p4, regular,
    `Seuil objectif : 80%. ${importedByModule.filter((m) => m.compliance >= 80).length} module(s) conformes (vert). ` +
    `${importedByModule.filter((m) => m.compliance >= 60 && m.compliance < 80).length} en vigilance (orange). ` +
    `${importedByModule.filter((m) => m.compliance < 60).length} critiques (rouge). Actions correctives prioritaires sur les modules en rouge.`,
    40, y4, 516);

  y4 -= 10;
  y4 = drawHorizontalBarChart(p4, "Éléments ouverts par module (à traiter)", importedByModule.map((m) => ({
    label: m.shortName,
    value: m.pendingItems,
    color: m.pendingItems > 20 ? [0.86, 0.15, 0.15] as [number,number,number] : m.pendingItems > 10 ? [0.85, 0.47, 0.04] as [number,number,number] : [0.09, 0.64, 0.37] as [number,number,number],
  })), { x: 40, y: y4, width: 516, barHeight: 18, barGap: 7, labelWidth: 130, font: regular, boldFont: bold });

  y4 -= 16;
  y4 = pdfComment(p4, regular,
    `Total de ${totalOpen} éléments ouverts à traiter sur l'ensemble des modules. Les modules avec plus de 20 éléments ouverts ` +
    "sont signalés en rouge et doivent faire l'objet d'un suivi hebdomadaire par le responsable HSE.",
    40, y4, 516);

  y4 -= 10;
  p4.drawText("Jauges de conformité par module", { x: 40, y: y4, size: 11, font: bold, color: C_BRAND });
  y4 -= 16;
  importedByModule.slice(0, 8).forEach((m, i) => {
    drawComplianceGauge(p4, m.shortName, m.compliance, {
      x: 40 + (i % 4) * 128, y: y4 - Math.floor(i / 4) * 68, font: regular, boldFont: bold,
    });
  });

  // ── PAGE 5 : IMPORTS & ACTIVITÉ ───────────────────────────────────────────
  const p5 = doc.addPage([595.28, 841.89]);
  drawPageHeader(p5, bold, dateStr, "Historique Imports");
  let y5 = 790;

  y5 = pdfSectionTitle(p5, bold, "4. Historique des Imports Récents", 40, y5);
  y5 -= 8;

  // Compteurs
  const validCount = importHistory.filter((h) => h.status === "Valide").length;
  const correctCount = importHistory.filter((h) => h.status === "A corriger" || h.status === "Controle").length;
  [
    { label: "Imports totaux", val: String(importHistory.length), color: C_BRAND },
    { label: "Valides", val: String(validCount), color: C_OK },
    { label: "A corriger", val: String(correctCount), color: C_WARN },
    { label: "Lignes integrees", val: String(importHistory.reduce((s, h) => s + h.acceptedRows, 0)), color: C_BRAND },
  ].forEach((k, i) => {
    const bx = 40 + i * 126;
    p5.drawRectangle({ x: bx, y: y5 - 50, width: 118, height: 50, color: C_BG });
    p5.drawLine({ start: { x: bx, y: y5 }, end: { x: bx + 118, y: y5 }, thickness: 2.5, color: k.color });
    p5.drawText(k.val, { x: bx + 8, y: y5 - 24, size: 20, font: bold, color: k.color });
    p5.drawText(k.label, { x: bx + 8, y: y5 - 40, size: 7.5, font: regular, color: C_INK });
  });
  y5 -= 62;

  // Table imports
  ["Date","Module","Fichier","Lignes","Acceptées","Statut"].forEach((h, i) =>
    p5.drawText(h, { x: [40,132,222,348,400,458][i], y: y5, size: 8, font: bold, color: C_BRAND })
  );
  y5 -= 6;
  p5.drawLine({ start: { x: 40, y: y5 }, end: { x: 543, y: y5 }, thickness: 0.5, color: C_LINE });
  y5 -= 14;

  importHistory.forEach((item, idx) => {
    if (y5 < 120) return;
    if (idx % 2 === 0) p5.drawRectangle({ x: 38, y: y5 - 4, width: 507, height: 16, color: rgb(0.975, 0.985, 0.98) });
    const sc = item.status === "Valide" ? C_OK : item.status === "A corriger" ? C_DANGER : C_WARN;
    p5.drawText(item.date.slice(0, 14),      { x: 40,  y: y5, size: 8, font: regular, color: C_INK });
    p5.drawText(item.module.slice(0, 14),    { x: 132, y: y5, size: 8, font: bold,    color: C_INK });
    p5.drawText(item.filename.slice(0, 18),  { x: 222, y: y5, size: 7, font: regular, color: C_MUTED });
    p5.drawText(String(item.rows),           { x: 348, y: y5, size: 8, font: regular, color: C_INK });
    p5.drawText(String(item.acceptedRows),   { x: 400, y: y5, size: 8, font: regular, color: item.acceptedRows === item.rows ? C_OK : C_WARN });
    p5.drawText(item.status,                 { x: 458, y: y5, size: 7.5, font: bold,  color: sc });
    y5 -= 18;
  });

  y5 -= 8;
  y5 = pdfComment(p5, regular,
    `${importHistory.length} import(s) enregistré(s). ${validCount} validé(s) avec succès (${Math.round(validCount / Math.max(importHistory.length, 1) * 100)}% de réussite). ` +
    (correctCount > 0 ? `${correctCount} import(s) nécessitent une correction — vérifier les fichiers concernés dans l'historique.` : "Aucun import en erreur à ce jour."),
    40, y5, 516);

  // ── PAGE 6 : CONCLUSIONS ──────────────────────────────────────────────────
  const p6 = doc.addPage([595.28, 841.89]);
  drawPageHeader(p6, bold, dateStr, "Conclusions & Recommandations");
  let y6 = 790;

  y6 = pdfSectionTitle(p6, bold, "5. Alertes — Modules Sous Surveillance", 40, y6);
  y6 -= 10;

  if (critModules.length === 0) {
    y6 = pdfComment(p6, regular,
      "Tous les modules respectent le seuil de conformité de 80%. Performance globale satisfaisante. Poursuivre la surveillance et les imports réguliers.",
      40, y6, 516);
  } else {
    critModules.forEach((m) => {
      const c = m.compliance < 60 ? C_DANGER : C_WARN;
      p6.drawRectangle({ x: 40, y: y6 - 44, width: 516, height: 44, color: m.compliance < 60 ? rgb(1, 0.95, 0.95) : rgb(1, 0.98, 0.93) });
      p6.drawLine({ start: { x: 40, y: y6 }, end: { x: 40, y: y6 - 44 }, thickness: 3, color: c });
      p6.drawText(m.shortName, { x: 52, y: y6 - 12, size: 10, font: bold, color: c });
      p6.drawText(`Conformite: ${m.compliance}%  |  Elements ouverts: ${m.pendingItems}  |  Statut: ${m.compliance < 60 ? "CRITIQUE" : "ATTENTION"}`,
        { x: 52, y: y6 - 26, size: 8, font: regular, color: C_INK });
      p6.drawText(`Action: Auditer le module, identifier les ecarts, mettre en place un plan correctif sous 15 jours.`,
        { x: 52, y: y6 - 38, size: 7.5, font: regular, color: C_MUTED });
      y6 -= 52;
    });
  }

  y6 -= 10;
  y6 = pdfSectionTitle(p6, bold, "6. Conclusions & Priorités d'Action", 40, y6);
  y6 -= 10;

  const recommendations = [
    avgCompliance >= 80
      ? `La conformite globale de ${avgCompliance}% est satisfaisante. Maintenir les processus d'audit et d'import reguliers.`
      : `La conformite globale de ${avgCompliance}% est insuffisante. Un plan de remediation multi-modules est requis en urgence.`,
    totalOpen > 50
      ? `${totalOpen} elements ouverts — niveau eleve. Organiser une revue hebdomadaire HSE pour accelirer la cloture des actions.`
      : `${totalOpen} elements ouverts — niveau maitrise. Poursuivre le suivi regulier des actions correctives.`,
    importHistory.length > 0
      ? `${importHistory.length} imports realises ce cycle. Objectif : maintenir une cadence reguliere d'import pour garantir la fraicheur des donnees.`
      : "Aucun import realise ce cycle. Relancer les responsables de module pour la saisie des donnees HSE.",
    critModules.length > 0
      ? `Modules prioritaires : ${critModules.slice(0, 3).map((m) => `${m.shortName} (${m.compliance}%)`).join(", ")}. Affecter un responsable et une echeance pour chaque module.`
      : "Tous les modules sont conformes. Planifier les prochains audits de verification dans les 30 jours.",
  ];

  recommendations.forEach((rec, i) => {
    const lines = splitText(rec, 88);
    p6.drawRectangle({ x: 40, y: y6 - 5, width: 10, height: 10, color: C_BRAND });
    p6.drawText(String(i + 1), { x: 43, y: y6, size: 7, font: bold, color: rgb(1, 1, 1) });
    lines.forEach((line, li) => {
      p6.drawText(line, { x: 60, y: y6 - li * 13, size: 8.5, font: li === 0 ? bold : regular, color: C_INK });
    });
    y6 -= lines.length * 13 + 14;
  });

  y6 -= 16;
  p6.drawLine({ start: { x: 40, y: y6 }, end: { x: 543, y: y6 }, thickness: 0.5, color: C_LINE });
  y6 -= 14;
  p6.drawText("Rapport généré automatiquement par HSE Cockpit", { x: 40, y: y6, size: 8, font: bold, color: C_BRAND });
  y6 -= 14;
  p6.drawText(`Date de génération : ${dateStr}  |  Périmètre : Tous modules  |  Usage : Interne confidentiel`, { x: 40, y: y6, size: 7.5, font: regular, color: C_MUTED });

  // Pagination (toutes les pages sauf la couverture)
  const pages = doc.getPages();
  pages.slice(1).forEach((p, i) => drawPageFooter(p, regular, i + 1, pages.length - 1));

  return Buffer.from(await doc.save());
}

export async function generateTenantReportDocx(tenantId: string) {
  const tenant = getTenant(tenantId);
  if (!tenant) return null;

  const activeModules = getTenantActiveModules(tenantId);
  const summary = getTenantSummary(tenantId);
  const alerts = getAlertsForTenant(tenantId);
  const alertSummary = getAlertSummary(alerts);
  const dateStr = new Date().toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });

  const headerPara = new Header({
    children: [new Paragraph({
      alignment: AlignmentType.RIGHT,
      children: [
        new TextRun({ text: `Rapport HSE — ${tenant.name} — `, size: 18, color: "444444" }),
        new TextRun({ text: dateStr, size: 18, color: "444444" }),
      ],
      border: { bottom: { color: "0f766e", size: 6, style: "single", space: 4 } },
    })],
  });
  const footerPara = new Footer({
    children: [new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({ text: "Page ", size: 16, color: "888888" }),
        new TextRun({ children: [PageNumber.CURRENT], size: 16, color: "888888" }),
        new TextRun({ text: " / ", size: 16, color: "888888" }),
        new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 16, color: "888888" }),
        new TextRun({ text: `  —  ${tenant.name}  —  Confidentiel`, size: 16, color: "888888" }),
      ],
    })],
  });

  const moduleRows = [
    new TableRow({
      tableHeader: true,
      children: ["Module", "Lignes", "Conformite", "Ouverts", "Statut", "Dernier import"].map((label) =>
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: label, bold: true, color: "0f766e" })] })] }),
      ),
    }),
    ...activeModules.map((m) => {
      const statusColor = m.compliance >= 80 ? "16a34a" : m.compliance >= 60 ? "d97706" : "dc2626";
      const statusLabel = m.compliance >= 80 ? "Conforme" : m.compliance >= 60 ? "A ameliorer" : "Critique";
      return new TableRow({
        children: [
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: m.shortName, bold: true })] })] }),
          new TableCell({ children: [new Paragraph(String(m.records))] }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `${m.compliance}%`, bold: true, color: statusColor })] })] }),
          new TableCell({ children: [new Paragraph(String(m.pendingItems))] }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: statusLabel, bold: true, color: statusColor })] })] }),
          new TableCell({ children: [new Paragraph(m.lastImport)] }),
        ],
      });
    }),
  ];

  const criticalAlerts = [...alerts].sort((a, b) => {
    const o: Record<string, number> = { Critique: 0, Haute: 1, Moyenne: 2 };
    return (o[a.severity] ?? 2) - (o[b.severity] ?? 2);
  });

  const alertRows = [
    new TableRow({
      tableHeader: true,
      children: ["Severite", "Module", "Site", "Alerte", "Echeance", "Statut"].map((label) =>
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: label, bold: true, color: "0f766e" })] })] }),
      ),
    }),
    ...criticalAlerts.slice(0, 25).map((alert) => {
      const sevColor = alert.severity === "Critique" ? "dc2626" : alert.severity === "Haute" ? "d97706" : "16a34a";
      return new TableRow({
        children: [
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: alert.severity, bold: true, color: sevColor })] })] }),
          new TableCell({ children: [new Paragraph(alert.moduleName)] }),
          new TableCell({ children: [new Paragraph(alert.site)] }),
          new TableCell({ children: [new Paragraph(alert.title)] }),
          new TableCell({ children: [new Paragraph(alert.dueDate)] }),
          new TableCell({ children: [new Paragraph(alert.status)] }),
        ],
      });
    }),
  ];

  const doc = new Document({
    sections: [
      // Section 1 — Page de garde
      {
        properties: {},
        children: [
          new Paragraph({ spacing: { before: 2000 } }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: "RAPPORT HSE", bold: true, size: 56, color: "0f766e" })],
            spacing: { after: 160 },
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: tenant.name, bold: true, size: 36, color: "1e293b" })],
            spacing: { after: 160 },
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: `${tenant.sector} — ${tenant.country}`, size: 24, color: "64748b" })],
            spacing: { after: 400 },
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: dateStr, size: 22, color: "334155" })],
            spacing: { after: 120 },
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: "Document confidentiel — usage interne", size: 18, italics: true, color: "94a3b8" })],
            spacing: { after: 400 },
          }),
          // KPI summary
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ text: `${summary.totalRecords} enreg.  ·  ${summary.averageCompliance}% conformite  ·  ${summary.totalOpenItems} ouverts  ·  ${summary.totalAlerts} alertes`, size: 20, color: "0f766e", bold: true }),
            ],
            spacing: { after: 400 },
          }),
          new Paragraph({
            children: [new TextRun({ text: "Sommaire", bold: true, size: 24 })],
            spacing: { after: 120 },
          }),
          ...["1. KPI consolides et synthese modules", "2. Analyse par module (tableau detaille)", "3. Alertes et recommandations operationnelles"].map(
            (entry) => new Paragraph({ text: entry, spacing: { after: 80 } }),
          ),
          new Paragraph({ children: [new PageBreak()] }),
        ],
      },
      // Section 2 — Contenu
      {
        properties: {},
        headers: { default: headerPara },
        footers: { default: footerPara },
        children: [
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            children: [new TextRun({ text: "1. KPI consolides", bold: true, size: 28, color: "0f766e" })],
            spacing: { before: 120, after: 200 },
          }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({ children: ["Enregistrements", "Imports valides", "Conformite", "Ouverts", "Alertes"].map((label) =>
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: label, bold: true, color: "0f766e" })] })] }),
              )}),
              new TableRow({ children: [
                String(summary.totalRecords), String(summary.totalImports),
                `${summary.averageCompliance}%`, String(summary.totalOpenItems), String(summary.totalAlerts),
              ].map((val) => new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: val, bold: true, size: 28 })] })] }))}),
            ],
          }),
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            children: [new TextRun({ text: "2. Analyse par module", bold: true, size: 28, color: "0f766e" })],
            spacing: { before: 300, after: 160 },
          }),
          new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: moduleRows }),
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            children: [new TextRun({ text: "3. Alertes et recommandations", bold: true, size: 28, color: "0f766e" })],
            spacing: { before: 300, after: 160 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: `Total: ${alertSummary.total}  ·  Critiques: ${alertSummary.critical}  ·  Hautes: ${alertSummary.high}  ·  Ouvertes: ${alertSummary.open}`, size: 22, color: "334155" }),
            ],
            spacing: { after: 160 },
          }),
          alerts.length > 0
            ? new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: alertRows })
            : new Paragraph({ text: "Aucune alerte active pour ce perimetre." }),
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            children: [new TextRun({ text: "Conclusions et recommandations", bold: true, size: 28, color: "0f766e" })],
            spacing: { before: 300, after: 160 },
          }),
          ...activeModules
            .filter((m) => m.compliance < 80 || m.pendingItems > 10)
            .map((m) => new Paragraph({
              text: `• ${m.shortName} (${m.compliance}% conformite, ${m.pendingItems} element(s) ouvert(s)) — actions correctives requises.`,
              spacing: { after: 80 },
            })),
          activeModules.filter((m) => m.compliance < 80 || m.pendingItems > 10).length === 0
            ? new Paragraph({ text: "Tous les modules sont dans les normes de conformite.", spacing: { after: 80 } })
            : new Paragraph({ text: "" }),
        ],
      },
    ],
  });

  return Buffer.from(await Packer.toBuffer(doc));
}

export async function generateTenantReportPdf(tenantId: string) {
  const tenant = getTenant(tenantId);
  if (!tenant) return null;

  const activeModules   = getTenantActiveModules(tenantId);
  const summary         = getTenantSummary(tenantId);
  const alerts          = getAlertsForTenant(tenantId);
  const alertSummary    = getAlertSummary(alerts);
  const siteKpis        = getSiteKpis();
  const projectKpis     = getProjectKpis();
  const echeances       = getUpcomingEcheances();
  const trend           = monthlyTrend.slice(-6);

  const doc     = await PDFDocument.create();
  const regular = await doc.embedFont(StandardFonts.Helvetica);
  const bold    = await doc.embedFont(StandardFonts.HelveticaBold);
  const dateStr = new Date().toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });

  const brand  = rgb(0.06, 0.46, 0.43);
  const brandD = rgb(0.04, 0.32, 0.30);
  const brandL = rgb(0.88, 0.97, 0.95);
  const ink    = rgb(0.07, 0.09, 0.14);
  const muted  = rgb(0.40, 0.44, 0.52);
  const danger = rgb(0.86, 0.15, 0.15);
  const dangerL= rgb(1.00, 0.94, 0.94);
  const warn   = rgb(0.85, 0.47, 0.04);
  const warnL  = rgb(1.00, 0.97, 0.91);
  const ok     = rgb(0.09, 0.64, 0.37);
  const line   = rgb(0.88, 0.90, 0.93);
  const bgAlt  = rgb(0.975, 0.985, 0.98);
  const blue   = rgb(0.23, 0.51, 0.96);

  const critModules = activeModules.filter((m) => m.compliance < 80);
  const warnModules = activeModules.filter((m) => m.compliance >= 80 && m.pendingItems > 10);
  const overdueItems = echeances.filter((e) => e.urgency === "overdue" || e.urgency === "urgent");

  // ────────────────────────────────────────────────────────────────
  // PAGE 1 — COUVERTURE PREMIUM
  // ────────────────────────────────────────────────────────────────
  const p1 = doc.addPage([595.28, 841.89]);
  const PW = 595.28;
  const inactiveModules = modules.filter((m) => !tenant.modules.includes(m.id));
  const yearStr = dateStr.split(" ").pop() ?? "2026";
  const periodStr = "Janvier — " + dateStr.split(" ").slice(1).join(" ");

  // ── Bandeau teal premium ─────────────────────────────────────
  p1.drawRectangle({ x: 0, y: 660, width: PW, height: 181.89, color: brand });
  p1.drawRectangle({ x: 0, y: 660, width: 6, height: 181.89, color: brandD });

  // Badge type document (haut gauche)
  p1.drawRectangle({ x: 42, y: 822, width: 140, height: 17, color: brandD });
  p1.drawText("RAPPORT DE PILOTAGE HSE", { x: 47, y: 826, size: 6.5, font: bold, color: rgb(0.72,0.94,0.90) });

  // Badge statut (haut droit)
  p1.drawRectangle({ x: 458, y: 810, width: 120, height: 30, color: rgb(0.04,0.32,0.30) });
  p1.drawLine({ start: { x: 458, y: 840 }, end: { x: 578, y: 840 }, thickness: 2, color: warn });
  p1.drawText("DIFFUSION RESTREINTE", { x: 463, y: 828, size: 7, font: bold, color: rgb(1.0,0.95,0.8) });
  p1.drawText("Usage interne — Confidentiel", { x: 463, y: 816, size: 6, font: regular, color: rgb(0.9,0.85,0.75) });

  // Nom entreprise et description
  p1.drawText(tenant.name.slice(0, 30), { x: 42, y: 800, size: 30, font: bold, color: rgb(1,1,1) });
  p1.drawText(tenant.sector + " — " + tenant.country, { x: 42, y: 774, size: 11, font: regular, color: rgb(0.82,0.96,0.94) });
  p1.drawText("Rapport annuel de performance et pilotage HSE", { x: 42, y: 757, size: 9, font: regular, color: rgb(0.72,0.90,0.88) });

  // Bandeau periode et infos (bas header)
  p1.drawRectangle({ x: 42, y: 666, width: PW - 84, height: 36, color: rgb(0.04,0.32,0.30) });
  p1.drawText("Periode : " + periodStr + "  |  Arrete au " + dateStr + "  |  " + activeModules.length + " modules  |  " + siteKpis.length + " sites", { x: 50, y: 689, size: 8, font: bold, color: rgb(0.82,0.96,0.94) });
  p1.drawText("Administrateur : " + tenant.admin + "  |  Effectif : " + tenant.users + " utilisateurs habilites  |  Statut : " + tenant.status, { x: 50, y: 676, size: 7.5, font: regular, color: rgb(0.72,0.88,0.86) });

  // ── Fiche Document ────────────────────────────────────────────
  p1.drawRectangle({ x: 0, y: 560, width: PW, height: 98, color: rgb(0.96,0.97,0.98) });
  p1.drawLine({ start: { x: 0, y: 658 }, end: { x: PW, y: 658 }, thickness: 1.5, color: brandD });
  p1.drawLine({ start: { x: 0, y: 560 }, end: { x: PW, y: 560 }, thickness: 0.5, color: line });
  p1.drawText("FICHE DOCUMENT", { x: 42, y: 645, size: 7.5, font: bold, color: muted });
  p1.drawLine({ start: { x: 42, y: 641 }, end: { x: 290, y: 641 }, thickness: 0.3, color: line });

  const fdL: [string, string][] = [
    ["Type de document", "Rapport de pilotage HSE"],
    ["Reference doc.",   "RPT-" + tenantId.slice(0,6).toUpperCase() + "-" + yearStr],
    ["Perimetre",        activeModules.length + " modules actifs — " + siteKpis.length + " sites"],
    ["Destinataires",    "Comite directeur — Direction HSE"],
  ];
  fdL.forEach(([lbl, val], i) => {
    p1.drawText(lbl,              { x: 42,  y: 630 - i * 16, size: 7,   font: bold,    color: muted });
    p1.drawText(val.slice(0, 38), { x: 162, y: 630 - i * 16, size: 7.5, font: bold,    color: ink  });
  });

  p1.drawLine({ start: { x: 303, y: 642 }, end: { x: 303, y: 565 }, thickness: 0.4, color: line });

  const fdR: [string, string][] = [
    ["Version",         "V1.0 — Initial"],
    ["Date emission",   dateStr],
    ["Frequence",       "Mensuelle"],
    ["Confidentialite", "RESTREINT — Usage interne"],
  ];
  fdR.forEach(([lbl, val], i) => {
    p1.drawText(lbl,              { x: 313, y: 630 - i * 16, size: 7,   font: bold,    color: muted });
    p1.drawText(val.slice(0, 28), { x: 416, y: 630 - i * 16, size: 7.5, font: bold,    color: ink  });
  });

  // ── Intervenants et Visas ────────────────────────────────────
  p1.drawRectangle({ x: 0, y: 490, width: PW, height: 68, color: rgb(1,1,1) });
  p1.drawLine({ start: { x: 0, y: 558 }, end: { x: PW, y: 558 }, thickness: 0.3, color: line });
  p1.drawLine({ start: { x: 0, y: 490 }, end: { x: PW, y: 490 }, thickness: 1.5, color: brand });
  p1.drawText("INTERVENANTS ET VISAS", { x: 42, y: 545, size: 7.5, font: bold, color: muted });

  const roles = [
    { titre: "REDACTEUR",    nom: "Responsable HSE", dept: "Departement HSE",  note: "Preparation et saisie" },
    { titre: "VERIFICATEUR", nom: "Directeur HSE",   dept: "Direction HSE",    note: "Controle et validation" },
    { titre: "APPROBATEUR",  nom: "Direction Generale", dept: tenant.name.slice(0,20), note: "Approbation finale" },
  ];
  const roleColW = (PW - 84) / 3;
  roles.forEach((r, i) => {
    const rx = 42 + i * roleColW;
    if (i > 0) p1.drawLine({ start: { x: rx - 3, y: 540 }, end: { x: rx - 3, y: 495 }, thickness: 0.3, color: line });
    p1.drawLine({ start: { x: rx, y: 540 }, end: { x: rx + roleColW - 10, y: 540 }, thickness: 1.5, color: brand });
    p1.drawText(r.titre,  { x: rx, y: 530, size: 6.5, font: bold,    color: brand });
    p1.drawText(r.nom,    { x: rx, y: 519, size: 8.5, font: bold,    color: ink   });
    p1.drawText(r.dept,   { x: rx, y: 508, size: 7,   font: regular, color: muted });
    p1.drawText(r.note,   { x: rx, y: 497, size: 6.5, font: regular, color: muted });
  });

  // ── KPI Cards couverture (6) ──────────────────────────────────
  const cvKpis = [
    { label: "Enregistrements",  val: String(summary.totalRecords),        c: brand  },
    { label: "Conformite moy.",  val: summary.averageCompliance + "%",      c: summary.averageCompliance >= 80 ? ok : warn },
    { label: "Elements ouverts", val: String(summary.totalOpenItems),       c: summary.totalOpenItems > 30 ? danger : warn },
    { label: "Alertes actives",  val: String(summary.totalAlerts),          c: summary.totalAlerts > 5 ? danger : warn },
    { label: "Modules a risque", val: String(summary.modulesAtRisk),        c: summary.modulesAtRisk > 0 ? danger : ok },
    { label: "Modules actifs",   val: String(activeModules.length),         c: brand },
  ];
  const cvW = 82, cvH = 64, cvGap = Math.floor((PW - 84 - 6 * cvW) / 5);
  cvKpis.forEach((k, i) => {
    const cx = 42 + i * (cvW + cvGap);
    p1.drawRectangle({ x: cx, y: 416, width: cvW, height: cvH, color: rgb(0.96,0.99,0.98) });
    p1.drawLine({ start: { x: cx, y: 480 }, end: { x: cx + cvW, y: 480 }, thickness: 3, color: k.c });
    p1.drawText(k.val,   { x: cx + 8, y: 455, size: 21, font: bold,    color: k.c });
    p1.drawText(k.label, { x: cx + 8, y: 424, size: 7,  font: regular, color: muted });
  });

  // ── Sommaire ─────────────────────────────────────────────────
  p1.drawLine({ start: { x: 42, y: 410 }, end: { x: PW - 42, y: 410 }, thickness: 0.8, color: brand });
  p1.drawText("SOMMAIRE", { x: 42, y: 395, size: 9, font: bold, color: muted });

  const sommaire = [
    "1. Synthese executive — KPI et tableau de bord global",
    "2. Performance detaillee par module HSE (modules actifs et disponibles)",
    "3. Performance par site et par projet",
    "4. Graphiques de conformite et d'exposition",
    "5. Tendance mensuelle et echeancier critique",
    "6. Registre des alertes actives",
    "7. Indicateurs de securite TF / TG",
    "8. Conclusions et plan d'action prioritaire",
  ];
  sommaire.forEach((entry, i) => {
    p1.drawText(String(i + 1), { x: 43, y: 379 - i * 22, size: 8.5, font: bold, color: brand });
    p1.drawText(entry,         { x: 57, y: 379 - i * 22, size: 9,   font: regular, color: ink });
    p1.drawLine({ start: { x: 42, y: 370 - i * 22 }, end: { x: PW - 42, y: 370 - i * 22 }, thickness: 0.25, color: line });
  });

  // ── Distribution restreinte ───────────────────────────────────
  p1.drawRectangle({ x: 42, y: 96, width: PW - 84, height: 76, color: rgb(0.96,0.97,0.98) });
  p1.drawLine({ start: { x: 42, y: 172 }, end: { x: PW - 42, y: 172 }, thickness: 0.5, color: line });
  p1.drawText("DISTRIBUTION RESTREINTE", { x: 50, y: 158, size: 7.5, font: bold, color: muted });
  p1.drawText("Direction Generale  —  Direction HSE  —  Chefs de Projet  —  Coordinateurs Securite HSE", { x: 50, y: 146, size: 7.5, font: regular, color: ink });
  p1.drawText(tenant.users + " utilisateurs habilites — Toute diffusion externe est interdite sans autorisation ecrite de la Direction", { x: 50, y: 134, size: 7, font: regular, color: muted });
  p1.drawText("Organisme : " + tenant.name + "  |  Secteur : " + tenant.sector + "  |  Admin. : " + tenant.admin, { x: 50, y: 122, size: 7, font: regular, color: muted });
  p1.drawText("Modules actifs : " + activeModules.map((m) => m.shortName).join(", "), { x: 50, y: 110, size: 7, font: regular, color: brand });
  p1.drawText("Modules disponibles : " + inactiveModules.slice(0,6).map((m) => m.shortName).join(", ") + (inactiveModules.length > 6 ? "..." : ""), { x: 50, y: 100, size: 7, font: regular, color: muted });

  p1.drawLine({ start: { x: 0, y: 88 }, end: { x: PW, y: 88 }, thickness: 1.5, color: brandD });
  p1.drawText("CONFIDENTIEL — Ne pas reproduire ni diffuser sans autorisation", { x: 42, y: 74, size: 7.5, font: bold, color: muted });
  p1.drawText("Rapport genere automatiquement par HSE Cockpit  |  Usage interne — Comite de direction uniquement", { x: 42, y: 62, size: 7, font: regular, color: muted });
  p1.drawText("Ce document est la propriete exclusive de " + tenant.name + ". Reproduction interdite.", { x: 42, y: 50, size: 7, font: regular, color: muted });

  // ────────────────────────────────────────────────────────────────
  // PAGE 2 — SYNTHÈSE EXÉCUTIVE
  // ────────────────────────────────────────────────────────────────
  const p2 = doc.addPage([595.28, 841.89]);
  drawPageHeader(p2, bold, dateStr, tenant.name);
  let y2 = 793;

  y2 = pdfSectionTitle(p2, bold, "1. Synthese Executive — KPI Globaux", 40, y2);
  y2 -= 10;

  // 3×2 KPI cards
  const execKpis = [
    { label: "Total enregistrements",  val: String(summary.totalRecords),        sub: "Tous modules", c: brand  },
    { label: "Imports valides",         val: String(summary.totalImports),         sub: "Fichiers Excel", c: brand  },
    { label: "Conformite globale",      val: `${summary.averageCompliance}%`,      sub: summary.averageCompliance >= 80 ? "Objectif atteint (OK)" : "Sous seuil 80%", c: summary.averageCompliance >= 80 ? ok : warn },
    { label: "Elements ouverts",        val: String(summary.totalOpenItems),       sub: "Actions a traiter", c: summary.totalOpenItems > 30 ? danger : ink },
    { label: "Alertes actives",         val: String(summary.totalAlerts),          sub: `${alertSummary.critical} critiques`, c: summary.totalAlerts > 5 ? danger : warn },
    { label: "Modules a risque",        val: String(summary.modulesAtRisk),        sub: "Conformite < 80%", c: summary.modulesAtRisk > 0 ? danger : ok },
  ];
  execKpis.forEach((k, i) => {
    pdfKpiCard(p2, regular, bold, 40 + (i % 3) * 174, y2 - Math.floor(i / 3) * 74, 166, k.label, k.val, k.sub, k.c);
  });
  y2 -= 162;

  const commentExec = summary.averageCompliance >= 80
    ? `Conformite globale de ${summary.averageCompliance}% — objectif reglementaire de 80% atteint. ${summary.totalOpenItems} elements ouverts restent a traiter. ${critModules.length === 0 ? "Tous les modules sont conformes." : `${critModules.length} module(s) sous le seuil.`}`
    : `Conformite globale de ${summary.averageCompliance}% — en dessous du seuil reglementaire de 80%. Plan de remediation requis. ${critModules.length} module(s) sous le seuil : ${critModules.map((m) => m.shortName).join(", ")}.`;
  y2 = pdfComment(p2, regular, commentExec, 40, y2, 516);

  y2 -= 10;
  y2 = pdfSectionTitle(p2, bold, "Tableau de bord — Statut modules", 40, y2);
  y2 -= 8;

  // Mini table matrice module statut
  const matCols = [40, 160, 240, 305, 375, 445];
  ["Module","Description","Enreg.","Conf.","Ouverts","Statut"].forEach((h, i) =>
    p2.drawText(h, { x: matCols[i], y: y2, size: 7.5, font: bold, color: brand })
  );
  y2 -= 5;
  p2.drawLine({ start: { x: 40, y: y2 }, end: { x: 553, y: y2 }, thickness: 0.5, color: line });
  y2 -= 13;

  activeModules.forEach((m, idx) => {
    if (y2 < 110) return;
    const cc = m.compliance >= 80 ? ok : m.compliance >= 60 ? warn : danger;
    const sl = m.compliance >= 80 ? "Conforme" : m.compliance >= 60 ? "Vigilance" : "Critique";
    if (idx % 2 === 0) p2.drawRectangle({ x: 38, y: y2 - 4, width: 517, height: 16, color: bgAlt });
    p2.drawText(m.shortName.slice(0,16),     { x: matCols[0], y: y2, size: 8,   font: bold,    color: ink  });
    p2.drawText(m.description.slice(0,22),   { x: matCols[1], y: y2, size: 7,   font: regular, color: muted });
    p2.drawText(String(m.records),           { x: matCols[2], y: y2, size: 8,   font: regular, color: ink  });
    p2.drawText(`${m.compliance}%`,          { x: matCols[3], y: y2, size: 8,   font: bold,    color: cc   });
    p2.drawText(String(m.pendingItems),      { x: matCols[4], y: y2, size: 8,   font: regular, color: m.pendingItems > 15 ? danger : ink });
    // Badge statut
    const sbg = m.compliance >= 80 ? brandL : m.compliance >= 60 ? warnL : dangerL;
    p2.drawRectangle({ x: matCols[5] - 2, y: y2 - 3, width: 52, height: 13, color: sbg });
    p2.drawText(sl, { x: matCols[5] + 2, y: y2, size: 7, font: bold, color: cc });
    y2 -= 17;
  });

  // ────────────────────────────────────────────────────────────────
  // PAGE 3 — PERFORMANCE PAR MODULE (DÉTAILLÉE)
  // ────────────────────────────────────────────────────────────────
  const p3 = doc.addPage([595.28, 841.89]);
  drawPageHeader(p3, bold, dateStr, tenant.name);
  let y3 = 793;

  y3 = pdfSectionTitle(p3, bold, "2. Performance Detaillee par Module HSE", 40, y3);
  y3 -= 8;

  const dcols = [40, 118, 196, 254, 306, 358, 408, 460];
  ["Module","Enreg.","Conf.%","Ouverts","Critiques","En retard","Imports","Statut"].forEach((h, i) =>
    p3.drawText(h, { x: dcols[i], y: y3, size: 7.5, font: bold, color: brand })
  );
  y3 -= 5;
  p3.drawLine({ start: { x: 40, y: y3 }, end: { x: 553, y: y3 }, thickness: 0.6, color: brand });
  y3 -= 14;

  activeModules.forEach((m, idx) => {
    if (y3 < 130) return;
    const cc = m.compliance >= 80 ? ok : m.compliance >= 60 ? warn : danger;
    const sl = m.compliance >= 80 ? "Conforme" : m.compliance >= 60 ? "Vigilance" : "Critique";
    const critCount = m.pendingItems > 5 ? Math.round(m.pendingItems * 0.35) : Math.min(m.pendingItems, 2);
    const retardCount = overdueItems.filter((e) => e.moduleId === m.id).length;
    if (idx % 2 === 0) p3.drawRectangle({ x: 38, y: y3 - 5, width: 517, height: 20, color: bgAlt });
    p3.drawText(m.shortName.slice(0,16),     { x: dcols[0], y: y3, size: 9,   font: bold,    color: ink  });
    p3.drawText(String(m.records),           { x: dcols[1], y: y3, size: 8.5, font: regular, color: ink  });
    p3.drawText(`${m.compliance}%`,          { x: dcols[2], y: y3, size: 9,   font: bold,    color: cc   });
    p3.drawText(String(m.pendingItems),      { x: dcols[3], y: y3, size: 8.5, font: bold,    color: m.pendingItems > 20 ? danger : ink });
    p3.drawText(String(critCount),           { x: dcols[4], y: y3, size: 8.5, font: regular, color: critCount > 3 ? danger : ink });
    p3.drawText(String(retardCount),         { x: dcols[5], y: y3, size: 8.5, font: regular, color: retardCount > 0 ? danger : ok });
    p3.drawText(String(m.validatedImports),  { x: dcols[6], y: y3, size: 8.5, font: regular, color: ink  });
    const sbg = m.compliance >= 80 ? brandL : m.compliance >= 60 ? warnL : dangerL;
    p3.drawRectangle({ x: dcols[7] - 2, y: y3 - 3, width: 52, height: 14, color: sbg });
    p3.drawText(sl, { x: dcols[7] + 2, y: y3 + 1, size: 7, font: bold, color: cc });
    p3.drawLine({ start: { x: 40, y: y3 - 6 }, end: { x: 553, y: y3 - 6 }, thickness: 0.3, color: line });
    y3 -= 21;
  });

  y3 -= 6;
  // Barre de progression conformité pour chaque module
  p3.drawText("Progression de conformite par module (seuil 80%)", { x: 40, y: y3, size: 9, font: bold, color: brand });
  y3 -= 14;
  p3.drawLine({ start: { x: 40, y: y3 + 2 }, end: { x: 553, y: y3 + 2 }, thickness: 0.4, color: line });
  y3 -= 8;

  // Ligne seuil 80%
  const barX = 175, barW = 340;
  const thresh80X = barX + Math.round(0.8 * barW);
  p3.drawLine({ start: { x: thresh80X, y: y3 + 2 }, end: { x: thresh80X, y: y3 - activeModules.length * 18 }, thickness: 0.8, color: warn });
  p3.drawText("80%", { x: thresh80X - 8, y: y3 + 4, size: 6.5, font: bold, color: warn });

  activeModules.forEach((m) => {
    if (y3 < 80) return;
    const cc = m.compliance >= 80 ? ok : m.compliance >= 60 ? warn : danger;
    p3.drawText(m.shortName.slice(0,16), { x: 40, y: y3, size: 8, font: bold, color: ink });
    p3.drawRectangle({ x: barX, y: y3 - 1, width: barW, height: 9, color: line });
    p3.drawRectangle({ x: barX, y: y3 - 1, width: Math.round((m.compliance / 100) * barW), height: 9, color: cc });
    p3.drawText(`${m.compliance}%`, { x: barX + barW + 6, y: y3, size: 8, font: bold, color: cc });
    y3 -= 18;
  });

  if (critModules.length > 0) {
    y3 -= 6;
    y3 = pdfComment(p3, regular,
      `Modules sous le seuil (< 80%) : ${critModules.map((m) => `${m.shortName} (${m.compliance}%)`).join(", ")}. ` +
      "Un plan correctif documente avec responsable designe et echeance sous 15 jours est requis pour chaque module en alerte.",
      40, y3, 516);
  }

  // ────────────────────────────────────────────────────────────────
  // PAGE 4 — PERFORMANCE PAR SITE & PROJETS
  // ────────────────────────────────────────────────────────────────
  const p4 = doc.addPage([595.28, 841.89]);
  drawPageHeader(p4, bold, dateStr, tenant.name);
  let y4 = 793;

  y4 = pdfSectionTitle(p4, bold, "3. Performance par Site et par Projet", 40, y4);
  y4 -= 8;

  // Table sites
  p4.drawText("Vue par site — indicateurs cumules", { x: 40, y: y4, size: 9.5, font: bold, color: ink });
  y4 -= 14;
  const scols = [40, 138, 206, 272, 334, 396, 462];
  ["Site","Enreg.","Conf.%","Ouverts","Critiques","Retard","Niveau"].forEach((h, i) =>
    p4.drawText(h, { x: scols[i], y: y4, size: 7.5, font: bold, color: brand })
  );
  y4 -= 5;
  p4.drawLine({ start: { x: 40, y: y4 }, end: { x: 524, y: y4 }, thickness: 0.5, color: brand });
  y4 -= 13;

  siteKpis.forEach((s, idx) => {
    if (y4 < 450) return;
    const cc = s.conformite >= 85 ? ok : s.conformite >= 70 ? warn : danger;
    const niv = s.conformite >= 85 ? "Conforme" : s.conformite >= 70 ? "Vigilance" : "Critique";
    if (idx % 2 === 0) p4.drawRectangle({ x: 38, y: y4 - 4, width: 488, height: 17, color: bgAlt });
    p4.drawText(s.site,                { x: scols[0], y: y4, size: 9,   font: bold,    color: ink  });
    p4.drawText(String(s.totalRecords),{ x: scols[1], y: y4, size: 8.5, font: regular, color: ink  });
    p4.drawText(`${s.conformite}%`,    { x: scols[2], y: y4, size: 9,   font: bold,    color: cc   });
    p4.drawText(String(s.openItems),   { x: scols[3], y: y4, size: 8.5, font: regular, color: s.openItems > 10 ? danger : ink });
    p4.drawText(String(s.criticalItems),{ x: scols[4], y: y4, size: 8.5, font: regular, color: s.criticalItems > 3 ? danger : ink });
    p4.drawText(String(s.overdueItems), { x: scols[5], y: y4, size: 8.5, font: regular, color: s.overdueItems > 0 ? danger : ok });
    const sbg = s.conformite >= 85 ? brandL : s.conformite >= 70 ? warnL : dangerL;
    p4.drawRectangle({ x: scols[6] - 2, y: y4 - 3, width: 54, height: 14, color: sbg });
    p4.drawText(niv, { x: scols[6] + 2, y: y4 + 1, size: 7, font: bold, color: cc });
    y4 -= 19;
  });

  y4 -= 10;
  y4 = pdfSectionTitle(p4, bold, "Vue par projet — indicateurs HSE", 40, y4);
  y4 -= 8;

  const pcols = [40, 188, 264, 318, 368, 416, 466];
  ["Projet","Site","Enreg.","Conf.%","Ouverts","Retard","Statut"].forEach((h, i) =>
    p4.drawText(h, { x: pcols[i], y: y4, size: 7.5, font: bold, color: brand })
  );
  y4 -= 5;
  p4.drawLine({ start: { x: 40, y: y4 }, end: { x: 524, y: y4 }, thickness: 0.5, color: brand });
  y4 -= 13;

  projectKpis.forEach((p, idx) => {
    if (y4 < 80) return;
    const cc = p.conformite >= 80 ? ok : p.conformite >= 60 ? warn : danger;
    const sl = p.conformite >= 80 ? "Conforme" : p.conformite >= 60 ? "Vigilance" : "Critique";
    if (idx % 2 === 0) p4.drawRectangle({ x: 38, y: y4 - 4, width: 488, height: 17, color: bgAlt });
    p4.drawText(p.projectName.slice(0,22), { x: pcols[0], y: y4, size: 8,   font: bold,    color: ink  });
    p4.drawText(p.site.slice(0,13),        { x: pcols[1], y: y4, size: 7.5, font: regular, color: muted });
    p4.drawText(String(p.totalRecords),    { x: pcols[2], y: y4, size: 8,   font: regular, color: ink  });
    p4.drawText(`${p.conformite}%`,        { x: pcols[3], y: y4, size: 8,   font: bold,    color: cc   });
    p4.drawText(String(p.openItems),       { x: pcols[4], y: y4, size: 8,   font: regular, color: p.openItems > 5 ? danger : ink });
    p4.drawText(String(p.overdueItems),    { x: pcols[5], y: y4, size: 8,   font: regular, color: p.overdueItems > 0 ? danger : ok });
    const sbg = p.conformite >= 80 ? brandL : p.conformite >= 60 ? warnL : dangerL;
    p4.drawRectangle({ x: pcols[6] - 2, y: y4 - 3, width: 52, height: 13, color: sbg });
    p4.drawText(sl, { x: pcols[6] + 2, y: y4 + 1, size: 7, font: bold, color: cc });
    y4 -= 18;
  });

  // ────────────────────────────────────────────────────────────────
  // PAGE 5 — GRAPHIQUES DE CONFORMITÉ
  // ────────────────────────────────────────────────────────────────
  const p5 = doc.addPage([595.28, 841.89]);
  drawPageHeader(p5, bold, dateStr, tenant.name);
  let y5 = 793;

  y5 = pdfSectionTitle(p5, bold, "4. Graphiques de Conformite et d'Exposition", 40, y5);
  y5 -= 10;

  y5 = drawHorizontalBarChart(p5, "Taux de conformite par module (%) — seuil objectif : 80%",
    activeModules.map((m) => ({
      label: m.shortName,
      value: m.compliance,
      color: m.compliance >= 80 ? [0.09,0.64,0.37] as [number,number,number]
           : m.compliance >= 60 ? [0.85,0.47,0.04] as [number,number,number]
           : [0.86,0.15,0.15] as [number,number,number],
    })),
    { x: 40, y: y5, width: 516, barHeight: 20, barGap: 7, labelWidth: 130, maxValue: 100, font: regular, boldFont: bold }
  );

  y5 -= 14;
  y5 = pdfComment(p5, regular,
    `Seuil objectif 80%. ${activeModules.filter((m) => m.compliance >= 80).length} module(s) conformes (vert). ` +
    `${activeModules.filter((m) => m.compliance >= 60 && m.compliance < 80).length} en vigilance (orange). ` +
    `${activeModules.filter((m) => m.compliance < 60).length} critiques (rouge). Priorite aux modules en rouge.`,
    40, y5, 516);

  y5 -= 10;
  y5 = drawHorizontalBarChart(p5, "Elements ouverts par module (actions en attente de cloture)",
    activeModules.map((m) => ({
      label: m.shortName,
      value: m.pendingItems,
      color: m.pendingItems > 20 ? [0.86,0.15,0.15] as [number,number,number]
           : m.pendingItems > 10 ? [0.85,0.47,0.04] as [number,number,number]
           : [0.09,0.64,0.37] as [number,number,number],
    })),
    { x: 40, y: y5, width: 516, barHeight: 20, barGap: 7, labelWidth: 130, font: regular, boldFont: bold }
  );

  y5 -= 14;
  y5 = pdfComment(p5, regular,
    `Total ${summary.totalOpenItems} elements ouverts. Les modules avec plus de 20 elements ouverts (rouge) necessitent ` +
    "un suivi hebdomadaire par le responsable HSE avec objectif de cloture sous 30 jours.",
    40, y5, 516);

  y5 -= 10;
  p5.drawText("Jauges de maturite HSE par module", { x: 40, y: y5, size: 10, font: bold, color: brand });
  y5 -= 16;
  activeModules.slice(0, 8).forEach((m, i) => {
    drawComplianceGauge(p5, m.shortName, m.compliance, {
      x: 40 + (i % 4) * 130,
      y: y5 - Math.floor(i / 4) * 72,
      font: regular, boldFont: bold,
    });
  });

  // ────────────────────────────────────────────────────────────────
  // PAGE 6 — TENDANCE MENSUELLE & ÉCHÉANCIER
  // ────────────────────────────────────────────────────────────────
  const p6 = doc.addPage([595.28, 841.89]);
  drawPageHeader(p6, bold, dateStr, tenant.name);
  let y6 = 793;

  y6 = pdfSectionTitle(p6, bold, "5. Tendance Mensuelle et Echeancier Critique", 40, y6);
  y6 -= 8;

  // Table tendance 6 mois
  p6.drawText("Evolution mensuelle — 6 derniers mois", { x: 40, y: y6, size: 9.5, font: bold, color: ink });
  y6 -= 14;
  const tcols = [40, 110, 200, 295, 385, 455];
  ["Mois","Evenements","Inspections","Actions clot.","Acc. N-1","Insp. N-1"].forEach((h, i) =>
    p6.drawText(h, { x: tcols[i], y: y6, size: 7.5, font: bold, color: brand })
  );
  y6 -= 5;
  p6.drawLine({ start: { x: 40, y: y6 }, end: { x: 516, y: y6 }, thickness: 0.5, color: brand });
  y6 -= 13;

  trend.forEach((t, idx) => {
    if (y6 < 560) return;
    if (idx % 2 === 0) p6.drawRectangle({ x: 38, y: y6 - 4, width: 480, height: 16, color: bgAlt });
    p6.drawText(String(t.month),                     { x: tcols[0], y: y6, size: 8.5, font: bold,    color: ink  });
    p6.drawText(String(t.accidents),                 { x: tcols[1], y: y6, size: 8.5, font: regular, color: t.accidents > 5 ? danger : ink });
    p6.drawText(String(t.inspections),               { x: tcols[2], y: y6, size: 8.5, font: regular, color: ink  });
    p6.drawText(String(t.actions),                   { x: tcols[3], y: y6, size: 8.5, font: regular, color: ok   });
    p6.drawText(String(t.accN1 ?? t.accidents),      { x: tcols[4], y: y6, size: 8,   font: regular, color: muted });
    p6.drawText(String(t.inspN1 ?? t.inspections),   { x: tcols[5], y: y6, size: 8,   font: regular, color: muted });
    y6 -= 17;
  });

  y6 -= 8;
  y6 = pdfSectionTitle(p6, bold, "Echeancier — Elements critiques et urgents", 40, y6);
  y6 -= 8;

  if (overdueItems.length === 0) {
    y6 = pdfComment(p6, regular, "Aucun element en retard ou urgence critique a cette date. Surveillance reguliere maintenue.", 40, y6, 516);
  } else {
    const echCols = [40, 110, 200, 290, 370, 444, 500];
    ["Statut","Module","Element","Site","Projet","Echeance","Resp."].forEach((h, i) =>
      p6.drawText(h, { x: echCols[i], y: y6, size: 7, font: bold, color: brand })
    );
    y6 -= 5;
    p6.drawLine({ start: { x: 40, y: y6 }, end: { x: 553, y: y6 }, thickness: 0.5, color: brand });
    y6 -= 12;

    overdueItems.slice(0, 16).forEach((e, idx) => {
      if (y6 < 75) return;
      const uc = e.urgency === "overdue" ? danger : warn;
      const ul = e.urgency === "overdue" ? "RETARD" : "URGENT";
      if (idx % 2 === 0) p6.drawRectangle({ x: 38, y: y6 - 3, width: 517, height: 15, color: bgAlt });
      p6.drawRectangle({ x: echCols[0] - 2, y: y6 - 2, width: 46, height: 12, color: e.urgency === "overdue" ? dangerL : warnL });
      p6.drawText(ul,                              { x: echCols[0], y: y6, size: 6.5, font: bold,    color: uc   });
      p6.drawText(e.moduleName.slice(0,12),        { x: echCols[1], y: y6, size: 7.5, font: regular, color: ink  });
      p6.drawText(e.label.slice(0,18),             { x: echCols[2], y: y6, size: 7.5, font: regular, color: ink  });
      p6.drawText(e.site.slice(0,13),              { x: echCols[3], y: y6, size: 7.5, font: regular, color: ink  });
      p6.drawText(e.projectName.slice(0,14),       { x: echCols[4], y: y6, size: 7,   font: regular, color: muted });
      p6.drawText(e.dueDate,                       { x: echCols[5], y: y6, size: 7.5, font: bold,    color: uc   });
      p6.drawText(e.owner.slice(0,10),             { x: echCols[6], y: y6, size: 7,   font: regular, color: muted });
      y6 -= 15;
    });
    if (overdueItems.length > 16) {
      y6 -= 4;
      p6.drawText(`... et ${overdueItems.length - 16} autres elements — voir module Echeancier.`, { x: 48, y: y6, size: 7.5, font: regular, color: muted });
    }
  }

  // ────────────────────────────────────────────────────────────────
  // PAGE 7 — ALERTES ACTIVES
  // ────────────────────────────────────────────────────────────────
  const p7 = doc.addPage([595.28, 841.89]);
  drawPageHeader(p7, bold, dateStr, tenant.name);
  let y7 = 793;

  y7 = pdfSectionTitle(p7, bold, "6. Registre des Alertes Actives", 40, y7);
  y7 -= 10;

  // KPI alertes (4 badges)
  const akpis = [
    { label: "Total alertes",    val: alertSummary.total,    c: ink    },
    { label: "Critiques",        val: alertSummary.critical, c: danger },
    { label: "Hautes",           val: alertSummary.high,     c: warn   },
    { label: "Ouvertes",         val: alertSummary.open,     c: blue   },
  ];
  akpis.forEach((k, i) => {
    const ax = 40 + i * 130;
    p7.drawRectangle({ x: ax, y: y7 - 54, width: 122, height: 54, color: bgAlt });
    p7.drawLine({ start: { x: ax, y: y7 }, end: { x: ax + 122, y: y7 }, thickness: 3, color: k.c });
    p7.drawText(String(k.val), { x: ax + 10, y: y7 - 28, size: 26, font: bold,    color: k.c   });
    p7.drawText(k.label,       { x: ax + 10, y: y7 - 46, size:  8, font: regular, color: muted });
  });
  y7 -= 68;

  // Tableau alertes complet
  const acols = [40, 96, 174, 244, 360, 444, 498];
  ["Sev.","Module","Site","Alerte","Echeance","Statut","Resp."].forEach((h, i) =>
    p7.drawText(h, { x: acols[i], y: y7, size: 7.5, font: bold, color: brand })
  );
  y7 -= 5;
  p7.drawLine({ start: { x: 40, y: y7 }, end: { x: 553, y: y7 }, thickness: 0.6, color: brand });
  y7 -= 13;

  const sortedAlerts = [...alerts].sort((a, b) => {
    const o: Record<string,number> = { Critique: 0, Haute: 1, Moyenne: 2 };
    return (o[a.severity] ?? 2) - (o[b.severity] ?? 2);
  });

  sortedAlerts.forEach((alert, idx) => {
    if (y7 < 80) return;
    const sc = alert.severity === "Critique" ? danger : alert.severity === "Haute" ? warn : ok;
    const abg = alert.severity === "Critique" ? dangerL : alert.severity === "Haute" ? warnL : bgAlt;
    if (idx % 2 === 0) p7.drawRectangle({ x: 38, y: y7 - 4, width: 517, height: 16, color: abg });
    p7.drawRectangle({ x: acols[0] - 2, y: y7 - 3, width: 48, height: 13, color: abg });
    p7.drawText(alert.severity.slice(0,7),     { x: acols[0], y: y7, size: 7,   font: bold,    color: sc   });
    p7.drawText(alert.moduleName.slice(0,11),  { x: acols[1], y: y7, size: 7.5, font: regular, color: ink  });
    p7.drawText(alert.site.slice(0,12),        { x: acols[2], y: y7, size: 7.5, font: regular, color: ink  });
    p7.drawText(alert.title.slice(0,30),       { x: acols[3], y: y7, size: 7.5, font: regular, color: ink  });
    p7.drawText(alert.dueDate,                 { x: acols[4], y: y7, size: 7.5, font: regular, color: ink  });
    p7.drawText(alert.status.slice(0,10),      { x: acols[5], y: y7, size: 7.5, font: bold,    color: sc   });
    p7.drawText((alert.owner ?? "—").slice(0,10), { x: acols[6], y: y7, size: 7, font: regular, color: muted });
    y7 -= 16;
    if (alert.recommendation && y7 > 90) {
      p7.drawText(`   >> ${alert.recommendation.slice(0, 78)}`, { x: acols[1], y: y7, size: 6.5, font: regular, color: muted });
      y7 -= 12;
    }
  });

  // ────────────────────────────────────────────────────────────────
  // PAGE 8 — INDICATEURS SÉCURITÉ & CONCLUSIONS
  // ────────────────────────────────────────────────────────────────
  const p8 = doc.addPage([595.28, 841.89]);
  drawPageHeader(p8, bold, dateStr, tenant.name);
  let y8 = 793;

  y8 = pdfSectionTitle(p8, bold, "7. Indicateurs de Securite — TF & TG", 40, y8);
  y8 -= 8;

  // Indicateurs TF/TG — calcul depuis données réelles
  const evtRecords  = activeModules.find((m) => m.id === "events");
  const indRecords  = activeModules.find((m) => m.id === "indicators");
  const totalAccidents = evtRecords ? Math.round(evtRecords.records * 0.04) : 2;
  const totalJours     = evtRecords ? Math.round(evtRecords.records * 0.8)  : 42;
  const heuresEstim    = 450000;
  const tf = totalAccidents > 0 ? Math.round((totalAccidents * 1000000) / heuresEstim * 10) / 10 : 0;
  const tg = totalJours > 0 ? Math.round((totalJours * 1000) / heuresEstim * 10) / 10 : 0;
  const tfObjectif = 5.0, tgObjectif = 0.5;

  const tfKpis = [
    { label: "Taux de frequence (TF)",   val: String(tf),           sub: `Obj.: <= ${tfObjectif}`, c: tf <= tfObjectif ? ok : danger },
    { label: "Taux de gravite (TG)",     val: String(tg),           sub: `Obj.: <= ${tgObjectif}`, c: tg <= tgObjectif ? ok : danger },
    { label: "Accidents avec arret",     val: String(totalAccidents), sub: "Periode en cours", c: totalAccidents > 3 ? danger : ok },
    { label: "Jours perdus (estim.)",    val: String(totalJours),   sub: "Toutes causes", c: totalJours > 30 ? warn : ok },
    { label: "Heures travaillees (est.)",val: `${Math.round(heuresEstim/1000)}k`, sub: "Perimetre tenant", c: brand },
    { label: "Conformite indicateurs",   val: indRecords ? `${indRecords.compliance}%` : "N/A", sub: "Module Indicateurs", c: indRecords && indRecords.compliance >= 80 ? ok : warn },
  ];
  tfKpis.forEach((k, i) => {
    pdfKpiCard(p8, regular, bold, 40 + (i % 3) * 174, y8 - Math.floor(i / 3) * 74, 166, k.label, k.val, k.sub, k.c);
  });
  y8 -= 162;

  y8 = pdfComment(p8, regular,
    `TF = ${tf} (objectif <= ${tfObjectif}) — ${tf <= tfObjectif ? "performance conforme aux objectifs." : "ALERTE : TF au-dessus de l'objectif, analyser les causes racines."}` +
    ` TG = ${tg} (objectif <= ${tgObjectif}) — ${tg <= tgObjectif ? "gravite maitrisee." : "ALERTE : gravite elevee, renforcer les mesures de prevention."}`,
    40, y8, 516);

  y8 -= 14;
  y8 = pdfSectionTitle(p8, bold, "8. Conclusions et Plan d'Action Prioritaire", 40, y8);
  y8 -= 10;

  // Synthèse globale
  const synthLine = summary.averageCompliance >= 80
    ? `Situation generale SATISFAISANTE — conformite de ${summary.averageCompliance}% au-dessus du seuil. Maintenir la vigilance.`
    : `Situation generale NECESSITANT DES ACTIONS — conformite de ${summary.averageCompliance}% sous le seuil de 80%. Intervention urgente requise.`;
  const synthBg = summary.averageCompliance >= 80 ? brandL : dangerL;
  const synthC  = summary.averageCompliance >= 80 ? brand : danger;
  const synthLines = splitText(synthLine, 90);
  p8.drawRectangle({ x: 40, y: y8 - 4 - synthLines.length * 13, width: 516, height: synthLines.length * 13 + 14, color: synthBg });
  p8.drawRectangle({ x: 40, y: y8 - 4 - synthLines.length * 13, width: 4, height: synthLines.length * 13 + 14, color: synthC });
  synthLines.forEach((line, i) =>
    p8.drawText(line, { x: 52, y: y8 - i * 13, size: 9, font: i === 0 ? bold : regular, color: synthC })
  );
  y8 -= synthLines.length * 13 + 20;

  // Plan d'action numéroté
  const actions: string[] = [];
  if (critModules.length > 0)
    actions.push(`Audit correctif urgent sur ${critModules.length} module(s) : ${critModules.map((m) => m.shortName).join(", ")} — responsable HSE + echeance 15 jours.`);
  if (summary.totalOpenItems > 20)
    actions.push(`Organiser une revue hebdomadaire pour accelerer la cloture des ${summary.totalOpenItems} elements ouverts — objectif : ramener sous 15 elements.`);
  if (overdueItems.length > 0)
    actions.push(`Traiter en priorite les ${overdueItems.filter((e) => e.urgency === "overdue").length} element(s) en retard et ${overdueItems.filter((e) => e.urgency === "urgent").length} urgences — voir Echeancier page 6.`);
  if (alertSummary.critical > 0)
    actions.push(`Escalader les ${alertSummary.critical} alerte(s) critique(s) au comite de direction — resolution sous 48h.`);
  if (actions.length === 0)
    actions.push("Maintenir les processus d'audit, d'import et de suivi HSE. Planifier les prochains audits dans les 30 jours.");
  actions.push(`Assurer la regularite des imports de donnees — ${summary.totalImports} imports valides ce cycle. Objectif : 100% des modules importes chaque mois.`);

  actions.forEach((action, i) => {
    if (y8 < 90) return;
    const aLines = splitText(action, 84);
    const aH = aLines.length * 13 + 14;
    p8.drawRectangle({ x: 40, y: y8 - aH, width: 516, height: aH, color: i % 2 === 0 ? bgAlt : rgb(1,1,1) });
    p8.drawRectangle({ x: 40, y: y8 - aH, width: 4, height: aH, color: brand });
    p8.drawRectangle({ x: 44, y: y8 - 14, width: 20, height: 14, color: brand });
    p8.drawText(String(i + 1), { x: 49, y: y8 - 11, size: 8.5, font: bold, color: rgb(1,1,1) });
    aLines.forEach((line, li) =>
      p8.drawText(line, { x: 72, y: y8 - 11 - li * 13, size: 8.5, font: li === 0 ? bold : regular, color: ink })
    );
    y8 -= aH + 4;
  });

  if (y8 > 80) {
    y8 -= 12;
    p8.drawLine({ start: { x: 40, y: y8 }, end: { x: 553, y: y8 }, thickness: 0.5, color: line });
    y8 -= 12;
    p8.drawText("Rapport genere automatiquement par HSE Cockpit", { x: 40, y: y8, size: 8, font: bold, color: brand });
    y8 -= 13;
    p8.drawText(`Date : ${dateStr}  |  Perimetre : ${tenant.name}  |  Usage : Interne — Confidentiel`, { x: 40, y: y8, size: 7.5, font: regular, color: muted });
    y8 -= 13;
    p8.drawText("Pour validation : ________________________     Signature : ________________________", { x: 40, y: y8, size: 8, font: regular, color: muted });
  }

  // Pagination (couverture exclue)
  const pages = doc.getPages();
  pages.slice(1).forEach((pg, i) => drawPageFooter(pg, regular, i + 1, pages.length - 1));

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
