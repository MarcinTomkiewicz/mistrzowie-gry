import type { Font } from '@pdf-lib/fontkit';

import type { ContractTemplateFieldMap } from '../types/contract-template-field-map';

type TextField = Extract<ContractTemplateFieldMap['fields'][string], { kind: 'text' }>;
type MeasuredLine = {
  readonly left: number;
  readonly width: number;
  readonly top: number;
  readonly bottom: number;
};
type FittedText = {
  readonly size: number;
  readonly lines: readonly { text: string; x: number; y: number }[];
};

export function fitContractPdfText(text: string, field: TextField, font: Font): FittedText | null {
  const paragraphs = text.split('\n');
  const measurements = new Map<string, MeasuredLine>();
  const measure = (line: string): MeasuredLine => {
    const cached = measurements.get(line);
    if (cached !== undefined) return cached;
    const measured = measureLine(line, font);
    measurements.set(line, measured);
    return measured;
  };

  const naturalLineHeight = (font.ascent - font.descent + Math.max(0, font.lineGap)) / font.unitsPerEm;
  const fit = (size: number): FittedText | null => {
    const fitsWidth = (line: string): boolean => measure(line).width * size <= field.width;
    const lines: { text: string; left: number }[] = [];
    let ascent = 0;
    let descent = 0;
    for (const paragraph of paragraphs) {
      const wrapped = field.multiline ? wrapParagraph(paragraph, fitsWidth) : [paragraph];
      if (wrapped === null || (lines.length + wrapped.length - 1) * naturalLineHeight * size > field.height) {
        return null;
      }
      for (const line of wrapped) {
        const metrics = measure(line);
        if (metrics.width * size > field.width) return null;
        ascent = Math.max(ascent, metrics.top);
        descent = Math.max(descent, -metrics.bottom);
        lines.push({ text: line, left: metrics.left });
      }
    }

    const lineHeight = Math.max(naturalLineHeight, ascent + descent);
    const height = (ascent + descent + (lines.length - 1) * lineHeight) * size;
    if (!(height <= field.height)) return null;

    return {
      size,
      lines: lines.map((line, index) => ({
        text: line.text,
        x: -line.left * size,
        y: field.height - (ascent + index * lineHeight) * size,
      })),
    };
  };

  const { sizePt, minSizePt } = field.font;
  const nominal = fit(sizePt);
  if (nominal !== null) return nominal;

  let best = fit(minSizePt);
  if (best === null) return null;

  let upper = sizePt;
  for (let step = 0; step < 24 && upper - best.size > 0.01; step++) {
    const candidate = best.size + (upper - best.size) / 2;
    const fitted = fit(candidate);
    if (fitted === null) upper = candidate;
    else best = fitted;
  }
  return best;
}

function measureLine(text: string, font: Font): MeasuredLine {
  let advance = 0;
  let left = 0;
  let right = 0;
  let top = 0;
  let bottom = 0;
  // PDF-LIB emits the shaped glyphs using their nominal advances.
  for (const glyph of font.layout(text).glyphs) {
    const box = glyph.bbox;
    left = Math.min(left, advance + box.minX);
    right = Math.max(right, advance + box.maxX);
    top = Math.max(top, box.maxY);
    bottom = Math.min(bottom, box.minY);
    advance += glyph.advanceWidth;
  }
  return {
    left: left / font.unitsPerEm,
    width: (Math.max(right, advance) - left) / font.unitsPerEm,
    top: top / font.unitsPerEm,
    bottom: bottom / font.unitsPerEm,
  };
}

function wrapParagraph(paragraph: string, fits: (line: string) => boolean): string[] | null {
  const lines: string[] = [];
  let line = '';
  for (const token of paragraph.match(/ *[^ ]+| +$/gu) ?? []) {
    const candidate = line + token;
    if (fits(candidate)) {
      line = candidate;
      continue;
    }
    const word = token.replace(/^ +/u, '');
    if (word === '') break;
    if (line !== '') lines.push(line);
    line = word;
    if (fits(line)) continue;

    let chunk = '';
    for (const { segment } of new Intl.Segmenter().segment(line)) {
      const next = chunk + segment;
      if (fits(next)) {
        chunk = next;
        continue;
      }
      if (chunk === '' || !fits(segment)) return null;
      lines.push(chunk);
      chunk = segment;
    }
    line = chunk;
  }
  lines.push(line);
  return lines;
}
