import { RICH_CONTENT_INLINE_MARKUP } from '../../configs/rich-content-markup.config';
import type { NumericInterval } from '../../types/interval';
import type { RichContentInlineNode } from '../../types/rich-content';
import type { RichContentMarkupResult } from '../../types/rich-content-markup';
import { decodeInlineMarkupText, escapeInlineMarkupText } from './rich-content-inline-markup';

export function serializeRichContentInlineMarkup(nodes: readonly RichContentInlineNode[]): string {
  const parts: string[] = [];
  let plainText = '';
  const flushText = (followedByMarkup: boolean) => {
    parts.push(escapeInlineMarkupText(plainText, followedByMarkup));
    plainText = '';
  };
  for (const node of nodes) {
    if (node.type === 'text') {
      plainText += node.text;
      continue;
    }
    flushText(true);
    const syntax = RICH_CONTENT_INLINE_MARKUP[node.type];
    const target = node.type === 'dialog' ? node.dialog : node.type === 'link'
      ? node.href + (node.external === undefined ? '' : ' external=' + node.external) : '';
    parts.push(syntax.open + target + (node.type === 'strong' ? '' : ']') +
      escapeInlineMarkupText(node.text, true) + syntax.close);
  }
  flushText(false);
  return parts.join('');
}

// These offsets serve explicit toolbar operations only. Native textarea input
// never goes through this mapping or through structured-node serialization.
export function richContentMarkupSelectionToText(
  source: string, markup: RichContentMarkupResult, selection: NumericInterval,
): NumericInterval {
  const offsetToText = (offset: number) => {
    const span = markup.spans.find((item) => offset <= item.source.end);
    if (!span) return 0;
    const end = Math.max(span.content.start, Math.min(offset, span.content.end));
    return span.text.start + decodeInlineMarkupText(source.slice(span.content.start, end)).length;
  };
  return { start: offsetToText(selection.start), end: offsetToText(selection.end) };
}

export function richContentTextSelectionToMarkup(
  source: string, markup: RichContentMarkupResult, selection: NumericInterval,
): NumericInterval {
  const textToOffset = (offset: number, forward: boolean) => {
    const candidates = markup.spans.filter((span) => span.text.start <= offset && offset <= span.text.end);
    const span = forward ? candidates.at(-1) : candidates[0];
    if (!span) return 0;
    let cursor = span.content.start;
    let remaining = offset - span.text.start;
    while (remaining > 0) {
      if (source[cursor] === '\\' && /[\\\[]/.test(source[cursor + 1] ?? '')) cursor++;
      cursor++;
      remaining--;
    }
    return cursor;
  };
  const start = textToOffset(selection.start, true);
  return { start, end: selection.start === selection.end ? start : textToOffset(selection.end, false) };
}

export function richContentDialogTargetAtCaret(source: string, caret: number): NumericInterval | null {
  const prefix = RICH_CONTENT_INLINE_MARKUP.dialog.open;
  const opening = source.lastIndexOf(prefix, caret);
  if (opening < 0) return null;
  let backslashes = 0;
  for (let index = opening - 1; index >= 0 && source[index] === '\\'; index--) backslashes++;
  if (backslashes % 2) return null;
  const start = opening + prefix.length;
  const target = /^[^\[\]\s]*/.exec(source.slice(start));
  const end = start + (target?.[0].length ?? 0);
  return caret >= start && caret <= end ? { start, end } : null;
}
