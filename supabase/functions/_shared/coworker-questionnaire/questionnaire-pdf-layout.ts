import type { PDFFont } from "npm:pdf-lib@1.17.1";

import type {
  QuestionnairePdfField,
  QuestionnairePdfFormRow,
} from "./questionnaire-pdf-content-model.ts";

export const QUESTIONNAIRE_PDF_LAYOUT = {
  pageMargin: 42,
  blockGap: 10,
  field: {
    columnGap: 8,
    rowGap: 6,
    paddingX: 7,
    paddingY: 6,
    labelSize: 7.5,
    labelLineHeight: 9,
    valueSize: 9,
    valueLineHeight: 11,
    labelValueGap: 3,
    minimumHeight: 38,
  },
  form: {
    paddingX: 7,
    paddingY: 6,
    fontSize: 8.5,
    lineHeight: 10.5,
    answerWidth: 72,
    detailLabelRatio: 0.38,
    minimumHeight: 29,
  },
  text: {
    fontSize: 9,
    lineHeight: 12,
    paragraphGap: 5,
  },
} as const;

export interface QuestionnairePdfFieldCellLayout {
  readonly width: number;
  readonly labelLines: readonly string[];
  readonly valueLines: readonly string[];
}

export interface QuestionnairePdfFieldRowLayout {
  readonly cells: readonly QuestionnairePdfFieldCellLayout[];
  readonly height: number;
}

export interface QuestionnairePdfFormRowLayout {
  readonly row: QuestionnairePdfFormRow;
  readonly labelWidth: number;
  readonly labelLines: readonly string[];
  readonly valueLines: readonly string[];
  readonly height: number;
}

export interface QuestionnairePdfParagraphLayout {
  readonly lines: readonly string[];
  readonly height: number;
}

export function layoutQuestionnairePdfFieldRows(
  fields: readonly QuestionnairePdfField[],
  regularFont: PDFFont,
  boldFont: PDFFont,
  contentWidth: number,
): QuestionnairePdfFieldRowLayout[] {
  const config = QUESTIONNAIRE_PDF_LAYOUT.field;
  const columnWidth = (contentWidth - config.columnGap) / 2;

  return groupFields(fields).map((fieldsInRow) => {
    const cells = fieldsInRow.map((field) => {
      const width = field.span === "full" ? contentWidth : columnWidth;
      const textWidth = width - (2 * config.paddingX);
      return {
        width,
        labelLines: wrapQuestionnairePdfText(
          field.label,
          boldFont,
          config.labelSize,
          textWidth,
        ),
        valueLines: wrapQuestionnairePdfText(
          field.value,
          regularFont,
          config.valueSize,
          textWidth,
        ),
      };
    });
    const height = Math.max(
      config.minimumHeight,
      ...cells.map((cell) =>
        (2 * config.paddingY) +
        (cell.labelLines.length * config.labelLineHeight) +
        config.labelValueGap +
        (cell.valueLines.length * config.valueLineHeight)
      ),
    );

    return { cells, height };
  });
}

export function layoutQuestionnairePdfFormRows(
  rows: readonly QuestionnairePdfFormRow[],
  regularFont: PDFFont,
  boldFont: PDFFont,
  contentWidth: number,
): QuestionnairePdfFormRowLayout[] {
  const config = QUESTIONNAIRE_PDF_LAYOUT.form;

  return rows.map((row) => {
    const labelWidth = row.layout === "answer"
      ? contentWidth - config.answerWidth
      : row.layout === "detail"
      ? contentWidth * config.detailLabelRatio
      : 0;
    const valueWidth = contentWidth - labelWidth;
    const labelLines = labelWidth === 0 ? [] : wrapQuestionnairePdfText(
      row.label,
      regularFont,
      config.fontSize,
      labelWidth - (2 * config.paddingX),
    );
    const valueLines = wrapQuestionnairePdfText(
      row.value,
      row.layout === "answer" ? boldFont : regularFont,
      config.fontSize,
      valueWidth - (2 * config.paddingX),
    );
    const height = Math.max(
      config.minimumHeight,
      (2 * config.paddingY) +
        (Math.max(labelLines.length, valueLines.length) * config.lineHeight),
    );

    return { row, labelWidth, labelLines, valueLines, height };
  });
}

export function layoutQuestionnairePdfParagraphs(
  paragraphs: readonly string[],
  regularFont: PDFFont,
  contentWidth: number,
): QuestionnairePdfParagraphLayout[] {
  const config = QUESTIONNAIRE_PDF_LAYOUT.text;
  return paragraphs.map((paragraph) => {
    const lines = wrapQuestionnairePdfText(
      paragraph,
      regularFont,
      config.fontSize,
      contentWidth,
    );
    return {
      lines,
      height: lines.length * config.lineHeight,
    };
  });
}

export function wrapQuestionnairePdfText(
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

function groupFields(
  fields: readonly QuestionnairePdfField[],
): QuestionnairePdfField[][] {
  const rows: QuestionnairePdfField[][] = [];
  let columns: QuestionnairePdfField[] = [];

  for (const field of fields) {
    if (field.span === "full") {
      if (columns.length > 0) rows.push(columns);
      rows.push([field]);
      columns = [];
      continue;
    }
    columns.push(field);
    if (columns.length === 2) {
      rows.push(columns);
      columns = [];
    }
  }
  if (columns.length > 0) rows.push(columns);

  return rows;
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
