import "server-only";
import fontkit from "@pdf-lib/fontkit";
import { PDFDocument, PDFFont, PDFPage, rgb, type RGB } from "pdf-lib";
import { formatDateTime } from "@/lib/formatting";
import { translate, type Locale } from "@/lib/i18n";

export interface ReportRow {
  label: string;
  value: string;
}

export interface ReportSection {
  heading: string;
  rows?: ReportRow[];
  paragraphs?: string[];
}

export interface ReportStep {
  step: number;
  title: string;
  calculation: string;
  result: string;
  principle: string;
  reason: string;
}

export interface ReportChartItem {
  label: string;
  value: number;
}

export interface ReportChart {
  title: string;
  currency: string;
  items: ReportChartItem[];
}

export interface ReportData {
  title: string;
  subtitle?: string;
  locale?: Locale;
  meta: ReportRow[];
  sections: ReportSection[];
  steps: ReportStep[];
  chart?: ReportChart;
  disclaimer: string;
}

const PAGE_W = 595.28; // A4
const PAGE_H = 841.89;
const MARGIN = 42;
const CONTENT_W = PAGE_W - MARGIN * 2;

const EMERALD_900 = rgb(0.024, 0.373, 0.275);
const EMERALD_700 = rgb(0.016, 0.471, 0.341);
const EMERALD_50 = rgb(0.925, 0.992, 0.961);
const SLATE_900 = rgb(0.059, 0.09, 0.165);
const SLATE_700 = rgb(0.2, 0.255, 0.333);
const SLATE_500 = rgb(0.392, 0.455, 0.545);
const BORDER = rgb(0.82, 0.89, 0.86);
const WHITE = rgb(1, 1, 1);

const CHART_COLORS: RGB[] = [
  rgb(0.016, 0.471, 0.341),
  rgb(0.063, 0.725, 0.506),
  rgb(0.204, 0.827, 0.6),
  rgb(0.059, 0.463, 0.431),
  rgb(0.078, 0.722, 0.651),
  rgb(0.961, 0.62, 0.043),
  rgb(0.851, 0.467, 0.024),
  rgb(0.518, 0.8, 0.086),
  rgb(0.133, 0.773, 0.369),
  rgb(0.22, 0.741, 0.973),
];

interface Fonts {
  regular: PDFFont;
  bold: PDFFont;
}

interface Cursor {
  page: PDFPage;
  y: number;
  pages: PDFPage[];
}

const fontCache = new Map<string, ArrayBuffer>();

async function fetchFontBytes(urls: string[]): Promise<ArrayBuffer | null> {
  for (const url of urls) {
    const cached = fontCache.get(url);
    if (cached) return cached;
    try {
      const res = await fetch(url, { cache: "force-cache" });
      if (!res.ok) continue;
      const buf = await res.arrayBuffer();
      if (buf.byteLength < 1000) continue;
      fontCache.set(url, buf);
      return buf;
    } catch {
      // try next
    }
  }
  return null;
}

async function loadFonts(pdf: PDFDocument, locale: Locale): Promise<Fonts> {
  const { StandardFonts } = await import("pdf-lib");
  try {
    pdf.registerFontkit(fontkit);
    let regularUrls: string[];
    let boldUrls: string[];
    if (locale === "ar") {
      regularUrls = [
        "https://raw.githubusercontent.com/google/fonts/main/ofl/notonaskharabic/NotoNaskhArabic-Regular.ttf",
        "https://raw.githubusercontent.com/google/fonts/main/ofl/notonaskharabic/static/NotoNaskhArabic-Regular.ttf",
      ];
      boldUrls = [
        "https://raw.githubusercontent.com/google/fonts/main/ofl/notonaskharabic/NotoNaskhArabic-Bold.ttf",
        "https://raw.githubusercontent.com/google/fonts/main/ofl/notonaskharabic/static/NotoNaskhArabic-Bold.ttf",
        "https://raw.githubusercontent.com/google/fonts/main/ofl/notonaskharabic/NotoNaskhArabic-SemiBold.ttf",
      ];
    } else if (locale === "bn") {
      regularUrls = [
        "https://raw.githubusercontent.com/google/fonts/main/ofl/hindsiliguri/HindSiliguri-Regular.ttf",
      ];
      boldUrls = [
        "https://raw.githubusercontent.com/google/fonts/main/ofl/hindsiliguri/HindSiliguri-SemiBold.ttf",
        "https://raw.githubusercontent.com/google/fonts/main/ofl/hindsiliguri/HindSiliguri-Bold.ttf",
      ];
    } else {
      regularUrls = [
        "https://raw.githubusercontent.com/google/fonts/main/ofl/poppins/Poppins-Regular.ttf",
      ];
      boldUrls = [
        "https://raw.githubusercontent.com/google/fonts/main/ofl/poppins/Poppins-SemiBold.ttf",
        "https://raw.githubusercontent.com/google/fonts/main/ofl/poppins/Poppins-Bold.ttf",
      ];
    }
    const [regBuf, boldBuf] = await Promise.all([fetchFontBytes(regularUrls), fetchFontBytes(boldUrls)]);
    if (regBuf) {
      const regular = await pdf.embedFont(regBuf);
      const bold = boldBuf ? await pdf.embedFont(boldBuf) : regular;
      return { regular, bold };
    }
  } catch {
    // fallback to standard fonts
  }
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  return { regular, bold };
}

function sanitize(text: string): string {
  return text.replace(/\r/g, "").replace(/\t/g, "  ");
}

function wrapText(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const normalized = sanitize(text);
  const paragraphs = normalized.split("\n");
  const lines: string[] = [];
  for (const para of paragraphs) {
    const words = para.split(/\s+/).filter(Boolean);
    if (words.length === 0) {
      lines.push("");
      continue;
    }
    let line = words[0] ?? "";
    for (let i = 1; i < words.length; i += 1) {
      const word = words[i]!;
      const candidate = `${line} ${word}`;
      let width: number;
      try {
        width = font.widthOfTextAtSize(candidate, size);
      } catch {
        width = candidate.length * size * 0.5;
      }
      if (width <= maxWidth) {
        line = candidate;
      } else {
        lines.push(line);
        // break very long unbreakable tokens
        try {
          if (font.widthOfTextAtSize(word, size) > maxWidth) {
            let chunk = "";
            for (const ch of word) {
              const next = chunk + ch;
              let nw = 0;
              try { nw = font.widthOfTextAtSize(next, size); } catch { nw = next.length * size * 0.5; }
              if (nw > maxWidth && chunk) {
                lines.push(chunk);
                chunk = ch;
              } else {
                chunk = next;
              }
            }
            line = chunk;
          } else {
            line = word;
          }
        } catch {
          line = word;
        }
      }
    }
    lines.push(line);
  }
  return lines.length ? lines : [""];
}

function textWidth(text: string, font: PDFFont, size: number): number {
  try {
    return font.widthOfTextAtSize(text, size);
  } catch {
    let w = 0;
    for (const ch of text) {
      try {
        w += font.widthOfTextAtSize(ch, size);
      } catch {
        w += size * 0.6;
      }
    }
    return w;
  }
}

function drawTextSafe(page: PDFPage, text: string, opts: { x: number; y: number; size: number; font: PDFFont; color: RGB }) {
  try {
    page.drawText(text, opts);
  } catch {
    let x = opts.x;
    for (const ch of text) {
      try {
        page.drawText(ch, { ...opts, x });
        x += opts.font.widthOfTextAtSize(ch, opts.size);
      } catch {
        try {
          page.drawText("?", { ...opts, x });
          x += opts.font.widthOfTextAtSize("?", opts.size);
        } catch {
          x += opts.size * 0.5;
        }
      }
    }
  }
}

function ensureSpace(cursor: Cursor, needed: number, pdf: PDFDocument, fonts: Fonts, locale: Locale, disclaimer: string) {
  if (cursor.y - needed < MARGIN + 28) {
    drawFooter(cursor.page, fonts, locale, cursor.pages.length, 0, disclaimer);
    const p = pdf.addPage([PAGE_W, PAGE_H]);
    cursor.pages.push(p);
    cursor.page = p;
    cursor.y = PAGE_H - MARGIN;
  }
}

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function describeArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number): string {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArc = endAngle - startAngle <= 180 ? "0" : "1";
  return `M ${cx} ${cy} L ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y} Z`;
}

function drawChart(cursor: Cursor, fonts: Fonts, chart: ReportChart, pdf: PDFDocument, locale: Locale, disclaimer: string) {
  const items = chart.items.filter((i) => i.value > 0);
  if (items.length === 0) return;
  const total = items.reduce((s, i) => s + i.value, 0);
  if (total <= 0) return;

  ensureSpace(cursor, 180, pdf, fonts, locale, disclaimer);
  cursor.page.drawRectangle({ x: MARGIN, y: cursor.y - 18, width: CONTENT_W, height: 18, color: EMERALD_700 });
  drawTextSafe(cursor.page, chart.title, { x: MARGIN + 8, y: cursor.y - 13, size: 9.5, font: fonts.bold, color: WHITE });
  cursor.y -= 26;

  const boxTop = cursor.y;
  const cx = MARGIN + 75;
  const cy = boxTop - 65;
  const r = 55;

  let angle = 0;
  items.forEach((item, idx) => {
    const sweep = (item.value / total) * 360;
    const end = angle + sweep;
    const color = CHART_COLORS[idx % CHART_COLORS.length]!;
    if (sweep >= 359.9) {
      cursor.page.drawCircle({ x: cx, y: cy, size: r, color });
    } else if (sweep > 0.5) {
      const path = describeArc(cx, cy, r, angle, end);
      try {
        cursor.page.drawSvgPath(path, { color, borderWidth: 0 });
      } catch {
        // ignore drawing errors
      }
    }
    angle = end;
  });
  // subtle outline
  try { cursor.page.drawCircle({ x: cx, y: cy, size: r, borderColor: BORDER, borderWidth: 0.5 }); } catch { /* noop */ }

  let ly = boxTop - 10;
  const lx = MARGIN + 150;
  const legendW = CONTENT_W - 160;
  const maxLegend = Math.min(items.length, 9);
  const fmtVal = (n: number) => {
    try {
      return new Intl.NumberFormat(locale === "ar" ? "ar" : locale === "bn" ? "bn-BD" : "en-US", { maximumFractionDigits: 2 }).format(n);
    } catch { return String(n); }
  };
  for (let i = 0; i < maxLegend; i += 1) {
    const item = items[i]!;
    const color = CHART_COLORS[i % CHART_COLORS.length]!;
    const pct = ((item.value / total) * 100).toFixed(1);
    cursor.page.drawRectangle({ x: lx, y: ly - 6, width: 8, height: 8, color });
    const label = `${item.label}: ${fmtVal(item.value)} ${chart.currency} (${pct}%)`;
    const lines = wrapText(label, fonts.regular, 7.5, legendW - 14);
    drawTextSafe(cursor.page, lines[0] ?? label, { x: lx + 12, y: ly - 5, size: 7.5, font: fonts.regular, color: SLATE_700 });
    ly -= 13;
  }
  if (items.length > maxLegend) {
    drawTextSafe(cursor.page, `+${items.length - maxLegend}`, { x: lx + 12, y: ly - 5, size: 7.5, font: fonts.regular, color: SLATE_500 });
    ly -= 13;
  }

  cursor.y = Math.min(cy - r - 12, ly - 8) - 8;
}

function drawSection(cursor: Cursor, fonts: Fonts, section: ReportSection, pdf: PDFDocument, locale: Locale, disclaimer: string) {
  ensureSpace(cursor, 24, pdf, fonts, locale, disclaimer);
  cursor.page.drawRectangle({ x: MARGIN, y: cursor.y - 18, width: CONTENT_W, height: 18, color: EMERALD_700 });
  drawTextSafe(cursor.page, section.heading, { x: MARGIN + 8, y: cursor.y - 13, size: 9.5, font: fonts.bold, color: WHITE });
  cursor.y -= 26;

  if (section.rows && section.rows.length > 0) {
    for (let i = 0; i < section.rows.length; i += 1) {
      const row = section.rows[i]!;
      const valueLines = wrapText(row.value, fonts.regular, 8.5, CONTENT_W * 0.52 - 12);
      const h = Math.max(15, valueLines.length * 11 + 4);
      ensureSpace(cursor, h + 2, pdf, fonts, locale, disclaimer);
      if (i % 2 === 0) {
        cursor.page.drawRectangle({ x: MARGIN, y: cursor.y - h + 3, width: CONTENT_W, height: h, color: rgb(0.97, 0.985, 0.975) });
      }
      cursor.page.drawLine({ start: { x: MARGIN, y: cursor.y - h + 3 }, end: { x: MARGIN + CONTENT_W, y: cursor.y - h + 3 }, thickness: 0.3, color: BORDER });
      drawTextSafe(cursor.page, row.label, { x: MARGIN + 8, y: cursor.y - 9, size: 8.5, font: fonts.bold, color: SLATE_700 });
      let vy = cursor.y - 9;
      for (const vl of valueLines) {
        drawTextSafe(cursor.page, vl, { x: MARGIN + CONTENT_W * 0.45, y: vy, size: 8.5, font: fonts.regular, color: SLATE_900 });
        vy -= 11;
      }
      cursor.y -= h;
    }
    cursor.y -= 6;
  }

  if (section.paragraphs && section.paragraphs.length > 0) {
    for (const para of section.paragraphs) {
      const lines = wrapText(para, fonts.regular, 9, CONTENT_W - 16);
      for (const line of lines) {
        ensureSpace(cursor, 12, pdf, fonts, locale, disclaimer);
        drawTextSafe(cursor.page, line, { x: MARGIN + 8, y: cursor.y, size: 9, font: fonts.regular, color: SLATE_700 });
        cursor.y -= 12;
      }
      cursor.y -= 4;
    }
  }
  cursor.y -= 8;
}

function drawSteps(cursor: Cursor, fonts: Fonts, steps: ReportStep[], pdf: PDFDocument, locale: Locale, disclaimer: string) {
  const t = (key: string) => translate(locale, key);
  ensureSpace(cursor, 24, pdf, fonts, locale, disclaimer);
  cursor.page.drawRectangle({ x: MARGIN, y: cursor.y - 18, width: CONTENT_W, height: 18, color: EMERALD_700 });
  drawTextSafe(cursor.page, t("report.section.explanation"), { x: MARGIN + 8, y: cursor.y - 13, size: 9.5, font: fonts.bold, color: WHITE });
  cursor.y -= 28;

  for (const step of steps) {
    const head = `${t("report.step")} ${step.step}: ${step.title}`;
    const headLines = wrapText(head, fonts.bold, 9, CONTENT_W - 20);
    const rows: Array<[string, string]> = [
      [t("report.calculation"), step.calculation],
      [t("report.result"), step.result],
      [t("report.principle"), step.principle],
      [t("report.reason"), step.reason],
    ];

    let est = headLines.length * 12 + 10;
    for (const [, v] of rows) est += wrapText(v || "-", fonts.regular, 8.5, CONTENT_W - 115).length * 11 + 4;
    ensureSpace(cursor, Math.min(est + 12, 170), pdf, fonts, locale, disclaimer);

    const cardTop = cursor.y;
    let innerY = cursor.y - 8;
    // accent bar and card border will be drawn after measuring
    for (const hl of headLines) {
      ensureSpace(cursor, 14, pdf, fonts, locale, disclaimer);
      drawTextSafe(cursor.page, hl, { x: MARGIN + 10, y: innerY, size: 9, font: fonts.bold, color: EMERALD_900 });
      innerY -= 12;
    }
    innerY -= 2;
    for (const [label, value] of rows) {
      const vLines = wrapText(value || "-", fonts.regular, 8.5, CONTENT_W - 115);
      for (let vi = 0; vi < vLines.length; vi += 1) {
        if (innerY < MARGIN + 32) {
          // close current card segment and continue on new page
          const segBottom = innerY - 2;
          cursor.page.drawRectangle({ x: MARGIN, y: segBottom, width: CONTENT_W, height: cardTop - segBottom, borderColor: BORDER, borderWidth: 0.5 });
          cursor.page.drawRectangle({ x: MARGIN, y: segBottom, width: 3, height: cardTop - segBottom, color: EMERALD_700 });
          drawFooter(cursor.page, fonts, locale, cursor.pages.length, 0, disclaimer);
          const p = pdf.addPage([PAGE_W, PAGE_H]);
          cursor.pages.push(p);
          cursor.page = p;
          cursor.y = PAGE_H - MARGIN;
          innerY = cursor.y - 10;
        }
        if (vi === 0) {
          drawTextSafe(cursor.page, `${label}:`, { x: MARGIN + 10, y: innerY, size: 8.5, font: fonts.bold, color: SLATE_700 });
        }
        drawTextSafe(cursor.page, vLines[vi]!, { x: MARGIN + 98, y: innerY, size: 8.5, font: fonts.regular, color: SLATE_900 });
        innerY -= 11;
      }
      innerY -= 2;
    }
    const cardBottom = innerY - 4;
    cursor.page.drawRectangle({ x: MARGIN, y: cardBottom, width: CONTENT_W, height: cardTop - cardBottom, borderColor: BORDER, borderWidth: 0.5 });
    cursor.page.drawRectangle({ x: MARGIN, y: cardBottom, width: 3, height: cardTop - cardBottom, color: EMERALD_700 });
    cursor.y = cardBottom - 8;
  }
}

function drawFooter(page: PDFPage, fonts: Fonts, locale: Locale, pageNum: number, total: number, disclaimer: string) {
  const discLines = wrapText(disclaimer, fonts.regular, 6.5, CONTENT_W - 90).slice(0, 2);
  page.drawLine({ start: { x: MARGIN, y: MARGIN + 12 }, end: { x: MARGIN + CONTENT_W, y: MARGIN + 12 }, thickness: 0.4, color: BORDER });
  const fy = MARGIN - 2;
  for (let i = 0; i < discLines.length; i += 1) {
    drawTextSafe(page, discLines[i]!, { x: MARGIN, y: fy + (discLines.length - 1 - i) * 8, size: 6.5, font: fonts.regular, color: SLATE_500 });
  }
  if (total > 0) {
    const label = `${translate(locale, "report.page")} ${pageNum}/${total}`;
    const w = textWidth(label, fonts.regular, 7);
    drawTextSafe(page, label, { x: MARGIN + CONTENT_W - w, y: MARGIN + 14, size: 7, font: fonts.regular, color: SLATE_500 });
  }
}

export async function buildPdfReport(data: ReportData): Promise<Uint8Array> {
  const locale = data.locale ?? "en";
  const pdf = await PDFDocument.create();
  const fonts = await loadFonts(pdf, locale);
  const t = (key: string, vars?: Record<string, string | number>) => translate(locale, key, vars);

  const first = pdf.addPage([PAGE_W, PAGE_H]);
  const cursor: Cursor = { page: first, y: PAGE_H - MARGIN, pages: [first] };

  const headerH = 72;
  ensureSpace(cursor, headerH + 8, pdf, fonts, locale, data.disclaimer);
  cursor.page.drawRectangle({ x: MARGIN, y: cursor.y - headerH, width: CONTENT_W, height: headerH, color: EMERALD_900 });
  drawTextSafe(cursor.page, "Mīzān", { x: MARGIN + 16, y: cursor.y - 22, size: 16, font: fonts.bold, color: WHITE });
  const titleLines = wrapText(data.title, fonts.bold, 13, CONTENT_W - 32);
  let ty = cursor.y - 40;
  for (const line of titleLines.slice(0, 2)) {
    drawTextSafe(cursor.page, line, { x: MARGIN + 16, y: ty, size: 13, font: fonts.bold, color: WHITE });
    ty -= 15;
  }
  if (data.subtitle) {
    const subLines = wrapText(data.subtitle, fonts.regular, 8.5, CONTENT_W - 32);
    drawTextSafe(cursor.page, subLines[0] ?? data.subtitle, { x: MARGIN + 16, y: ty + 2, size: 8.5, font: fonts.regular, color: rgb(0.82, 0.98, 0.898) });
  }
  cursor.y -= headerH + 14;

  const gen = `${t("report.generatedOn")}: ${formatDateTime(new Date(), locale)}`;
  drawTextSafe(cursor.page, gen, { x: MARGIN, y: cursor.y, size: 8, font: fonts.regular, color: SLATE_500 });
  cursor.y -= 14;

  if (data.meta.length > 0) {
    const rows = data.meta;
    const rowH = 16;
    const boxH = rows.length * rowH + 12;
    ensureSpace(cursor, boxH + 10, pdf, fonts, locale, data.disclaimer);
    cursor.page.drawRectangle({ x: MARGIN, y: cursor.y - boxH, width: CONTENT_W, height: boxH, color: EMERALD_50, borderColor: BORDER, borderWidth: 0.5 });
    let my = cursor.y - 14;
    const labelW = Math.min(170, CONTENT_W * 0.42);
    for (const row of rows) {
      drawTextSafe(cursor.page, row.label, { x: MARGIN + 10, y: my, size: 8.5, font: fonts.bold, color: SLATE_700 });
      const valLines = wrapText(row.value, fonts.regular, 8.5, CONTENT_W - labelW - 24);
      drawTextSafe(cursor.page, valLines[0] ?? "", { x: MARGIN + 10 + labelW, y: my, size: 8.5, font: fonts.regular, color: SLATE_900 });
      my -= rowH;
    }
    cursor.y -= boxH + 12;
  }

  if (data.chart && data.chart.items.length > 0) {
    drawChart(cursor, fonts, data.chart, pdf, locale, data.disclaimer);
  }

  for (const section of data.sections) {
    drawSection(cursor, fonts, section, pdf, locale, data.disclaimer);
  }

  if (data.steps.length > 0) {
    drawSteps(cursor, fonts, data.steps, pdf, locale, data.disclaimer);
  }

  const total = cursor.pages.length;
  for (let i = 0; i < cursor.pages.length; i += 1) {
    drawFooter(cursor.pages[i]!, fonts, locale, i + 1, total, data.disclaimer);
  }

  return pdf.save();
}
