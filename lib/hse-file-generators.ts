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

  const activeModules = getTenantActiveModules(tenantId);
  const summary = getTenantSummary(tenantId);
  const alerts = getAlertsForTenant(tenantId);
  const alertSummary = getAlertSummary(alerts);

  const doc = await PDFDocument.create();
  const regular = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const dateStr = new Date().toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
  const ink    = rgb(0.07, 0.09, 0.14);
  const muted  = rgb(0.28, 0.32, 0.4);
  const brand  = rgb(0.06, 0.46, 0.43);
  const danger = rgb(0.86, 0.15, 0.15);
  const warn   = rgb(0.85, 0.47, 0.04);

  // ── Page 1 : Couverture ───────────────────────────────────────────
  const cover = doc.addPage([595.28, 841.89]);
  cover.drawRectangle({ x: 0, y: 680, width: 595.28, height: 161.89, color: brand });
  cover.drawText("RAPPORT HSE",   { x: 48, y: 790, size: 32, font: bold,    color: rgb(1,1,1) });
  cover.drawText(tenant.name,     { x: 48, y: 750, size: 18, font: bold,    color: rgb(0.9,1,0.97) });
  cover.drawText(`${tenant.sector} — ${tenant.country}`, { x: 48, y: 718, size: 11, font: regular, color: rgb(0.8,0.95,0.9) });

  cover.drawText(dateStr, { x: 48, y: 626, size: 13, font: bold,    color: ink });
  cover.drawText("Document confidentiel — usage interne", { x: 48, y: 604, size: 10, font: regular, color: muted });

  // Bloc KPI résumé
  const kpiBoxes = [
    { label: "enregistrements", val: String(summary.totalRecords),    color: brand  },
    { label: "conformite moy.", val: `${summary.averageCompliance}%`, color: summary.averageCompliance >= 80 ? brand : warn  },
    { label: "elements ouverts",val: String(summary.totalOpenItems),  color: summary.totalOpenItems > 20 ? danger : ink },
    { label: "alertes actives", val: String(summary.totalAlerts),     color: summary.totalAlerts > 5 ? danger : ink },
  ];
  const bw = 116, bh = 64, bx0 = 48;
  kpiBoxes.forEach((k, i) => {
    const bx = bx0 + i * (bw + 6);
    cover.drawRectangle({ x: bx, y: 518, width: bw, height: bh, color: rgb(0.95,0.99,0.97) });
    cover.drawLine({ start: { x: bx, y: 582 }, end: { x: bx + bw, y: 582 }, thickness: 2.5, color: k.color });
    cover.drawText(k.val,   { x: bx + 10, y: 554, size: 22, font: bold,    color: k.color });
    cover.drawText(k.label, { x: bx + 10, y: 534, size:  8, font: regular, color: muted  });
  });

  // Sommaire
  cover.drawText("Sommaire", { x: 48, y: 486, size: 12, font: bold, color: ink });
  ["1. KPI consolides et synthese par module", "2. Graphiques de performance (conformite, elements ouverts)", "3. Alertes actives et recommandations operationnelles"].forEach((e, i) => {
    cover.drawText(e, { x: 62, y: 466 - i * 18, size: 10, font: regular, color: ink });
  });

  // ── Page 2 : KPI + tableau modules ───────────────────────────────
  const p2 = doc.addPage([595.28, 841.89]);
  drawPageHeader(p2, bold, dateStr, tenant.name);
  let y = 785;

  p2.drawText(`1. KPI consolides — ${tenant.name}`, { x: 48, y, size: 15, font: bold, color: brand });
  y -= 26;

  // Ligne KPI (6 métriques)
  const metrics = [
    { label: "Enregistrements", val: String(summary.totalRecords),    c: brand  },
    { label: "Imports valides",  val: String(summary.totalImports),    c: brand  },
    { label: "Conformite",       val: `${summary.averageCompliance}%`, c: summary.averageCompliance >= 80 ? brand : warn  },
    { label: "Ouverts",          val: String(summary.totalOpenItems),  c: summary.totalOpenItems > 20 ? danger : ink },
    { label: "Alertes",          val: String(summary.totalAlerts),     c: summary.totalAlerts > 5 ? danger : ink },
    { label: "Modules actifs",   val: String(activeModules.length),    c: brand  },
  ];
  const mw = 82;
  metrics.forEach((m, i) => {
    const mx = 48 + i * (mw + 4);
    p2.drawRectangle({ x: mx, y: y - 50, width: mw, height: 50, color: rgb(0.97,0.98,0.99) });
    p2.drawLine({ start: { x: mx, y }, end: { x: mx + mw, y }, thickness: 2, color: m.c });
    p2.drawText(m.val,   { x: mx + 6, y: y - 22, size: 18, font: bold,    color: m.c });
    p2.drawText(m.label, { x: mx + 6, y: y - 40, size:  7, font: regular, color: muted });
  });
  y -= 68;

  // Tableau modules
  p2.drawText("2. Synthese par module", { x: 48, y, size: 13, font: bold, color: brand });
  y -= 18;
  const cols = [58, 188, 290, 358, 426, 490];
  ["Module","Description","Lignes","Conformite","Ouverts","Statut"].forEach((h, i) =>
    p2.drawText(h, { x: cols[i], y, size: 8, font: bold, color: ink })
  );
  y -= 4;
  p2.drawLine({ start: { x: 48, y }, end: { x: 548, y }, thickness: 0.5, color: rgb(0.8,0.8,0.8) });
  y -= 13;

  activeModules.forEach((m) => {
    if (y < 60) return;
    const cc = m.compliance >= 80 ? brand : m.compliance >= 60 ? warn : danger;
    const statusLabel = m.compliance >= 80 ? "Conforme" : m.compliance >= 60 ? "Attention" : "Critique";
    p2.drawText(m.shortName.slice(0,18),    { x: cols[0], y, size: 8, font: bold,    color: ink  });
    p2.drawText(m.description.slice(0,26),  { x: cols[1], y, size: 7, font: regular, color: muted });
    p2.drawText(String(m.records),          { x: cols[2], y, size: 8, font: regular, color: ink  });
    p2.drawText(`${m.compliance}%`,         { x: cols[3], y, size: 8, font: bold,    color: cc   });
    p2.drawText(String(m.pendingItems),     { x: cols[4], y, size: 8, font: regular, color: m.pendingItems > 10 ? danger : ink });
    p2.drawText(statusLabel,                { x: cols[5], y, size: 8, font: bold,    color: cc   });
    y -= 15;
  });

  // ── Page 3 : Graphiques ───────────────────────────────────────────
  const p3 = doc.addPage([595.28, 841.89]);
  drawPageHeader(p3, bold, dateStr, tenant.name);
  let cy = 790;

  p3.drawText("2. Graphiques de performance", { x: 48, y: cy, size: 14, font: bold, color: brand });
  cy -= 28;

  cy = drawHorizontalBarChart(p3, "Conformite par module (%)", activeModules.map((m) => ({
    label: m.shortName,
    value: m.compliance,
    color: m.compliance >= 80 ? [0.06,0.46,0.43] as [number,number,number] : m.compliance >= 60 ? [0.85,0.47,0.04] as [number,number,number] : [0.86,0.15,0.15] as [number,number,number],
  })), { x: 48, y: cy, width: 500, barHeight: 16, barGap: 5, labelWidth: 120, maxValue: 100, font: regular, boldFont: bold });

  cy -= 24;
  cy = drawHorizontalBarChart(p3, "Elements ouverts par module", activeModules.map((m) => ({
    label: m.shortName,
    value: m.pendingItems,
    color: m.pendingItems > 20 ? [0.86,0.15,0.15] as [number,number,number] : m.pendingItems > 10 ? [0.85,0.47,0.04] as [number,number,number] : [0.06,0.46,0.43] as [number,number,number],
  })), { x: 48, y: cy, width: 500, barHeight: 16, barGap: 5, labelWidth: 120, font: regular, boldFont: bold });

  cy -= 26;
  p3.drawText("Jauge de conformite par module", { x: 48, y: cy, size: 11, font: bold, color: brand });
  cy -= 16;
  activeModules.slice(0, 8).forEach((m, i) => {
    drawComplianceGauge(p3, m.shortName, m.compliance, {
      x: 48 + (i % 4) * 128,
      y: cy - Math.floor(i / 4) * 65,
      font: regular, boldFont: bold,
    });
  });

  // ── Page 4 : Alertes ─────────────────────────────────────────────
  const p4 = doc.addPage([595.28, 841.89]);
  drawPageHeader(p4, bold, dateStr, tenant.name);
  let ay = 785;

  p4.drawText("3. Alertes et recommandations operationnelles", { x: 48, y: ay, size: 14, font: bold, color: brand });
  ay -= 22;

  // Compteurs alertes
  [
    { label: "Total",     val: alertSummary.total,    c: ink    },
    { label: "Critiques", val: alertSummary.critical, c: danger },
    { label: "Hautes",    val: alertSummary.high,     c: warn   },
    { label: "Ouvertes",  val: alertSummary.open,     c: brand  },
  ].forEach((k, i) => {
    p4.drawText(String(k.val), { x: 58 + i * 110, y: ay,      size: 22, font: bold,    color: k.c   });
    p4.drawText(k.label,       { x: 58 + i * 110, y: ay - 17, size:  8, font: regular, color: muted });
  });
  ay -= 36;
  p4.drawLine({ start: { x: 48, y: ay }, end: { x: 548, y: ay }, thickness: 0.5, color: rgb(0.8,0.8,0.8) });
  ay -= 14;

  // En-têtes colonne
  ["Sev.", "Module", "Site", "Alerte", "Echeance", "Statut"].forEach((h, i) =>
    p4.drawText(h, { x: [48,88,165,230,430,500][i], y: ay, size: 8, font: bold, color: ink })
  );
  ay -= 13;

  const sortedAlerts = [...alerts].sort((a, b) => {
    const o: Record<string,number> = { Critique:0, Haute:1, Moyenne:2 };
    return (o[a.severity]??2) - (o[b.severity]??2);
  });

  sortedAlerts.slice(0, 18).forEach((alert) => {
    if (ay < 58) return;
    const sc = alert.severity === "Critique" ? danger : alert.severity === "Haute" ? warn : brand;
    p4.drawText(alert.severity.slice(0,7),    { x: 48,  y: ay, size: 8, font: bold,    color: sc  });
    p4.drawText(alert.moduleName.slice(0,11), { x: 88,  y: ay, size: 8, font: regular, color: ink });
    p4.drawText(alert.site.slice(0,13),       { x: 165, y: ay, size: 8, font: regular, color: ink });
    p4.drawText(alert.title.slice(0,28),      { x: 230, y: ay, size: 8, font: regular, color: ink });
    p4.drawText(alert.dueDate,                { x: 430, y: ay, size: 8, font: regular, color: ink });
    p4.drawText(alert.status.slice(0,12),     { x: 500, y: ay, size: 8, font: regular, color: ink });
    ay -= 13;
    if (alert.recommendation && ay > 66) {
      p4.drawText(`>> ${alert.recommendation.slice(0,68)}`, { x: 88, y: ay, size: 7, font: regular, color: muted });
      ay -= 12;
    }
    ay -= 2;
  });

  // Conclusions
  if (ay > 100) {
    ay -= 10;
    p4.drawLine({ start: { x: 48, y: ay }, end: { x: 548, y: ay }, thickness: 0.5, color: rgb(0.8,0.8,0.8) });
    ay -= 14;
    p4.drawText("Conclusions et priorites d'action", { x: 48, y: ay, size: 11, font: bold, color: brand });
    ay -= 14;
    const critModules = activeModules.filter((m) => m.compliance < 80 || m.pendingItems > 10);
    if (critModules.length === 0) {
      p4.drawText("Tous les modules sont dans les normes. Maintenir la surveillance.", { x: 58, y: ay, size: 9, font: regular, color: ink });
    } else {
      critModules.forEach((m) => {
        if (ay < 58) return;
        p4.drawText(`• ${m.shortName}: ${m.compliance}% conformite, ${m.pendingItems} ouvert(s) — actions correctives requises.`, { x: 58, y: ay, size: 9, font: regular, color: ink });
        ay -= 13;
      });
    }
  }

  // Numérotation des pages (couverture exclue)
  const pages = doc.getPages();
  pages.slice(1).forEach((p, i) => drawPageFooter(p, regular, i + 1, pages.length - 1));

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
