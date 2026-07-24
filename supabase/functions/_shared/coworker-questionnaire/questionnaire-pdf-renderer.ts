import {
  PageSizes,
  type PDFDocument,
  type PDFFont,
  type PDFPage,
  rgb,
} from "npm:pdf-lib@1.17.1";

import type { QuestionnairePdfSection } from "./questionnaire-pdf-content.ts";

const PAGE_MARGIN = 48;
const LABEL_WIDTH = 170;
const COLUMN_GAP = 16;
const FONT_SIZE = 9;
const LINE_HEIGHT = 12;
const ROW_GAP = 7;
const SECTION_GAP = 18;

export class QuestionnairePdfRenderer {
  private page: PDFPage;
  private y: number;

  constructor(
    private readonly document: PDFDocument,
    private readonly regularFont: PDFFont,
    private readonly boldFont: PDFFont,
  ) {
    this.page = this.addPage();
    this.y = this.page.getHeight() - PAGE_MARGIN;
  }

  drawTitle(title: string): void {
    this.page.drawText(title, {
      x: PAGE_MARGIN,
      y: this.y,
      size: 17,
      font: this.boldFont,
      color: rgb(0.08, 0.12, 0.18),
    });
    this.y -= 30;
  }

  drawSection(section: QuestionnairePdfSection): void {
    this.ensureSpace(28);
    this.page.drawText(section.title, {
      x: PAGE_MARGIN,
      y: this.y,
      size: 12,
      font: this.boldFont,
      color: rgb(0.1, 0.25, 0.42),
    });
    this.y -= 20;

    for (const [label, content] of section.rows) {
      this.drawRow(label, content);
    }
    this.y -= SECTION_GAP;
  }

  private drawRow(label: string, content: string): void {
    const valueWidth = this.page.getWidth() - (2 * PAGE_MARGIN) -
      LABEL_WIDTH - COLUMN_GAP;
    const labelLines = wrapText(
      label,
      this.boldFont,
      FONT_SIZE,
      LABEL_WIDTH,
    );
    const valueLines = wrapText(
      content,
      this.regularFont,
      FONT_SIZE,
      valueWidth,
    );
    const lineCount = Math.max(labelLines.length, valueLines.length);
    let lineIndex = 0;

    while (lineIndex < lineCount) {
      this.ensureSpace(LINE_HEIGHT);
      const availableLines = Math.max(
        1,
        Math.floor((this.y - PAGE_MARGIN) / LINE_HEIGHT),
      );
      const chunkSize = Math.min(lineCount - lineIndex, availableLines);

      for (let offset = 0; offset < chunkSize; offset += 1) {
        const current = lineIndex + offset;
        const baseline = this.y - (offset * LINE_HEIGHT);
        const labelLine = labelLines[current];
        const valueLine = valueLines[current];
        if (labelLine !== undefined) {
          this.page.drawText(labelLine, {
            x: PAGE_MARGIN,
            y: baseline,
            size: FONT_SIZE,
            font: this.boldFont,
          });
        }
        if (valueLine !== undefined) {
          this.page.drawText(valueLine, {
            x: PAGE_MARGIN + LABEL_WIDTH + COLUMN_GAP,
            y: baseline,
            size: FONT_SIZE,
            font: this.regularFont,
          });
        }
      }

      lineIndex += chunkSize;
      this.y -= (chunkSize * LINE_HEIGHT) + ROW_GAP;
      if (lineIndex < lineCount) {
        this.page = this.addPage();
        this.y = this.page.getHeight() - PAGE_MARGIN;
      }
    }
  }

  private ensureSpace(requiredHeight: number): void {
    if (this.y - requiredHeight >= PAGE_MARGIN) return;
    this.page = this.addPage();
    this.y = this.page.getHeight() - PAGE_MARGIN;
  }

  private addPage(): PDFPage {
    return this.document.addPage(PageSizes.A4);
  }
}

function wrapText(
  text: string,
  font: PDFFont,
  size: number,
  maxWidth: number,
): string[] {
  const lines: string[] = [];
  for (const paragraph of text.split(/\r?\n/)) {
    const words = paragraph.split(/\s+/).filter((word) => word !== "");
    if (words.length === 0) {
      lines.push("");
      continue;
    }
    let line = "";
    for (
      const word of words.flatMap((item) =>
        breakLongWord(item, font, size, maxWidth)
      )
    ) {
      const candidate = line === "" ? word : `${line} ${word}`;
      if (font.widthOfTextAtSize(candidate, size) <= maxWidth) {
        line = candidate;
      } else {
        lines.push(line);
        line = word;
      }
    }
    if (line !== "") lines.push(line);
  }
  return lines;
}

function breakLongWord(
  word: string,
  font: PDFFont,
  size: number,
  maxWidth: number,
): string[] {
  if (font.widthOfTextAtSize(word, size) <= maxWidth) return [word];
  const chunks: string[] = [];
  let chunk = "";
  for (const character of word) {
    const candidate = chunk + character;
    if (chunk !== "" && font.widthOfTextAtSize(candidate, size) > maxWidth) {
      chunks.push(chunk);
      chunk = character;
    } else {
      chunk = candidate;
    }
  }
  if (chunk !== "") chunks.push(chunk);
  return chunks;
}
