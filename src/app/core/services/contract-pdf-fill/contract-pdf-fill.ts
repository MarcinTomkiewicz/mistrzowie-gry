import { inject, Injectable } from '@angular/core';
import type { Font } from '@pdf-lib/fontkit';
import type { PDFFont, PDFPage } from 'pdf-lib';

import type { ContractTemplateFieldMap } from '../../types/contract-template-field-map';
import { fitContractPdfText } from '../../utils/contract-pdf-text';
import type { ContractTemplateLoadResult } from '../admin-contract-templates/contract-template-library';
import { Platform } from '../platform/platform';

type ReadyTemplate = Extract<ContractTemplateLoadResult, { status: 'ready' }>;
type Field = ContractTemplateFieldMap['fields'][string];
type FieldErrorCode =
  | 'unknown-field'
  | 'invalid-area'
  | 'invalid-value'
  | 'invalid-font'
  | 'unsupported-character'
  | 'text-overflow';
type EmbeddedFont = { readonly font: Font; readonly pdfFont: PDFFont };

export type ContractPdfFillResult =
  | { readonly status: 'filled'; readonly pdfBytes: Uint8Array }
  | {
      readonly status: 'invalid-fields';
      readonly errors: readonly { readonly fieldId: string; readonly code: FieldErrorCode }[];
    };

@Injectable({ providedIn: 'root' })
export class ContractPdfFill {
  private readonly platform = inject(Platform);

  /** Font bytes are supplied locally, keyed by the family name in the field map. */
  async fill(
    template: ReadyTemplate,
    values: Readonly<Record<string, string | boolean>>,
    fontFiles: ReadonlyMap<string, Uint8Array>,
  ): Promise<ContractPdfFillResult> {
    if (!this.platform.isBrowser) throw new Error('Contracts can only be filled in the browser.');

    const [{ PDFDocument, PDFName }, { default: fontkit }] = await Promise.all([
      import('pdf-lib'),
      import('@pdf-lib/fontkit'),
    ]);
    const pdf = await PDFDocument.load(template.pdfBytes, {
      updateMetadata: false,
      throwOnInvalidObject: true,
    });
    const form = pdf.catalog.getAcroForm();
    if (form && (form.dict.has(PDFName.of('XFA')) || (form.Fields()?.size() ?? 0) > 0)) {
      throw new Error('Contract templates must be static PDFs.');
    }

    const fonts = new Map<string, EmbeddedFont | null>();
    const getFont = async (family: string): Promise<EmbeddedFont | null> => {
      const cached = fonts.get(family);
      if (cached !== undefined) return cached;
      const bytes = fontFiles.get(family);
      if (bytes === undefined) return null;
      let result: EmbeddedFont | null;
      try {
        const font = fontkit.create(bytes);
        pdf.registerFontkit({ create: () => font });
        result = { font, pdfFont: await pdf.embedFont(bytes, { subset: true }) };
      } catch {
        result = null;
      }
      fonts.set(family, result);
      return result;
    };

    const pages = pdf.getPages();
    const fields = template.fieldMap.fields;
    const errors: { fieldId: string; code: FieldErrorCode }[] = [];
    for (const [fieldId, value] of Object.entries(values)) {
      const code = Object.hasOwn(fields, fieldId)
        ? await drawField(pages, fields[fieldId], value, getFont)
        : 'unknown-field';
      if (code !== undefined) errors.push({ fieldId, code });
    }
    if (errors.length > 0) return { status: 'invalid-fields', errors };

    return {
      status: 'filled',
      pdfBytes: await pdf.save({ addDefaultPage: false, updateFieldAppearances: false }),
    };
  }
}

async function drawField(
  pages: readonly PDFPage[],
  field: Field,
  value: string | boolean,
  getFont: (family: string) => Promise<EmbeddedFont | null>,
): Promise<FieldErrorCode | undefined> {
  const page = pages[field.page - 1];
  if (page === undefined) return 'invalid-area';
  const origin = readFieldOrigin(page, field);
  if (origin === null) return 'invalid-area';

  if (field.kind === 'checkbox') {
    if (typeof value !== 'boolean') return 'invalid-value';
    if (value) drawCheck(page, origin.x, origin.y, field.width, field.height);
    return undefined;
  }

  if (typeof value !== 'string') return 'invalid-value';
  const text = value.replace(/\r\n?/g, '\n').normalize('NFC');
  if ((!field.multiline && text.includes('\n')) || /[\p{Cc}\u2028\u2029]/u.test(text.replaceAll('\n', ''))) {
    return 'invalid-value';
  }
  if (text.trim() === '') return undefined;

  const { family, sizePt, minSizePt } = field.font;
  if (!Number.isFinite(sizePt) || !Number.isFinite(minSizePt) || minSizePt <= 0 || sizePt < minSizePt) {
    return 'invalid-font';
  }
  const embedded = await getFont(family);
  if (embedded === null) return 'invalid-font';
  for (const character of text) {
    const codePoint = character.codePointAt(0);
    if (character !== '\n' && (codePoint === undefined || !embedded.font.hasGlyphForCodePoint(codePoint))) {
      return 'unsupported-character';
    }
  }

  const layout = fitContractPdfText(text, field, embedded.font);
  if (layout === null) return 'text-overflow';
  for (const line of layout.lines) {
    if (line.text === '') continue;
    page.drawText(line.text, {
      x: origin.x + line.x,
      y: origin.y + line.y,
      size: layout.size,
      font: embedded.pdfFont,
    });
  }
  return undefined;
}

function readFieldOrigin(page: PDFPage, field: Field): { x: number; y: number } | null {
  const { x, y, width, height } = field;
  const crop = page.getCropBox();
  const media = page.getMediaBox();
  const left = Math.max(crop.x, media.x);
  const bottom = Math.max(crop.y, media.y);
  const right = Math.min(crop.x + crop.width, media.x + media.width);
  const top = Math.min(crop.y + crop.height, media.y + media.height);
  if (
    ![x, y, width, height, left, bottom, right, top].every(Number.isFinite) ||
    x < 0 || y < 0 || width <= 0 || height <= 0 ||
    x + width > right - left || y + height > top - bottom
  ) {
    return null;
  }
  return { x: left + x, y: bottom + y };
}

function drawCheck(page: PDFPage, x: number, y: number, width: number, height: number): void {
  const size = Math.min(width, height);
  const left = x + (width - size) / 2;
  const bottom = y + (height - size) / 2;
  const corner = { x: left + size * 0.4, y: bottom + size * 0.25 };
  const thickness = size * 0.08;
  page.drawLine({
    start: { x: left + size * 0.16, y: bottom + size * 0.48 },
    end: corner,
    thickness,
  });
  page.drawLine({
    start: corner,
    end: { x: left + size * 0.84, y: bottom + size * 0.76 },
    thickness,
  });
}
