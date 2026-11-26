import { DOCUMENT } from '@angular/common';
import { inject, Injectable } from '@angular/core';
import type { Font } from '@pdf-lib/fontkit';
import type { PDFFont, PDFPage } from 'pdf-lib';

import type { ContractArea, ContractField, ContractPlacement, ContractValue, ContractValues } from '../../types/contract-template-configuration';
import { openStaticContractPdf } from '../../utils/contract-pdf-geometry';
import { fitContractPdfText } from '../../utils/contract-pdf-text';
import { formatNumber } from '../../utils/number-format';
import { hasCompleteConfiguration, type VerifiedContractTemplate } from '../admin-contract-templates/contract-template-library';
import { Platform } from '../platform/platform';

type FieldErrorCode = 'unknown-field' | 'invalid-area' | 'invalid-value' | 'invalid-font' | 'unsupported-character' | 'text-overflow';
export type ContractPdfFillResult =
  | { readonly status: 'filled'; readonly pdfBytes: Uint8Array }
  | { readonly status: 'missing-data' }
  | {
      readonly status: 'invalid-fields';
      readonly errors: readonly { readonly fieldId: string; readonly code: FieldErrorCode; readonly placementIndex: number }[];
    };

type EmbeddedFont = { font: Font; pdfFont: PDFFont };

@Injectable({ providedIn: 'root' })
export class ContractPdfFill {
  private readonly platform = inject(Platform);
  private readonly document = inject(DOCUMENT);

  async fill(snapshot: VerifiedContractTemplate, values: ContractValues): Promise<ContractPdfFillResult> {
    if (!this.platform.isBrowser) throw new Error('Contracts can only be filled in the browser.');
    const config = snapshot.revision.configuration;
    if (config === null || !hasCompleteConfiguration(snapshot)) throw new Error('Incomplete PDF configuration.');

    const placements = config.placements.flatMap((placement, placementIndex) => {
      const value = Object.hasOwn(values, placement.fieldId) ? values[placement.fieldId] : null;
      if (value === null || value === '') return [];
      if (placement.kind === 'checkbox' && value !== (placement.optionValue ?? true)) return [];
      return [{ placement, placementIndex, value }];
    });
    if (!placements.length) return { status: 'missing-data' };

    const { pdf, pages, areas } = await openStaticContractPdf(snapshot.pdfBytes);
    const fields = new Map(config.fields.map((field) => [field.id, field]));
    const errors: Extract<ContractPdfFillResult, { status: 'invalid-fields' }>['errors'][number][] = [];
    const fontPlacementIndex = config.placements.findIndex(({ kind }) => kind === 'text');
    const font = fontPlacementIndex === -1 ? null : await this.embedFont(pdf);
    if (fontPlacementIndex !== -1 && !font) {
      return invalidFont(config.placements[fontPlacementIndex], fontPlacementIndex);
    }

    for (const { placementIndex, placement, value } of placements) {
      const field = fields.get(placement.fieldId);
      const page = pages[placement.page - 1];
      const area = areas[placement.page - 1];
      const code = !field ? 'unknown-field' : !page || !area ? 'invalid-area' :
        drawPlacement(page, area, placement, field, value, font);
      if (code !== undefined) errors.push({ fieldId: placement.fieldId, placementIndex, code });
    }
    if (errors.length) return { status: 'invalid-fields', errors };

    if (font) {
      try {
        await font.pdfFont.embed();
      } catch {
        return invalidFont(config.placements[fontPlacementIndex], fontPlacementIndex);
      }
    }
    return { status: 'filled', pdfBytes: await pdf.save({ addDefaultPage: false, updateFieldAppearances: false }) };
  }

  private async embedFont(pdf: Awaited<ReturnType<typeof openStaticContractPdf>>['pdf']): Promise<EmbeddedFont | null> {
    try {
      const [response, { default: fontkit }] = await Promise.all([
        fetch(new URL('assets/contract-fonts/Lato-Regular.ttf', this.document.baseURI), { credentials: 'omit' }),
        import('@pdf-lib/fontkit'),
      ]);
      if (!response.ok) return null;
      const bytes = new Uint8Array(await response.arrayBuffer());
      const font = fontkit.create(bytes);
      pdf.registerFontkit({ create: () => font });
      const pdfFont = await pdf.embedFont(bytes, { subset: true });
      // Keep the subset valid even when the sample only draws checkboxes.
      pdfFont.encodeText(' ');
      return { font, pdfFont };
    } catch {
      return null;
    }
  }
}

function invalidFont({ fieldId }: ContractPlacement, placementIndex: number): ContractPdfFillResult {
  return { status: 'invalid-fields', errors: [{ fieldId, placementIndex, code: 'invalid-font' }] };
}

function drawPlacement(
  page: PDFPage,
  area: ContractArea,
  placement: ContractPlacement,
  field: ContractField,
  value: Exclude<ContractValue, null>,
  embedded: EmbeddedFont | null,
): FieldErrorCode | undefined {
  const x = area.x + placement.x;
  const y = area.y + placement.y;
  if (placement.kind === 'checkbox') {
    drawCheck(page, x, y, placement.width, placement.height);
    return undefined;
  }

  const formatted = formatValue(field, value);
  if (formatted === null) return 'invalid-value';
  const text = formatted.replace(/\r\n?/g, '\n').normalize('NFC');
  if ((!placement.multiline && text.includes('\n')) || /[\p{Cc}\u2028\u2029]/u.test(text.replaceAll('\n', ''))) {
    return 'invalid-value';
  }
  if (!embedded) return 'invalid-font';
  for (const character of text) {
    const codePoint = character.codePointAt(0);
    if (character !== '\n' && (codePoint === undefined || !embedded.font.hasGlyphForCodePoint(codePoint))) {
      return 'unsupported-character';
    }
  }

  const layout = fitContractPdfText(text, placement, embedded.font);
  if (layout === null) return 'text-overflow';
  for (const line of layout.lines) {
    if (line.text) page.drawText(line.text, { x: x + line.x, y: y + line.y, size: layout.size, font: embedded.pdfFont });
  }
  return undefined;
}

function formatValue(field: ContractField, value: Exclude<ContractValue, null>): string | null {
  switch (field.kind) {
    case 'select': return field.options.find((option) => option.value === value)?.label ?? null;
    case 'date': return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value.split('-').reverse().join('.') : null;
    case 'integer':
    case 'decimal': {
      const places = field.rules.decimalPlaces ?? 0;
      return typeof value === 'number' ? formatNumber(value, 'pl-PL', {
        minimumFractionDigits: places, maximumFractionDigits: places, useGrouping: false,
      }) : null;
    }
    default: return typeof value === 'string' ? value : null;
  }
}

function drawCheck(page: PDFPage, x: number, y: number, width: number, height: number): void {
  const size = Math.min(width, height);
  const left = x + (width - size) / 2;
  const bottom = y + (height - size) / 2;
  const corner = { x: left + size * 0.4, y: bottom + size * 0.25 };
  const thickness = size * 0.08;
  page.drawLine({ start: { x: left + size * 0.16, y: bottom + size * 0.48 }, end: corner, thickness });
  page.drawLine({ start: corner, end: { x: left + size * 0.84, y: bottom + size * 0.76 }, thickness });
}
