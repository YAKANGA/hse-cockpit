import type { PDFPage } from "pdf-lib";
import { rgb } from "pdf-lib";

type BarChartItem = {
  label: string;
  value: number;
  color?: [number, number, number];
};

type ChartOptions = {
  x: number;
  y: number;
  width: number;
  barHeight?: number;
  barGap?: number;
  labelWidth?: number;
  maxValue?: number;
  font: Awaited<ReturnType<import("pdf-lib").PDFDocument["embedFont"]>>;
  boldFont: Awaited<ReturnType<import("pdf-lib").PDFDocument["embedFont"]>>;
};

const DEFAULT_COLOR: [number, number, number] = [0.06, 0.46, 0.43];

export function drawHorizontalBarChart(
  page: PDFPage,
  title: string,
  items: BarChartItem[],
  opts: ChartOptions,
): number {
  const {
    x,
    y: startY,
    width,
    barHeight = 14,
    barGap = 6,
    labelWidth = 120,
    font,
    boldFont,
  } = opts;

  const chartWidth = width - labelWidth - 60;
  const maxVal = opts.maxValue ?? Math.max(...items.map((i) => i.value), 1);
  const ink = rgb(0.07, 0.09, 0.14);
  const muted = rgb(0.5, 0.5, 0.5);
  const lineColor = rgb(0.9, 0.9, 0.9);

  let y = startY;

  // Title
  page.drawText(title, { x, y, size: 12, font: boldFont, color: rgb(0.06, 0.46, 0.43) });
  y -= 18;

  // Grid lines (3 vertical)
  [0, 0.33, 0.66, 1].forEach((pct) => {
    const gx = x + labelWidth + pct * chartWidth;
    page.drawLine({ start: { x: gx, y: y + 4 }, end: { x: gx, y: y - items.length * (barHeight + barGap) }, thickness: 0.5, color: lineColor });
    if (pct > 0) {
      page.drawText(`${Math.round(pct * maxVal)}`, { x: gx - 6, y: y - items.length * (barHeight + barGap) - 12, size: 7, font, color: muted });
    }
  });

  // Bars
  for (const item of items) {
    const barWidth = Math.max(2, (item.value / maxVal) * chartWidth);
    const [r, g, b] = item.color ?? DEFAULT_COLOR;

    // Label
    const labelText = item.label.length > 18 ? item.label.slice(0, 16) + "…" : item.label;
    page.drawText(labelText, { x, y: y - 2, size: 8, font, color: ink });

    // Bar background
    page.drawRectangle({ x: x + labelWidth, y: y - 2, width: chartWidth, height: barHeight, color: rgb(0.97, 0.97, 0.97) });

    // Bar fill
    page.drawRectangle({ x: x + labelWidth, y: y - 2, width: barWidth, height: barHeight, color: rgb(r, g, b) });

    // Value label
    page.drawText(String(item.value), {
      x: x + labelWidth + barWidth + 4,
      y: y + 3,
      size: 8,
      font: boldFont,
      color: rgb(r, g, b),
    });

    y -= barHeight + barGap;
  }

  return y - 8;
}

export function drawComplianceGauge(
  page: PDFPage,
  label: string,
  value: number,
  opts: Pick<ChartOptions, "x" | "y" | "font" | "boldFont">,
): void {
  const { x, y, font, boldFont } = opts;
  const ink = rgb(0.07, 0.09, 0.14);
  const color = value >= 80 ? rgb(0.06, 0.46, 0.43) : value >= 60 ? rgb(0.85, 0.47, 0.04) : rgb(0.86, 0.15, 0.15);

  page.drawText(label, { x, y, size: 9, font, color: rgb(0.4, 0.4, 0.4) });
  page.drawText(`${value}%`, { x, y: y - 16, size: 18, font: boldFont, color });
  page.drawRectangle({ x, y: y - 28, width: 80, height: 6, color: rgb(0.92, 0.92, 0.92) });
  page.drawRectangle({ x, y: y - 28, width: Math.round(0.8 * value), height: 6, color });

  const label2 = value >= 80 ? "Conforme" : value >= 60 ? "A ameliorer" : "Critique";
  page.drawText(label2, { x, y: y - 40, size: 8, font, color });
}
