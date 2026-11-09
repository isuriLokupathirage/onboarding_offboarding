/**
 * A small PDF writer for report exports: landscape A4 pages with text, rules, shaded table headers
 * and page numbers, in the built-in Helvetica fonts. No PDF library needed.
 */

const PAGE_WIDTH = 842;
const PAGE_HEIGHT = 595;
const MARGIN = 40;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

// Helvetica glyph widths (per 1000 units) for characters 32–126.
const HELVETICA_WIDTHS = [
278, 278, 355, 556, 556, 889, 667, 191, 333, 333, 389, 584, 278, 333, 278, 278, 556, 556, 556, 556, 556, 556, 556,
556, 556, 556, 278, 278, 584, 584, 584, 556, 1015, 667, 667, 722, 722, 667, 611, 778, 722, 278, 500, 667, 556, 833,
722, 778, 667, 778, 722, 667, 611, 722, 667, 944, 667, 667, 611, 278, 278, 278, 469, 556, 333, 556, 556, 500, 556,
556, 278, 556, 556, 222, 222, 500, 222, 833, 556, 556, 556, 556, 333, 500, 278, 556, 500, 722, 500, 500, 500, 334,
260, 334, 584];


/** Characters outside WinAnsi are swapped for the nearest plain one. */
const WIN_ANSI: Record<string, number> = { '–': 0x96, '—': 0x97, '‘': 0x91, '’': 0x92, '“': 0x93, '”': 0x94, '•': 0x95 };
const SUBSTITUTES: Record<string, string> = { '−': '-', '…': '...' };

function toWinAnsi(text: string): string {
  let output = '';
  for (const char of text) {
    const swapped = SUBSTITUTES[char] ?? char;
    for (const part of swapped) {
      const code = WIN_ANSI[part] ?? part.charCodeAt(0);
      output += String.fromCharCode(code < 256 ? code : 63);
    }
  }
  return output;
}

export function textWidth(text: string, size: number, bold = false): number {
  let units = 0;
  for (const char of text) {
    const code = char.charCodeAt(0);
    units += code >= 32 && code <= 126 ? HELVETICA_WIDTHS[code - 32] : 556;
  }
  return units / 1000 * size * (bold ? 1.06 : 1);
}

/** Shortens text with "..." so it fits the width. */
function fit(text: string, width: number, size: number, bold = false): string {
  if (textWidth(text, size, bold) <= width) return text;
  let shortened = text;
  while (shortened.length > 1 && textWidth(`${shortened}...`, size, bold) > width) shortened = shortened.slice(0, -1);
  return `${shortened.trimEnd()}...`;
}

/** Splits text into lines that fit the width. */
function wrap(text: string, width: number, size: number, bold = false): string[] {
  const lines: string[] = [];
  let line = '';
  text.split(' ').forEach((word) => {
    const next = line ? `${line} ${word}` : word;
    if (textWidth(next, size, bold) <= width || !line) line = next;else
    {
      lines.push(line);
      line = word;
    }
  });
  if (line) lines.push(line);
  return lines;
}

const escapePdf = (text: string) => toWinAnsi(text).replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');

export interface PdfTable {
  title: string;
  columns: string[];
  rows: (string | number)[][];
  /** Narrower tables, such as chart totals, use part of the page width. */
  width?: number;
}

export class PdfDocument {
  private pages: string[][] = [];
  private y = 0;
  /** Repeated at the top of every page after the first, such as the report name and period. */
  private runningHeader = '';

  constructor(private footer: string) {
    this.newPage();
  }

  private get ops(): string[] {
    return this.pages[this.pages.length - 1];
  }

  private newPage() {
    this.pages.push([]);
    this.y = PAGE_HEIGHT - MARGIN;
    if (this.pages.length > 1 && this.runningHeader) {
      this.text(this.runningHeader, MARGIN, this.y - 8, 8, false, 0.45);
      this.y -= 22;
    }
  }

  private ensure(height: number) {
    if (this.y - height < MARGIN + 20) this.newPage();
  }

  private text(content: string, x: number, y: number, size: number, bold = false, gray = 0.1) {
    this.ops.push(`${gray} g BT /${bold ? 'F2' : 'F1'} ${size} Tf ${x.toFixed(2)} ${y.toFixed(2)} Td (${escapePdf(content)}) Tj ET`);
  }

  private rule(x1: number, y: number, x2: number, gray = 0.85) {
    this.ops.push(`${gray} G 0.6 w ${x1.toFixed(2)} ${y.toFixed(2)} m ${x2.toFixed(2)} ${y.toFixed(2)} l S`);
  }

  private shade(x: number, y: number, width: number, height: number, gray = 0.95) {
    this.ops.push(`${gray} g ${x.toFixed(2)} ${y.toFixed(2)} ${width.toFixed(2)} ${height.toFixed(2)} re f`);
  }

  setRunningHeader(text: string) {
    this.runningHeader = text;
  }

  title(text: string) {
    this.ensure(30);
    this.text(text, MARGIN, this.y - 18, 18, true);
    this.y -= 30;
  }

  heading(text: string) {
    this.ensure(28);
    this.y -= 8;
    this.text(text, MARGIN, this.y - 11, 11, true);
    this.y -= 18;
  }

  /** A "Label: value" line, wrapped to the page width. */
  field(label: string, value: string) {
    const labelText = `${label}: `;
    const labelWidth = textWidth(labelText, 9, true);
    const lines = wrap(value, CONTENT_WIDTH - labelWidth, 9);
    lines.forEach((line, index) => {
      this.ensure(13);
      if (index === 0) this.text(labelText, MARGIN, this.y - 9, 9, true, 0.35);
      this.text(line, MARGIN + labelWidth, this.y - 9, 9);
      this.y -= 13;
    });
  }

  gap(height: number) {
    this.y -= height;
  }

  table(table: PdfTable) {
    const size = 8;
    const width = table.width ?? CONTENT_WIDTH;
    const rowHeight = 15;
    // Columns share the width in proportion to their longest value, within limits.
    const natural = table.columns.map((column, index) =>
    Math.min(
      180,
      Math.max(
        textWidth(column, size, true),
        ...table.rows.map((row) => textWidth(String(row[index] ?? ''), size))
      ) + 10
    )
    );
    const total = natural.reduce((sum, value) => sum + value, 0);
    const widths = natural.map((value) => value / total * width);

    const headerRow = () => {
      this.shade(MARGIN, this.y - rowHeight, width, rowHeight);
      let x = MARGIN;
      table.columns.forEach((column, index) => {
        this.text(fit(column, widths[index] - 6, size, true), x + 4, this.y - 10.5, size, true, 0.3);
        x += widths[index];
      });
      this.y -= rowHeight;
    };

    this.heading(table.title);
    this.ensure(rowHeight * 2);
    headerRow();
    if (table.rows.length === 0) {
      this.text('No rows', MARGIN + 4, this.y - 10.5, size, false, 0.5);
      this.y -= rowHeight;
    }
    table.rows.forEach((row) => {
      if (this.y - rowHeight < MARGIN + 20) {
        this.newPage();
        headerRow();
      }
      let x = MARGIN;
      row.forEach((cell, index) => {
        this.text(fit(String(cell ?? ''), widths[index] - 6, size), x + 4, this.y - 10.5, size);
        x += widths[index];
      });
      this.y -= rowHeight;
      this.rule(MARGIN, this.y, MARGIN + width);
    });
    this.y -= 6;
  }

  /** The finished file. Every page carries the footer and "Page n of N". */
  toBlob(): Blob {
    const pageCount = this.pages.length;
    const streams = this.pages.map((ops, index) => {
      const footerY = MARGIN - 18;
      const pageLabel = `Page ${index + 1} of ${pageCount}`;
      return [
      ...ops,
      `0.45 g BT /F1 8 Tf ${MARGIN} ${footerY} Td (${escapePdf(this.footer)}) Tj ET`,
      `0.45 g BT /F1 8 Tf ${(PAGE_WIDTH - MARGIN - textWidth(pageLabel, 8)).toFixed(2)} ${footerY} Td (${escapePdf(
        pageLabel
      )}) Tj ET`].
      join('\n');
    });

    // Objects: 1 catalog, 2 pages, 3–4 fonts, then a page and a content stream per page.
    const objects: string[] = [];
    const pageIds = streams.map((_, index) => 5 + index * 2);
    objects[1] = '<< /Type /Catalog /Pages 2 0 R >>';
    objects[2] = `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(' ')}] /Count ${pageCount} >>`;
    objects[3] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>';
    objects[4] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>';
    streams.forEach((stream, index) => {
      const pageId = pageIds[index];
      objects[pageId] =
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] ` +
      `/Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${pageId + 1} 0 R >>`;
      objects[pageId + 1] = `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`;
    });

    let body = '%PDF-1.4\n%âãÏÓ\n';
    const offsets: number[] = [];
    for (let id = 1; id < objects.length; id += 1) {
      offsets[id] = body.length;
      body += `${id} 0 obj\n${objects[id]}\nendobj\n`;
    }
    const xref = body.length;
    body += `xref\n0 ${objects.length}\n0000000000 65535 f \n`;
    for (let id = 1; id < objects.length; id += 1) body += `${String(offsets[id]).padStart(10, '0')} 00000 n \n`;
    body += `trailer\n<< /Size ${objects.length} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;

    // Every character is one byte (WinAnsi), so offsets above are byte offsets.
    const bytes = new Uint8Array(body.length);
    for (let index = 0; index < body.length; index += 1) bytes[index] = body.charCodeAt(index) & 0xff;
    return new Blob([bytes], { type: 'application/pdf' });
  }
}
