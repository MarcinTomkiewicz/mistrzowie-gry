import { type PDFFont, type PDFPage, rgb } from "npm:pdf-lib@1.17.1";

import type { QuestionnairePdfHeading } from "./questionnaire-pdf-content-model.ts";
import {
  QUESTIONNAIRE_PDF_LAYOUT as LAYOUT,
  type QuestionnairePdfFieldRowLayout,
  type QuestionnairePdfFormRowLayout,
  wrapQuestionnairePdfText,
} from "./questionnaire-pdf-layout.ts";

const INK = rgb(0.08, 0.08, 0.08);
const MUTED_INK = rgb(0.32, 0.32, 0.32);
const BORDER = rgb(0.58, 0.58, 0.58);
const SECTION_FILL = rgb(0.92, 0.92, 0.92);
const ANSWER_FILL = rgb(0.96, 0.96, 0.96);
const TITLE_SIZE = 15;
const TITLE_LINE_HEIGHT = 19;
const TITLE_BOTTOM_GAP = 22;

const HEADING = {
  section: {
    size: 10.5,
    lineHeight: 12,
    paddingX: 7,
    paddingY: 4,
    topGap: 8,
    bottomGap: 6,
    minimumHeight: 22,
  },
  subsection: {
    size: 9.5,
    lineHeight: 11,
    paddingX: 0,
    paddingY: 2,
    topGap: 6,
    bottomGap: 4,
    minimumHeight: 17,
  },
} as const;

export class QuestionnairePdfPageRenderer {
  constructor(
    readonly page: PDFPage,
    private readonly regularFont: PDFFont,
    private readonly boldFont: PDFFont,
  ) {}

  drawTitle(top: number, title: string): number {
    const lines = wrapQuestionnairePdfText(
      title,
      this.boldFont,
      TITLE_SIZE,
      this.contentWidth,
    );
    for (const [index, line] of lines.entries()) {
      const width = this.boldFont.widthOfTextAtSize(line, TITLE_SIZE);
      this.page.drawText(line, {
        x: LAYOUT.pageMargin + ((this.contentWidth - width) / 2),
        y: top - TITLE_SIZE - (index * TITLE_LINE_HEIGHT),
        size: TITLE_SIZE,
        font: this.boldFont,
        color: INK,
      });
    }
    return top - (lines.length * TITLE_LINE_HEIGHT) - TITLE_BOTTOM_GAP;
  }

  drawHeading(top: number, heading: QuestionnairePdfHeading): number {
    const style = HEADING[heading.level];
    const lines = this.headingLines(heading);
    const boxHeight = Math.max(
      style.minimumHeight,
      (2 * style.paddingY) + (lines.length * style.lineHeight),
    );
    const boxTop = top - style.topGap;
    const bottom = boxTop - boxHeight;

    if (heading.level === "section") {
      this.page.drawRectangle({
        x: LAYOUT.pageMargin,
        y: bottom,
        width: this.contentWidth,
        height: boxHeight,
        color: SECTION_FILL,
        borderColor: BORDER,
        borderWidth: 0.6,
      });
    } else {
      this.page.drawLine({
        start: { x: LAYOUT.pageMargin, y: bottom },
        end: { x: LAYOUT.pageMargin + this.contentWidth, y: bottom },
        thickness: 0.6,
        color: BORDER,
      });
    }
    this.drawLines(
      lines,
      LAYOUT.pageMargin + style.paddingX,
      boxTop - style.paddingY,
      this.boldFont,
      style.size,
      style.lineHeight,
      INK,
    );

    return bottom - style.bottomGap;
  }

  headingHeight(heading: QuestionnairePdfHeading): number {
    const style = HEADING[heading.level];
    return style.topGap + style.bottomGap + Math.max(
      style.minimumHeight,
      (2 * style.paddingY) +
        (this.headingLines(heading).length * style.lineHeight),
    );
  }

  drawFieldRow(
    top: number,
    row: QuestionnairePdfFieldRowLayout,
  ): number {
    let x = LAYOUT.pageMargin;
    for (const cell of row.cells) {
      this.page.drawRectangle({
        x,
        y: top - row.height,
        width: cell.width,
        height: row.height,
        borderColor: BORDER,
        borderWidth: 0.6,
      });
      const textX = x + LAYOUT.field.paddingX;
      const labelTop = top - LAYOUT.field.paddingY;
      this.drawLines(
        cell.labelLines,
        textX,
        labelTop,
        this.boldFont,
        LAYOUT.field.labelSize,
        LAYOUT.field.labelLineHeight,
        MUTED_INK,
      );
      const valueTop = labelTop -
        (cell.labelLines.length * LAYOUT.field.labelLineHeight) -
        LAYOUT.field.labelValueGap;
      this.drawLines(
        cell.valueLines,
        textX,
        valueTop,
        this.regularFont,
        LAYOUT.field.valueSize,
        LAYOUT.field.valueLineHeight,
        INK,
      );
      x += cell.width + LAYOUT.field.columnGap;
    }

    return top - row.height;
  }

  drawFormRow(
    top: number,
    layout: QuestionnairePdfFormRowLayout,
  ): number {
    const bottom = top - layout.height;
    if (layout.row.layout === "answer") {
      this.page.drawRectangle({
        x: LAYOUT.pageMargin + layout.labelWidth,
        y: bottom,
        width: this.contentWidth - layout.labelWidth,
        height: layout.height,
        color: ANSWER_FILL,
      });
    }
    this.page.drawRectangle({
      x: LAYOUT.pageMargin,
      y: bottom,
      width: this.contentWidth,
      height: layout.height,
      borderColor: BORDER,
      borderWidth: 0.6,
    });
    if (layout.labelWidth > 0) {
      this.page.drawLine({
        start: { x: LAYOUT.pageMargin + layout.labelWidth, y: bottom },
        end: { x: LAYOUT.pageMargin + layout.labelWidth, y: top },
        thickness: 0.6,
        color: BORDER,
      });
      this.drawLines(
        layout.labelLines,
        LAYOUT.pageMargin + LAYOUT.form.paddingX,
        top - LAYOUT.form.paddingY,
        this.regularFont,
        LAYOUT.form.fontSize,
        LAYOUT.form.lineHeight,
        INK,
      );
    }
    const valueX = LAYOUT.pageMargin + layout.labelWidth +
      LAYOUT.form.paddingX;
    const valueWidth = this.contentWidth - layout.labelWidth -
      (2 * LAYOUT.form.paddingX);
    this.drawLines(
      layout.valueLines,
      valueX,
      top - LAYOUT.form.paddingY,
      layout.row.layout === "answer" ? this.boldFont : this.regularFont,
      LAYOUT.form.fontSize,
      LAYOUT.form.lineHeight,
      INK,
      layout.row.layout === "answer" ? valueWidth : undefined,
    );

    return bottom;
  }

  drawTextLines(top: number, lines: readonly string[]): number {
    this.drawLines(
      lines,
      LAYOUT.pageMargin,
      top,
      this.regularFont,
      LAYOUT.text.fontSize,
      LAYOUT.text.lineHeight,
      INK,
    );
    return top - (lines.length * LAYOUT.text.lineHeight);
  }

  get contentWidth(): number {
    return this.page.getWidth() - (2 * LAYOUT.pageMargin);
  }

  get pageTop(): number {
    return this.page.getHeight() - LAYOUT.pageMargin;
  }

  get pageCapacity(): number {
    return this.page.getHeight() - (2 * LAYOUT.pageMargin);
  }

  private headingLines(heading: QuestionnairePdfHeading): string[] {
    const style = HEADING[heading.level];
    return wrapQuestionnairePdfText(
      heading.text,
      this.boldFont,
      style.size,
      this.contentWidth - (2 * style.paddingX),
    );
  }

  private drawLines(
    lines: readonly string[],
    x: number,
    top: number,
    font: PDFFont,
    size: number,
    lineHeight: number,
    color: ReturnType<typeof rgb>,
    centerWithin?: number,
  ): void {
    for (const [index, line] of lines.entries()) {
      if (line === "") continue;
      const lineX = centerWithin === undefined
        ? x
        : x + ((centerWithin - font.widthOfTextAtSize(line, size)) / 2);
      this.page.drawText(line, {
        x: lineX,
        y: top - size - (index * lineHeight),
        size,
        font,
        color,
      });
    }
  }
}
