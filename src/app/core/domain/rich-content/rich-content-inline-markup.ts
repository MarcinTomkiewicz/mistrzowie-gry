import { INTERNAL_LINK_BASE_URL } from '../../configs/internal-link.config';
import { LEGAL_DIALOGS } from '../../configs/legal-dialogs.config';
import { RICH_CONTENT_INLINE_MARKUP } from '../../configs/rich-content-markup.config';
import type { InternalLinkMarkupNode } from '../../types/internal-link';
import type { NumericInterval } from '../../types/interval';
import type { RichContentInlineNode } from '../../types/rich-content';
import type {
  RichContentMarkupIssue,
  RichContentMarkupResult,
} from '../../types/rich-content-markup';
import { parseRichContentLinkTarget } from './rich-content-link-target';

type MarkupType = keyof typeof RICH_CONTENT_INLINE_MARKUP;
type MarkupMode = 'rich-content' | 'internal-link';
interface Marker {
  index: number;
  type: MarkupType;
  closing: boolean;
}

export function parseInlineMarkup(
  value: string, mode: 'internal-link',
): RichContentMarkupResult<InternalLinkMarkupNode>;
export function parseInlineMarkup(value: string): RichContentMarkupResult;
export function parseInlineMarkup(
  value: string, mode: MarkupMode = 'rich-content',
): RichContentMarkupResult {
  const result: RichContentMarkupResult = { nodes: [], spans: [], issues: [] };
  let cursor = 0;
  let textOffset = 0;
  const decode = (text: string) =>
    mode === 'rich-content' ? decodeInlineMarkupText(text) : text;
  const append = (node: RichContentInlineNode, source: NumericInterval, content = source) => {
    if (!node.text) return;
    result.nodes.push(node);
    result.spans.push({
      node, source, content,
      text: { start: textOffset, end: textOffset + node.text.length },
    });
    textOffset += node.text.length;
  };
  const appendText = (start: number, end: number) => {
    append({ type: 'text', text: decode(value.slice(start, end)) }, { start, end });
  };
  const invalid = (
    start: number, end: number, messageKey: RichContentMarkupIssue['messageKey'],
  ) => {
    appendText(start, end);
    result.issues.push({ start, end, messageKey });
  };

  while (cursor < value.length) {
    const marker = findMarker(value, cursor, mode);
    if (!marker) {
      appendText(cursor, value.length);
      break;
    }
    appendText(cursor, marker.index);
    const syntax = RICH_CONTENT_INLINE_MARKUP[marker.type];
    if (marker.closing) {
      cursor = marker.index + syntax.close.length;
      invalid(marker.index, cursor, 'invalidMarkup');
      continue;
    }
    const parameterStart = marker.index + syntax.open.length;
    const headerEnd = marker.type === 'strong'
      ? parameterStart - 1 : value.indexOf(']', parameterStart);
    const next = findMarker(value, parameterStart, mode);
    if (headerEnd < 0 || (mode === 'rich-content' && next && next.index < headerEnd)) {
      cursor = next?.index ?? value.length;
      invalid(marker.index, cursor, 'incompleteMarkup');
      continue;
    }
    const internalClose = mode === 'internal-link'
      ? value.indexOf(syntax.close, headerEnd + 1) : -1;
    const closing = mode === 'internal-link'
      ? internalClose < 0 ? null : { index: internalClose, type: marker.type, closing: true }
      : findMarker(value, headerEnd + 1, mode);
    if (!closing || !closing.closing || closing.type !== marker.type) {
      cursor = closing?.index ?? value.length;
      invalid(marker.index, cursor, closing ? 'invalidMarkup' : 'incompleteMarkup');
      continue;
    }
    const text = decode(value.slice(headerEnd + 1, closing.index));
    const parameter = marker.type === 'strong' ? '' : value.slice(parameterStart, headerEnd);
    const node = createMarkupNode(marker.type, parameter, text, mode);
    cursor = closing.index + syntax.close.length;
    if (node) {
      append(node, { start: marker.index, end: cursor }, {
        start: headerEnd + 1, end: closing.index,
      });
    } else {
      invalid(marker.index, cursor, marker.type === 'dialog' ? 'invalidDialog' :
        marker.type === 'link' ? 'invalidLink' : 'invalidMarkup');
    }
  }
  return result;
}

export function decodeInlineMarkupText(value: string): string {
  return value.replace(/\\([\\\[])/g, '$1');
}

export function escapeInlineMarkupText(value: string, followedByMarkup = false): string {
  return value.replace(/[\\\[]/g, (character, index: number) => {
    const collision = character === '\\'
      ? /[\\\[]/.test(value[index + 1] ?? (followedByMarkup ? '[' : ''))
      : Object.values(RICH_CONTENT_INLINE_MARKUP).some((syntax) =>
          value.startsWith(syntax.open, index) || value.startsWith(syntax.close, index)
        );
    return collision ? '\\' + character : character;
  });
}

function findMarker(value: string, from: number, mode: MarkupMode): Marker | null {
  for (let index = from; index < value.length; index++) {
    if (mode === 'rich-content' && value[index] === '\\' &&
      /[\\\[]/.test(value[index + 1] ?? '')) {
      index++;
      continue;
    }
    if (value[index] !== '[') continue;
    const types: readonly MarkupType[] = mode === 'internal-link'
      ? ['link'] : ['link', 'dialog', 'strong'];
    for (const type of types) {
      const syntax = RICH_CONTENT_INLINE_MARKUP[type];
      if (value.startsWith(syntax.open, index)) return { index, type, closing: false };
      if (value.startsWith(syntax.close, index)) return { index, type, closing: true };
    }
  }
  return null;
}

function createMarkupNode(
  type: MarkupType, parameter: string, text: string, mode: MarkupMode,
): RichContentInlineNode | null {
  if (type === 'strong') return text ? { type, text } : null;
  if (!text.trim()) return null;
  if (type === 'dialog') {
    const definition = Object.values(LEGAL_DIALOGS).find((item) => item.dialog === parameter);
    return definition ? { type, text, dialog: definition.dialog } : null;
  }
  if (mode === 'internal-link') {
    return isValidInternalLinkPath(parameter) && !text.includes(RICH_CONTENT_INLINE_MARKUP.link.open)
      ? { type, text, href: parameter } : null;
  }
  const target = parseRichContentLinkTarget(parameter);
  return target ? { type, text, ...target } : null;
}

function isValidInternalLinkPath(path: string): boolean {
  if (!path.startsWith('/') || path.startsWith('//') || /\s|\[|\]|\\/.test(path)) return false;
  try {
    return new URL(path, INTERNAL_LINK_BASE_URL).origin === INTERNAL_LINK_BASE_URL;
  } catch {
    return false;
  }
}
