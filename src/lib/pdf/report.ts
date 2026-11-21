import "server-only";

function ensureRegeneratorRuntime() {
  const g = globalThis as typeof globalThis & { regeneratorRuntime?: unknown };
  if (g.regeneratorRuntime) return;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const rt = require("next/dist/compiled/regenerator-runtime/runtime.js");
    g.regeneratorRuntime = rt?.default ?? rt?.regeneratorRuntime ?? rt;
  } catch {
    // ignore
  }
  if (!g.regeneratorRuntime) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const rt = require("regenerator-runtime/runtime");
      g.regeneratorRuntime = rt?.default ?? rt?.regeneratorRuntime ?? rt;
    } catch {
      // ignore
    }
  }
}

ensureRegeneratorRuntime();

import fontkit from "@pdf-lib/fontkit";
import {
  PDFDocument,
  PDFPage,
  rgb,
  type RGB,
  pushGraphicsState,
  popGraphicsState,
  translate as pdfTranslate,
  scale,
  setFillingRgbColor,
  fill,
  moveTo,
  lineTo,
  appendBezierCurve,
  appendQuadraticCurve,
  closePath,
  type PDFOperator,
} from "pdf-lib";
import { readFile } from "node:fs/promises";
import path from "node:path";
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

interface GlyphPosition {
  xAdvance?: number;
  yAdvance?: number;
  xOffset?: number;
  yOffset?: number;
}

interface PathCommand {
  command: string;
  args: number[];
}

interface GlyphPathLike {
  toSVG: () => string;
  commands?: PathCommand[];
}

interface GlyphLike {
  path?: GlyphPathLike;
  advanceWidth?: number;
}

interface LayoutRun {
  glyphs: GlyphLike[];
  positions: GlyphPosition[];
}

interface FkFont {
  unitsPerEm?: number;
  layout: (text: string, userFeatures?: unknown, script?: unknown, language?: unknown, direction?: unknown) => LayoutRun;
  glyphForCodePoint?: (codePoint: number) => number;
  getGlyph?: (id: number) => GlyphLike;
}

interface FontFace {
  fk: FkFont;
  upem: number;
}

interface Fonts {
  regular: FontFace;
  bold: FontFace;
  fallbackRegular: FontFace;
  fallbackBold: FontFace;
}

interface Cursor {
  page: PDFPage;
  y: number;
  pages: PDFPage[];
}

const fontCache = new Map<string, ArrayBuffer>();

function toArrayBuffer(buf: Buffer): ArrayBuffer {
  return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer;
}

async function readLocalFont(fileName: string): Promise<ArrayBuffer | null> {
  const key = `local:${fileName}`;
  const cached = fontCache.get(key);
  if (cached) return cached;
  const candidates = [
    path.join(process.cwd(), "public", "fonts", "pdf", fileName),
    path.join(process.cwd(), ".next", "standalone", "public", "fonts", "pdf", fileName),
  ];
  for (const p of candidates) {
    try {
      const buf = await readFile(p);
      if (buf.byteLength < 1000) continue;
      const ab = toArrayBuffer(buf);
      fontCache.set(key, ab);
      return ab;
    } catch {
      // try next candidate
    }
  }
  return null;
}

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

async function resolveFontBytesForLocale(locale: Locale): Promise<{ regular: ArrayBuffer | null; bold: ArrayBuffer | null }> {
  let localRegular: string[];
  let localBold: string[];
  let regularUrls: string[];
  let boldUrls: string[];

  if (locale === "ar") {
    localRegular = ["NotoNaskhArabic-Regular.ttf"];
    localBold = ["NotoNaskhArabic-Bold.ttf", "NotoNaskhArabic-Regular.ttf"];
    regularUrls = [
      "https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/notonaskharabic/NotoNaskhArabic%5Bwght%5D.ttf",
      "https://raw.githubusercontent.com/google/fonts/main/ofl/notonaskharabic/NotoNaskhArabic%5Bwght%5D.ttf",
    ];
    boldUrls = regularUrls;
  } else if (locale === "bn") {
    localRegular = ["HindSiliguri-Regular.ttf", "NotoSansBengali-Regular.ttf", "NotoSansBengali.ttf"];
    localBold = ["HindSiliguri-SemiBold.ttf", "HindSiliguri-Regular.ttf", "NotoSansBengali-Bold.ttf", "NotoSansBengali-Regular.ttf"];
    regularUrls = [
      "https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/hindsiliguri/HindSiliguri-Regular.ttf",
      "https://raw.githubusercontent.com/google/fonts/main/ofl/hindsiliguri/HindSiliguri-Regular.ttf",
      "https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/notosansbengali/NotoSansBengali%5Bwdth%2Cwght%5D.ttf",
    ];
    boldUrls = [
      "https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/hindsiliguri/HindSiliguri-SemiBold.ttf",
      "https://raw.githubusercontent.com/google/fonts/main/ofl/hindsiliguri/HindSiliguri-SemiBold.ttf",
      "https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/hindsiliguri/HindSiliguri-Bold.ttf",
      "https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/notosansbengali/NotoSansBengali%5Bwdth%2Cwght%5D.ttf",
    ];
  } else {
    localRegular = ["Poppins-Regular.ttf"];
    localBold = ["Poppins-SemiBold.ttf", "Poppins-Regular.ttf"];
    regularUrls = [
      "https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/poppins/Poppins-Regular.ttf",
      "https://raw.githubusercontent.com/google/fonts/main/ofl/poppins/Poppins-Regular.ttf",
    ];
    boldUrls = [
      "https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/poppins/Poppins-SemiBold.ttf",
      "https://raw.githubusercontent.com/google/fonts/main/ofl/poppins/Poppins-SemiBold.ttf",
      "https://raw.githubusercontent.com/google/fonts/main/ofl/poppins/Poppins-Bold.ttf",
    ];
  }

  const pickLocal = async (names: string[]) => {
    for (const n of names) {
      const b = await readLocalFont(n);
      if (b) return b;
    }
    return null;
  };

  let regular = await pickLocal(localRegular);
  let bold = await pickLocal(localBold);
  if (!regular) regular = await fetchFontBytes(regularUrls);
  if (!bold) bold = await fetchFontBytes(boldUrls);
  return { regular, bold };
}

async function resolveLatinFallbackBytes(): Promise<{ regular: ArrayBuffer | null; bold: ArrayBuffer | null }> {
  const pickLocal = async (names: string[]) => {
    for (const n of names) {
      const b = await readLocalFont(n);
      if (b) return b;
    }
    return null;
  };
  let regular = await pickLocal(["Poppins-Regular.ttf"]);
  let bold = await pickLocal(["Poppins-SemiBold.ttf", "Poppins-Regular.ttf"]);
  if (!regular) {
    regular = await fetchFontBytes([
      "https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/poppins/Poppins-Regular.ttf",
      "https://raw.githubusercontent.com/google/fonts/main/ofl/poppins/Poppins-Regular.ttf",
    ]);
  }
  if (!bold) {
    bold = await fetchFontBytes([
      "https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/poppins/Poppins-SemiBold.ttf",
      "https://raw.githubusercontent.com/google/fonts/main/ofl/poppins/Poppins-SemiBold.ttf",
    ]);
  }
  return { regular, bold };
}

function createFontFace(bytes: ArrayBuffer | Uint8Array): FontFace {
  const fkMod = fontkit as unknown as { create?: (data: Buffer | Uint8Array | ArrayBuffer) => FkFont; default?: { create: (data: Buffer | Uint8Array | ArrayBuffer) => FkFont } };
  const create = fkMod.create ?? fkMod.default?.create;
  if (!create) throw new Error("fontkit.create unavailable");
  const fk = create(bytes instanceof Uint8Array ? bytes : Buffer.from(bytes));
  return { fk, upem: fk.unitsPerEm || 1000 };
}

async function loadFonts(locale: Locale): Promise<Fonts> {
  let regular: FontFace | null = null;
  let bold: FontFace | null = null;
  let fallbackRegular: FontFace | null = null;
  let fallbackBold: FontFace | null = null;

  try {
    const [primary, latin] = await Promise.all([resolveFontBytesForLocale(locale), resolveLatinFallbackBytes()]);
    if (primary.regular) regular = createFontFace(primary.regular);
    if (primary.bold) bold = createFontFace(primary.bold);
    if (latin.regular) fallbackRegular = createFontFace(latin.regular);
    if (latin.bold) fallbackBold = createFontFace(latin.bold);
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.error("[pdf:fonts]", err);
    }
  }

  // Final fallback to latin for everything if primary missing
  if (!regular && fallbackRegular) regular = fallbackRegular;
  if (!bold && fallbackBold) bold = fallbackBold;
  if (!regular && bold) regular = bold;
  if (!bold && regular) bold = regular;
  if (!fallbackRegular && regular) fallbackRegular = regular;
  if (!fallbackBold && bold) fallbackBold = bold;

  if (!regular || !bold || !fallbackRegular || !fallbackBold) {
    throw new Error("Failed to load PDF fonts");
  }

  return { regular, bold, fallbackRegular, fallbackBold };
}

function sanitize(text: string): string {
  return text.replace(/\r/g, "").replace(/\t/g, "  ");
}

const BENGALI_DIGITS = "০১২৩৪৫৬৭৮৯";

function normalizePdfText(text: string): string {
  return text.replace(/[০-৯]/g, (d) => String(BENGALI_DIGITS.indexOf(d)));
}

function preferFallbackChar(ch: string): boolean {
  return /[0-9\u00D7\u00F7%\.,:\/\-\+\(\)\[\]]/.test(ch);
}

function layoutRun(face: FontFace, text: string): LayoutRun {
  ensureRegeneratorRuntime();
  try {
    return face.fk.layout(text);
  } catch {
    // fallback: layout char by char to avoid total failure
    const glyphs: GlyphLike[] = [];
    const positions: GlyphPosition[] = [];
    for (const ch of text) {
      try {
        const r = face.fk.layout(ch);
        for (let i = 0; i < r.glyphs.length; i++) {
          const g = r.glyphs[i];
          const p = r.positions[i];
          if (g) glyphs.push(g);
          if (p) positions.push(p);
        }
      } catch {
        try {
          const gid = face.fk.glyphForCodePoint?.(ch.codePointAt(0) ?? 63);
          if (gid != null) {
            const g = face.fk.getGlyph ? face.fk.getGlyph(gid) : null;
            if (g) {
              glyphs.push(g);
              positions.push({ xAdvance: g.advanceWidth || face.upem * 0.5, yAdvance: 0, xOffset: 0, yOffset: 0 });
              continue;
            }
          }
        } catch {
          // ignore
        }
      }
    }
    return { glyphs, positions };
  }
}

function measureRun(face: FontFace, text: string, size: number): number {
  if (!text) return 0;
  const run = layoutRun(face, text);
  const scale = size / (face.upem || 1000);
  let w = 0;
  for (const pos of run.positions || []) {
    w += (pos.xAdvance || 0) * scale;
  }
  return w;
}

function measureText(text: string, primary: FontFace, fallback: FontFace, size: number): number {
  const normalized = sanitize(normalizePdfText(text));
  if (!normalized) return 0;

  let w = 0;
  let run = "";
  let runFace: FontFace | null = null;

  const flush = () => {
    if (!run || !runFace) return;
    w += measureRun(runFace, run, size);
    run = "";
    runFace = null;
  };

  for (const ch of normalized) {
    const face = preferFallbackChar(ch) ? fallback : primary;
    if (!runFace || face === runFace) {
      run += ch;
      runFace = face;
    } else {
      flush();
      run = ch;
      runFace = face;
    }
  }
  flush();
  return w;
}

function textWidth(text: string, font: FontFace, size: number, fallbackFont: FontFace = font): number {
  return measureText(text, font, fallbackFont, size);
}

function wrapText(text: string, font: FontFace, size: number, maxWidth: number, fallbackFont: FontFace = font): string[] {
  const normalized = sanitize(normalizePdfText(text));
  const paragraphs = normalized.split("\n");
  const lines: string[] = [];
  const w = (s: string) => measureText(s, font, fallbackFont, size);
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
      if (w(candidate) <= maxWidth) {
        line = candidate;
      } else {
        lines.push(line);
        if (w(word) > maxWidth) {
          let chunk = "";
          for (const ch of word) {
            const next = chunk + ch;
            if (w(next) > maxWidth && chunk) {
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
      }
    }
    lines.push(line);
  }
  return lines.length ? lines : [""];
}

function pathCommandsToOperators(commands: PathCommand[]): PDFOperator[] {
  const ops: PDFOperator[] = [];
  for (const cmd of commands) {
    const a = cmd.args || [];
    switch (cmd.command) {
      case "moveTo":
        if (a.length >= 2) ops.push(moveTo(a[0]!, a[1]!));
        break;
      case "lineTo":
        if (a.length >= 2) ops.push(lineTo(a[0]!, a[1]!));
        break;
      case "quadraticCurveTo":
        // fontkit: (cpx, cpy, x, y)
        if (a.length >= 4) ops.push(appendQuadraticCurve(a[0]!, a[1]!, a[2]!, a[3]!));
        break;
      case "bezierCurveTo":
        // fontkit: (cp1x, cp1y, cp2x, cp2y, x, y)
        if (a.length >= 6) ops.push(appendBezierCurve(a[0]!, a[1]!, a[2]!, a[3]!, a[4]!, a[5]!));
        break;
      case "closePath":
        ops.push(closePath());
        break;
      default:
        break;
    }
  }
  return ops;
}

function drawShapedRun(page: PDFPage, face: FontFace, text: string, opts: { x: number; y: number; size: number; color: RGB }): number {
  if (!text) return opts.x;
  const run = layoutRun(face, text);
  const glyphScale = opts.size / (face.upem || 1000);
  let x = opts.x;
  let y = opts.y;
  const glyphs = run.glyphs || [];
  const positions = run.positions || [];

  for (let i = 0; i < glyphs.length; i++) {
    const g = glyphs[i];
    const pos = positions[i] || { xAdvance: 0, yAdvance: 0, xOffset: 0, yOffset: 0 };
    const gx = x + (pos.xOffset || 0) * glyphScale;
    const gy = y + (pos.yOffset || 0) * glyphScale;
    try {
      const cmds = g?.path?.commands;
      if (cmds && cmds.length > 0) {
        const pathOps = pathCommandsToOperators(cmds);
        if (pathOps.length > 0) {
          page.pushOperators(
            pushGraphicsState(),
            pdfTranslate(gx, gy),
            scale(glyphScale, glyphScale),
            setFillingRgbColor(opts.color.red, opts.color.green, opts.color.blue),
            ...pathOps,
            fill(),
            popGraphicsState(),
          );
        }
      } else if (g?.path && typeof g.path.toSVG === "function") {
        const svg = g.path.toSVG();
        if (svg && svg.trim()) {
          // Fallback for unexpected path objects: drawSvgPath flips Y for SVG coords.
          page.drawSvgPath(svg, { x: gx, y: gy, scale: glyphScale, color: opts.color, borderWidth: 0 });
        }
      }
    } catch {
      // skip glyph on failure
    }
    x += (pos.xAdvance || 0) * glyphScale;
    y += (pos.yAdvance || 0) * glyphScale;
  }
  return x;
}

function drawTextSafe(
  page: PDFPage,
  text: string,
  opts: { x: number; y: number; size: number; font: FontFace; color: RGB; fallbackFont?: FontFace },
) {
  const primary = opts.font;
  const fallback = opts.fallbackFont ?? opts.font;
  const normalized = sanitize(normalizePdfText(text));
  if (!normalized) return;

  let x = opts.x;
  let run = "";
  let runFace: FontFace | null = null;

  const flush = () => {
    if (!run || !runFace) return;
    x = drawShapedRun(page, runFace, run, { x, y: opts.y, size: opts.size, color: opts.color });
    run = "";
    runFace = null;
  };

  for (const ch of normalized) {
    const face = preferFallbackChar(ch) ? fallback : primary;
    if (!runFace || face === runFace) {
      run += ch;
      runFace = face;
    } else {
      flush();
      run = ch;
      runFace = face;
    }
  }
  flush();
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

function drawChart(cursor: Cursor, fonts: Fonts, chart: ReportChart, pdf: PDFDocument, locale: Locale, disclaimer: string) {
  const items = chart.items.filter((i) => Number.isFinite(i.value) && i.value > 0);
  if (items.length === 0) return;
  const total = items.reduce((s, i) => s + i.value, 0);
  if (total <= 0) return;
  const maxValue = Math.max(...items.map((i) => i.value), 1);

  const rowH = 26;
  const headerH = 18;
  const needed = headerH + 10 + items.length * rowH + 18;
  ensureSpace(cursor, Math.max(90, Math.min(needed, 320)), pdf, fonts, locale, disclaimer);

  cursor.page.drawRectangle({ x: MARGIN, y: cursor.y - headerH, width: CONTENT_W, height: headerH, color: EMERALD_700 });
  drawTextSafe(cursor.page, chart.title, {
    x: MARGIN + 8,
    y: cursor.y - 13,
    size: 9.5,
    font: fonts.bold,
    fallbackFont: fonts.fallbackBold,
    color: WHITE,
  });
  cursor.y -= headerH + 8;

  const fmtVal = (n: number) => {
    // Use ASCII-formatted numbers for clarity, then our renderer normalizes digits.
    try {
      return new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(n);
    } catch {
      return String(n);
    }
  };

  const labelColW = Math.min(170, CONTENT_W * 0.36);
  const valueColW = 95;
  const barX = MARGIN + labelColW + 6;
  const barMaxW = Math.max(60, CONTENT_W - labelColW - valueColW - 14);
  const barH = 10;

  for (let i = 0; i < items.length; i += 1) {
    const item = items[i]!;
    const color = CHART_COLORS[i % CHART_COLORS.length]!;
    const pct = (item.value / total) * 100;
    const barW = Math.max(2, (item.value / maxValue) * barMaxW);

    if (cursor.y - rowH < MARGIN + 34) {
      drawFooter(cursor.page, fonts, locale, cursor.pages.length, 0, disclaimer);
      const p = pdf.addPage([PAGE_W, PAGE_H]);
      cursor.pages.push(p);
      cursor.page = p;
      cursor.y = PAGE_H - MARGIN;
      cursor.page.drawRectangle({ x: MARGIN, y: cursor.y - headerH, width: CONTENT_W, height: headerH, color: EMERALD_700 });
      drawTextSafe(cursor.page, chart.title, {
        x: MARGIN + 8,
        y: cursor.y - 13,
        size: 9.5,
        font: fonts.bold,
        fallbackFont: fonts.fallbackBold,
        color: WHITE,
      });
      cursor.y -= headerH + 8;
    }

    const rowTop = cursor.y;
    const labelLines = wrapText(item.label, fonts.regular, 8, labelColW - 10, fonts.fallbackRegular).slice(0, 2);
    drawTextSafe(cursor.page, labelLines[0] ?? item.label, {
      x: MARGIN + 4,
      y: rowTop - 10,
      size: 8,
      font: fonts.regular,
      fallbackFont: fonts.fallbackRegular,
      color: SLATE_700,
    });
    if (labelLines[1]) {
      drawTextSafe(cursor.page, labelLines[1], {
        x: MARGIN + 4,
        y: rowTop - 20,
        size: 7.2,
        font: fonts.regular,
        fallbackFont: fonts.fallbackRegular,
        color: SLATE_500,
      });
    }

    const barY = rowTop - 12;
    cursor.page.drawRectangle({ x: barX, y: barY, width: barMaxW, height: barH, color: rgb(0.93, 0.95, 0.94), borderColor: BORDER, borderWidth: 0.3 });
    cursor.page.drawRectangle({ x: barX, y: barY, width: barW, height: barH, color, borderColor: color, borderWidth: 0.2 });

    const valueText = `${fmtVal(item.value)} ${chart.currency}`;
    const pctText = `${pct.toFixed(1)}%`;
    drawTextSafe(cursor.page, valueText, { x: barX + barMaxW + 6, y: rowTop - 10, size: 7.8, font: fonts.bold, fallbackFont: fonts.fallbackBold, color: SLATE_900 });
    drawTextSafe(cursor.page, pctText, { x: barX + barMaxW + 6, y: rowTop - 20, size: 7.2, font: fonts.regular, fallbackFont: fonts.fallbackRegular, color: SLATE_500 });

    cursor.y -= rowH;
    cursor.page.drawLine({ start: { x: MARGIN, y: cursor.y + 2 }, end: { x: MARGIN + CONTENT_W, y: cursor.y + 2 }, thickness: 0.3, color: BORDER });
  }

  cursor.y -= 8;
}

function drawSection(cursor: Cursor, fonts: Fonts, section: ReportSection, pdf: PDFDocument, locale: Locale, disclaimer: string) {
  ensureSpace(cursor, 24, pdf, fonts, locale, disclaimer);
  cursor.page.drawRectangle({ x: MARGIN, y: cursor.y - 18, width: CONTENT_W, height: 18, color: EMERALD_700 });
  drawTextSafe(cursor.page, section.heading, { x: MARGIN + 8, y: cursor.y - 13, size: 9.5, font: fonts.bold, fallbackFont: fonts.fallbackBold, color: WHITE });
  cursor.y -= 26;

  if (section.rows && section.rows.length > 0) {
    for (let i = 0; i < section.rows.length; i += 1) {
      const row = section.rows[i]!;
      const valueLines = wrapText(row.value, fonts.regular, 8.5, CONTENT_W * 0.52 - 12, fonts.fallbackRegular);
      const h = Math.max(15, valueLines.length * 11 + 4);
      ensureSpace(cursor, h + 2, pdf, fonts, locale, disclaimer);
      if (i % 2 === 0) {
        cursor.page.drawRectangle({ x: MARGIN, y: cursor.y - h + 3, width: CONTENT_W, height: h, color: rgb(0.97, 0.985, 0.975) });
      }
      cursor.page.drawLine({ start: { x: MARGIN, y: cursor.y - h + 3 }, end: { x: MARGIN + CONTENT_W, y: cursor.y - h + 3 }, thickness: 0.3, color: BORDER });
      drawTextSafe(cursor.page, row.label, { x: MARGIN + 8, y: cursor.y - 9, size: 8.5, font: fonts.bold, fallbackFont: fonts.fallbackBold, color: SLATE_700 });
      let vy = cursor.y - 9;
      for (const vl of valueLines) {
        drawTextSafe(cursor.page, vl, { x: MARGIN + CONTENT_W * 0.45, y: vy, size: 8.5, font: fonts.regular, fallbackFont: fonts.fallbackRegular, color: SLATE_900 });
        vy -= 11;
      }
      cursor.y -= h;
    }
    cursor.y -= 6;
  }

  if (section.paragraphs && section.paragraphs.length > 0) {
    for (const para of section.paragraphs) {
      const lines = wrapText(para, fonts.regular, 9, CONTENT_W - 16, fonts.fallbackRegular);
      for (const line of lines) {
        ensureSpace(cursor, 12, pdf, fonts, locale, disclaimer);
        drawTextSafe(cursor.page, line, { x: MARGIN + 8, y: cursor.y, size: 9, font: fonts.regular, fallbackFont: fonts.fallbackRegular, color: SLATE_700 });
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
  drawTextSafe(cursor.page, t("report.section.explanation"), { x: MARGIN + 8, y: cursor.y - 13, size: 9.5, font: fonts.bold, fallbackFont: fonts.fallbackBold, color: WHITE });
  cursor.y -= 28;

  for (const step of steps) {
    const head = `${t("report.step")} ${step.step}: ${step.title}`;
    const headLines = wrapText(head, fonts.bold, 9, CONTENT_W - 20, fonts.fallbackBold);
    const rows: Array<[string, string]> = [
      [t("report.calculation"), step.calculation],
      [t("report.result"), step.result],
      [t("report.principle"), step.principle],
      [t("report.reason"), step.reason],
    ];

    let est = headLines.length * 12 + 10;
    for (const [, v] of rows) est += wrapText(v || "-", fonts.regular, 8.5, CONTENT_W - 115, fonts.fallbackRegular).length * 11 + 4;
    ensureSpace(cursor, Math.min(est + 12, 170), pdf, fonts, locale, disclaimer);

    const cardTop = cursor.y;
    let innerY = cursor.y - 8;
    for (const hl of headLines) {
      ensureSpace(cursor, 14, pdf, fonts, locale, disclaimer);
      drawTextSafe(cursor.page, hl, { x: MARGIN + 10, y: innerY, size: 9, font: fonts.bold, fallbackFont: fonts.fallbackBold, color: EMERALD_900 });
      innerY -= 12;
    }
    innerY -= 2;
    for (const [label, value] of rows) {
      const vLines = wrapText(value || "-", fonts.regular, 8.5, CONTENT_W - 115, fonts.fallbackRegular);
      for (let vi = 0; vi < vLines.length; vi += 1) {
        if (innerY < MARGIN + 32) {
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
          drawTextSafe(cursor.page, `${label}:`, { x: MARGIN + 10, y: innerY, size: 8.5, font: fonts.bold, fallbackFont: fonts.fallbackBold, color: SLATE_700 });
        }
        drawTextSafe(cursor.page, vLines[vi]!, { x: MARGIN + 98, y: innerY, size: 8.5, font: fonts.regular, fallbackFont: fonts.fallbackRegular, color: SLATE_900 });
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
  const discLines = wrapText(disclaimer, fonts.regular, 6.5, CONTENT_W - 90, fonts.fallbackRegular).slice(0, 2);
  page.drawLine({ start: { x: MARGIN, y: MARGIN + 12 }, end: { x: MARGIN + CONTENT_W, y: MARGIN + 12 }, thickness: 0.4, color: BORDER });
  const fy = MARGIN - 2;
  for (let i = 0; i < discLines.length; i += 1) {
    drawTextSafe(page, discLines[i]!, {
      x: MARGIN,
      y: fy + (discLines.length - 1 - i) * 8,
      size: 6.5,
      font: fonts.regular,
      fallbackFont: fonts.fallbackRegular,
      color: SLATE_500,
    });
  }
  if (total > 0) {
    const label = `${translate(locale, "report.page")} ${pageNum}/${total}`;
    const w = textWidth(label, fonts.regular, 7, fonts.fallbackRegular);
    drawTextSafe(page, label, { x: MARGIN + CONTENT_W - w, y: MARGIN + 14, size: 7, font: fonts.regular, fallbackFont: fonts.fallbackRegular, color: SLATE_500 });
  }
}

export async function buildPdfReport(data: ReportData): Promise<Uint8Array> {
  const locale = data.locale ?? "en";
  const pdf = await PDFDocument.create();
  try {
    pdf.registerFontkit(fontkit);
  } catch {
    // may already be registered
  }
  const fonts = await loadFonts(locale);
  const t = (key: string, vars?: Record<string, string | number>) => translate(locale, key, vars);

  const first = pdf.addPage([PAGE_W, PAGE_H]);
  const cursor: Cursor = { page: first, y: PAGE_H - MARGIN, pages: [first] };

  const headerH = 72;
  ensureSpace(cursor, headerH + 8, pdf, fonts, locale, data.disclaimer);
  cursor.page.drawRectangle({ x: MARGIN, y: cursor.y - headerH, width: CONTENT_W, height: headerH, color: EMERALD_900 });
  drawTextSafe(cursor.page, "Mīzān", { x: MARGIN + 16, y: cursor.y - 22, size: 16, font: fonts.bold, fallbackFont: fonts.fallbackBold, color: WHITE });
  const titleLines = wrapText(data.title, fonts.bold, 13, CONTENT_W - 32, fonts.fallbackBold);
  let ty = cursor.y - 40;
  for (const line of titleLines.slice(0, 2)) {
    drawTextSafe(cursor.page, line, { x: MARGIN + 16, y: ty, size: 13, font: fonts.bold, fallbackFont: fonts.fallbackBold, color: WHITE });
    ty -= 15;
  }
  if (data.subtitle) {
    const subLines = wrapText(data.subtitle, fonts.regular, 8.5, CONTENT_W - 32, fonts.fallbackRegular);
    drawTextSafe(cursor.page, subLines[0] ?? data.subtitle, {
      x: MARGIN + 16,
      y: ty + 2,
      size: 8.5,
      font: fonts.regular,
      fallbackFont: fonts.fallbackRegular,
      color: rgb(0.82, 0.98, 0.898),
    });
  }
  cursor.y -= headerH + 14;

  const gen = `${t("report.generatedOn")}: ${formatDateTime(new Date(), locale)}`;
  drawTextSafe(cursor.page, gen, { x: MARGIN, y: cursor.y, size: 8, font: fonts.regular, fallbackFont: fonts.fallbackRegular, color: SLATE_500 });
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
      drawTextSafe(cursor.page, row.label, { x: MARGIN + 10, y: my, size: 8.5, font: fonts.bold, fallbackFont: fonts.fallbackBold, color: SLATE_700 });
      const valLines = wrapText(row.value, fonts.regular, 8.5, CONTENT_W - labelW - 24, fonts.fallbackRegular);
      drawTextSafe(cursor.page, valLines[0] ?? "", { x: MARGIN + 10 + labelW, y: my, size: 8.5, font: fonts.regular, fallbackFont: fonts.fallbackRegular, color: SLATE_900 });
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
