import "server-only";
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";

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

export interface ReportData {
  title: string;
  subtitle?: string;
  meta: ReportRow[];
  sections: ReportSection[];
  steps: ReportStep[];
  disclaimer: string;
}

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const MARGIN = 48;
const EMERALD = rgb(0.02, 0.35, 0.27);
const SLATE = rgb(0.18, 0.22, 0.26);
const MUTED = rgb(0.42, 0.47, 0.5);
const RULE = rgb(0.85, 0.9, 0.88);

interface Cursor {
  page: PDFPage;
  y: number;
}

export async function buildPdfReport(data: ReportData): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const body = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

  pdf.setTitle(data.title);
  pdf.setAuthor("Mizan - Sayed Atiqur Rahman (IIUC)");
  pdf.setSubject("Academic Hanafi Zakah & Inheritance calculation report");
  pdf.setCreator("Mizan v1.0.0");

  let cursor: Cursor = { page: pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]), y: PAGE_HEIGHT - MARGIN };

  const newPage = () => {
    cursor = { page: pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]), y: PAGE_HEIGHT - MARGIN };
  };

  const ensure = (needed: number) => {
    if (cursor.y - needed < MARGIN + 20) newPage();
  };

  const write = (
    text: string,
    options: { font?: PDFFont; size?: number; color?: ReturnType<typeof rgb>; indent?: number; gap?: number } = {},
  ) => {
    const font = options.font ?? body;
    const size = options.size ?? 10;
    const color = options.color ?? SLATE;
    const indent = options.indent ?? 0;
    const maxWidth = PAGE_WIDTH - MARGIN * 2 - indent;
    const lines = wrapText(sanitizeForPdf(text), font, size, maxWidth);
    for (const line of lines) {
      ensure(size + 4);
      cursor.page.drawText(line, { x: MARGIN + indent, y: cursor.y, size, font, color });
      cursor.y -= size + 3;
    }
    cursor.y -= options.gap ?? 2;
  };

  const divider = () => {
    ensure(10);
    cursor.page.drawLine({
      start: { x: MARGIN, y: cursor.y },
      end: { x: PAGE_WIDTH - MARGIN, y: cursor.y },
      thickness: 0.7,
      color: RULE,
    });
    cursor.y -= 12;
  };

  // Header band
  cursor.page.drawRectangle({
    x: 0,
    y: PAGE_HEIGHT - 96,
    width: PAGE_WIDTH,
    height: 96,
    color: rgb(0.94, 0.98, 0.96),
  });
  cursor.page.drawText("MIZAN", {
    x: MARGIN,
    y: PAGE_HEIGHT - 46,
    size: 18,
    font: bold,
    color: EMERALD,
  });
  cursor.page.drawText("Islamic Zakah & Inheritance Calculation System", {
    x: MARGIN,
    y: PAGE_HEIGHT - 64,
    size: 9,
    font: body,
    color: MUTED,
  });
  cursor.page.drawText("Academic thesis project — not a fatwa", {
    x: MARGIN,
    y: PAGE_HEIGHT - 78,
    size: 8,
    font: body,
    color: MUTED,
  });
  cursor.y = PAGE_HEIGHT - 120;

  write(data.title, { font: bold, size: 16, color: EMERALD, gap: 2 });
  if (data.subtitle) write(data.subtitle, { size: 10, color: MUTED, gap: 4 });

  divider();

  // Metadata
  for (const row of data.meta) {
    write(`${row.label}: ${row.value}`, { size: 9 });
  }

  for (const section of data.sections) {
    ensure(40);
    cursor.y -= 6;
    write(section.heading, { font: bold, size: 12, color: EMERALD, gap: 3 });
    divider();
    if (section.rows) {
      for (const row of section.rows) {
        write(`${row.label}: ${row.value}`, { size: 9.5, indent: 6 });
      }
    }
    if (section.paragraphs) {
      for (const paragraph of section.paragraphs) {
        write(paragraph, { size: 9.5, indent: 6, gap: 4 });
      }
    }
  }

  if (data.steps.length > 0) {
    ensure(40);
    cursor.y -= 6;
    write("Step-by-step jurisprudential explanation", { font: bold, size: 12, color: EMERALD, gap: 3 });
    divider();
    for (const step of data.steps) {
      ensure(60);
      write(`Step ${step.step}: ${step.title}`, { font: bold, size: 10, color: SLATE, indent: 4 });
      write(`Calculation: ${step.calculation}`, { size: 9, indent: 10 });
      write(`Result: ${step.result}`, { size: 9, indent: 10 });
      write(`Fiqh principle: ${step.principle}`, { size: 9, indent: 10 });
      write(`Reason: ${step.reason}`, { size: 9, indent: 10, gap: 6 });
    }
  }

  ensure(70);
  cursor.y -= 8;
  divider();
  write("Academic disclaimer", { font: bold, size: 10, color: EMERALD });
  write(data.disclaimer, { size: 8.5, color: MUTED });

  const pages = pdf.getPages();
  pages.forEach((page, index) => {
    page.drawText(`Page ${index + 1} of ${pages.length}`, {
      x: PAGE_WIDTH - MARGIN - 60,
      y: MARGIN - 20,
      size: 8,
      font: body,
      color: MUTED,
    });
    page.drawText("mizan · hanafi-v1.0.0", {
      x: MARGIN,
      y: MARGIN - 20,
      size: 8,
      font: body,
      color: MUTED,
    });
  });

  return pdf.save();
}

/**
 * pdf-lib's standard Helvetica fonts only support WinAnsi (Latin-1) glyphs.
 * Engine explanations legitimately contain Unicode punctuation (a true minus
 * sign, arrows, comparison symbols) and Arabic terms. Map the common symbols
 * to ASCII and drop anything the standard font cannot encode, so a report is
 * never rejected because of a single glyph.
 */
const PDF_REPLACEMENTS: Record<string, string> = {
  "\u2212": "-",
  "\u2013": "-",
  "\u2014": "-",
  "\u2018": "'",
  "\u2019": "'",
  "\u201C": '"',
  "\u201D": '"',
  "\u2026": "...",
  "\u2192": "->",
  "\u2190": "<-",
  "\u2265": ">=",
  "\u2264": "<=",
  "\u2248": "~",
  "\u00A0": " ",
  "\u012A": "I",
  "\u012B": "i",
  "\u016A": "U",
  "\u016B": "u",
  "\uFDFA": "(PBUH)",
  "\uFDFC": "SAR ",
  "\u09F3": "BDT ",
  "\u20B9": "INR ",
  "\u20A8": "PKR ",
  "\u20AC": "EUR ",
};

function sanitizeForPdf(text: string): string {
  let output = "";
  for (const char of text) {
    const replacement = PDF_REPLACEMENTS[char];
    if (replacement !== undefined) {
      output += replacement;
      continue;
    }
    const codePoint = char.codePointAt(0) ?? 0;
    if (codePoint < 0x20) {
      output += " ";
    } else if (codePoint <= 0x7e) {
      output += char;
    } else if (codePoint >= 0xa0 && codePoint <= 0xff) {
      output += char;
    }
    // Any other code point is outside WinAnsi and is intentionally dropped.
  }
  return output
    .replace(/\(\s*\)/g, "")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

/** Greedy word wrap that also handles very long unbroken tokens. */
function wrapText(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (!normalized) return [""];
  const words = normalized.split(" ");
  const lines: string[] = [];
  let current = "";

  const push = () => {
    if (current) lines.push(current);
    current = "";
  };

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(candidate, size) <= maxWidth) {
      current = candidate;
      continue;
    }
    push();
    if (font.widthOfTextAtSize(word, size) <= maxWidth) {
      current = word;
      continue;
    }
    // Break a long token character by character.
    let chunk = "";
    for (const char of word) {
      if (font.widthOfTextAtSize(chunk + char, size) > maxWidth) {
        lines.push(chunk);
        chunk = char;
      } else {
        chunk += char;
      }
    }
    current = chunk;
  }
  push();
  return lines.length > 0 ? lines : [""];
}
