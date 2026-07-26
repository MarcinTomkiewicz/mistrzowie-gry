import { type PDFFont, type PDFPage, rgb } from "npm:pdf-lib@1.17.1";

import { QUESTIONNAIRE_PDF_LAYOUT as LAYOUT } from "./questionnaire-pdf-layout.ts";

export const QUESTIONNAIRE_PDF_SIGNATURE_HEIGHT = 64;

const SIGNATURE_GAP = 42;
const LABEL_SIZE = 8;
const MUTED_INK = rgb(0.32, 0.32, 0.32);

export function drawQuestionnairePdfSignatureBlock(
  page: PDFPage,
  regularFont: PDFFont,
  top: number,
  contentWidth: number,
  placeAndDateLabel: string,
  signatureLabel: string,
): number {
  const fieldWidth = (contentWidth - SIGNATURE_GAP) / 2;
  const lineY = top - 32;

  drawSignatureField(
    page,
    regularFont,
    LAYOUT.pageMargin,
    lineY,
    fieldWidth,
    placeAndDateLabel,
  );
  drawSignatureField(
    page,
    regularFont,
    LAYOUT.pageMargin + fieldWidth + SIGNATURE_GAP,
    lineY,
    fieldWidth,
    signatureLabel,
  );

  return top - QUESTIONNAIRE_PDF_SIGNATURE_HEIGHT;
}

function drawSignatureField(
  page: PDFPage,
  regularFont: PDFFont,
  x: number,
  lineY: number,
  width: number,
  label: string,
): void {
  page.drawLine({
    start: { x, y: lineY },
    end: { x: x + width, y: lineY },
    thickness: 0.75,
    color: MUTED_INK,
  });
  const labelWidth = regularFont.widthOfTextAtSize(label, LABEL_SIZE);
  page.drawText(label, {
    x: x + ((width - labelWidth) / 2),
    y: lineY - 12,
    size: LABEL_SIZE,
    font: regularFont,
    color: MUTED_INK,
  });
}
