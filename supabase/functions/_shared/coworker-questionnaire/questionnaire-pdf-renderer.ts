import { PageSizes, type PDFDocument, type PDFFont } from "npm:pdf-lib@1.17.1";

import type {
  QuestionnairePdfContent,
  QuestionnairePdfFieldGrid,
  QuestionnairePdfFormRows,
  QuestionnairePdfTextBlock,
} from "./questionnaire-pdf-content-model.ts";
import {
  layoutQuestionnairePdfFieldRows,
  layoutQuestionnairePdfFormRows,
  layoutQuestionnairePdfParagraphs,
  QUESTIONNAIRE_PDF_LAYOUT as LAYOUT,
  type QuestionnairePdfFieldRowLayout,
  type QuestionnairePdfFormRowLayout,
  type QuestionnairePdfParagraphLayout,
} from "./questionnaire-pdf-layout.ts";
import {
  QuestionnairePdfPageRenderer,
} from "./questionnaire-pdf-page-renderer.ts";
import {
  drawQuestionnairePdfSignatureBlock,
  QUESTIONNAIRE_PDF_SIGNATURE_HEIGHT,
} from "./questionnaire-pdf-signature.ts";

export class QuestionnairePdfRenderer {
  private pageRenderer: QuestionnairePdfPageRenderer;
  private y: number;

  constructor(
    private readonly document: PDFDocument,
    private readonly regularFont: PDFFont,
    private readonly boldFont: PDFFont,
  ) {
    this.pageRenderer = this.createPageRenderer();
    this.y = this.pageRenderer.pageTop;
  }

  drawTitle(title: string): void {
    this.y = this.pageRenderer.drawTitle(this.y, title);
  }

  drawContent(content: readonly QuestionnairePdfContent[]): void {
    for (const [index, element] of content.entries()) {
      const keepTogether = content[index - 1]?.kind !== "heading";
      switch (element.kind) {
        case "heading":
          this.ensureSpace(this.headingChainHeight(content, index));
          this.y = this.pageRenderer.drawHeading(this.y, element);
          break;
        case "field-grid":
          this.drawFieldGrid(element, keepTogether);
          break;
        case "form-rows":
          this.drawFormRows(element, keepTogether);
          break;
        case "text":
          this.drawTextBlock(element, keepTogether, content[index + 1]);
          break;
        case "signature":
          this.drawSignatureBlock(
            element.placeAndDateLabel,
            element.signatureLabel,
          );
          break;
      }
    }
  }

  private drawSignatureBlock(
    placeAndDateLabel: string,
    signatureLabel: string,
  ): void {
    this.ensureSpace(QUESTIONNAIRE_PDF_SIGNATURE_HEIGHT);
    this.y = drawQuestionnairePdfSignatureBlock(
      this.pageRenderer.page,
      this.regularFont,
      this.y,
      this.pageRenderer.contentWidth,
      placeAndDateLabel,
      signatureLabel,
    );
  }

  private drawFieldGrid(
    grid: QuestionnairePdfFieldGrid,
    keepTogether: boolean,
  ): void {
    const rows = this.layoutFieldRows(grid);
    if (keepTogether) this.keepBlockTogether(totalFieldGridHeight(rows));

    for (const [index, row] of rows.entries()) {
      this.ensureSpace(row.height);
      this.y = this.pageRenderer.drawFieldRow(this.y, row);
      if (index < rows.length - 1) this.y -= LAYOUT.field.rowGap;
    }
    this.y -= LAYOUT.blockGap;
  }

  private drawFormRows(
    block: QuestionnairePdfFormRows,
    keepTogether: boolean,
  ): void {
    const rows = this.layoutFormRows(block);
    if (keepTogether) this.keepBlockTogether(totalFormRowsHeight(rows));

    for (const row of rows) {
      this.ensureSpace(row.height);
      this.y = this.pageRenderer.drawFormRow(this.y, row);
    }
    this.y -= LAYOUT.blockGap;
  }

  private drawTextBlock(
    block: QuestionnairePdfTextBlock,
    keepTogether: boolean,
    next: QuestionnairePdfContent | undefined,
  ): void {
    const paragraphs = this.layoutParagraphs(block);
    const height = totalTextBlockHeight(paragraphs);
    if (keepTogether) {
      this.keepBlockTogether(
        next?.kind === "signature"
          ? height + QUESTIONNAIRE_PDF_SIGNATURE_HEIGHT
          : height,
      );
    }

    for (const [index, paragraph] of paragraphs.entries()) {
      this.drawTextLinesAcrossPages(paragraph.lines);
      if (index < paragraphs.length - 1) {
        this.y -= LAYOUT.text.paragraphGap;
      }
    }
    this.y -= LAYOUT.blockGap;
  }

  private drawTextLinesAcrossPages(lines: readonly string[]): void {
    let index = 0;
    while (index < lines.length) {
      const availableLines = Math.floor(
        (this.y - LAYOUT.pageMargin) / LAYOUT.text.lineHeight,
      );
      if (availableLines < 1) {
        this.startPage();
        continue;
      }
      const chunk = lines.slice(index, index + availableLines);
      this.y = this.pageRenderer.drawTextLines(this.y, chunk);
      index += chunk.length;
      if (index < lines.length) this.startPage();
    }
  }

  private headingChainHeight(
    content: readonly QuestionnairePdfContent[],
    startIndex: number,
  ): number {
    let height = 0;
    let index = startIndex;
    while (true) {
      const element = content[index];
      if (element?.kind !== "heading") break;
      height += this.pageRenderer.headingHeight(element);
      index += 1;
    }
    const next = content[index];
    if (next === undefined) return height;
    return height + this.minimumBlockHeight(next);
  }

  private minimumBlockHeight(element: QuestionnairePdfContent): number {
    switch (element.kind) {
      case "field-grid":
        return this.layoutFieldRows(element)[0]?.height ?? 0;
      case "form-rows":
        return this.layoutFormRows(element)[0]?.height ?? 0;
      case "text":
        return (this.layoutParagraphs(element)[0]?.lines.length ?? 0) > 0
          ? LAYOUT.text.lineHeight
          : 0;
      case "signature":
        return QUESTIONNAIRE_PDF_SIGNATURE_HEIGHT;
      case "heading":
        return this.pageRenderer.headingHeight(element);
    }
  }

  private layoutFieldRows(
    grid: QuestionnairePdfFieldGrid,
  ): QuestionnairePdfFieldRowLayout[] {
    return layoutQuestionnairePdfFieldRows(
      grid.fields,
      this.regularFont,
      this.boldFont,
      this.pageRenderer.contentWidth,
    );
  }

  private layoutFormRows(
    block: QuestionnairePdfFormRows,
  ): QuestionnairePdfFormRowLayout[] {
    return layoutQuestionnairePdfFormRows(
      block.rows,
      this.regularFont,
      this.boldFont,
      this.pageRenderer.contentWidth,
    );
  }

  private layoutParagraphs(
    block: QuestionnairePdfTextBlock,
  ): QuestionnairePdfParagraphLayout[] {
    return layoutQuestionnairePdfParagraphs(
      block.paragraphs,
      this.regularFont,
      this.pageRenderer.contentWidth,
    );
  }

  private keepBlockTogether(height: number): void {
    if (height <= this.pageRenderer.pageCapacity) this.ensureSpace(height);
  }

  private ensureSpace(requiredHeight: number): void {
    if (this.y - requiredHeight >= LAYOUT.pageMargin) return;
    if (this.y < this.pageRenderer.pageTop) this.startPage();
  }

  private startPage(): void {
    this.pageRenderer = this.createPageRenderer();
    this.y = this.pageRenderer.pageTop;
  }

  private createPageRenderer(): QuestionnairePdfPageRenderer {
    return new QuestionnairePdfPageRenderer(
      this.document.addPage(PageSizes.A4),
      this.regularFont,
      this.boldFont,
    );
  }
}

function totalFieldGridHeight(
  rows: readonly QuestionnairePdfFieldRowLayout[],
): number {
  const rowHeights = rows.reduce((total, row) => total + row.height, 0);
  const gaps = Math.max(0, rows.length - 1) * LAYOUT.field.rowGap;
  return rowHeights + gaps + LAYOUT.blockGap;
}

function totalFormRowsHeight(
  rows: readonly QuestionnairePdfFormRowLayout[],
): number {
  return rows.reduce<number>(
    (total, row) => total + row.height,
    LAYOUT.blockGap,
  );
}

function totalTextBlockHeight(
  paragraphs: readonly QuestionnairePdfParagraphLayout[],
): number {
  const textHeight = paragraphs.reduce(
    (total, paragraph) => total + paragraph.height,
    0,
  );
  const gaps = Math.max(0, paragraphs.length - 1) *
    LAYOUT.text.paragraphGap;
  return textHeight + gaps + LAYOUT.blockGap;
}
