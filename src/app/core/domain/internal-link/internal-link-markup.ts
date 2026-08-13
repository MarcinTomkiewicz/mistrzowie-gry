import {
  INTERNAL_LINK_BASE_URL,
  INTERNAL_LINK_MARKUP_CLOSE,
  INTERNAL_LINK_MARKUP_OPEN,
} from '../../configs/internal-link.config';
import type { InternalLinkMarkupNode } from '../../types/internal-link';

export function parseInternalLinkText(value: string): InternalLinkMarkupNode[] {
  return parseInternalLinkMarkup(value).nodes;
}

export function hasInvalidInternalLinkSyntax(value: string): boolean {
  return !parseInternalLinkMarkup(value).isValid;
}

function parseInternalLinkMarkup(value: string) {
  const nodes: InternalLinkMarkupNode[] = [];
  let cursor = 0;
  let isValid = true;

  while (cursor < value.length) {
    const openIndex = value.indexOf(INTERNAL_LINK_MARKUP_OPEN, cursor);
    const closeIndex = value.indexOf(INTERNAL_LINK_MARKUP_CLOSE, cursor);

    if (closeIndex >= 0 && (openIndex < 0 || closeIndex < openIndex)) {
      appendTextNode(
        nodes,
        value.slice(cursor, closeIndex + INTERNAL_LINK_MARKUP_CLOSE.length),
      );
      cursor = closeIndex + INTERNAL_LINK_MARKUP_CLOSE.length;
      isValid = false;
      continue;
    }

    if (openIndex < 0) {
      appendTextNode(nodes, value.slice(cursor));
      break;
    }

    appendTextNode(nodes, value.slice(cursor, openIndex));

    const pathEndIndex = value.indexOf(
      ']',
      openIndex + INTERNAL_LINK_MARKUP_OPEN.length,
    );

    if (pathEndIndex < 0) {
      appendTextNode(nodes, value.slice(openIndex));
      isValid = false;
      break;
    }

    const markerEndIndex = value.indexOf(
      INTERNAL_LINK_MARKUP_CLOSE,
      pathEndIndex + 1,
    );

    if (markerEndIndex < 0) {
      appendTextNode(nodes, value.slice(openIndex));
      isValid = false;
      break;
    }

    const path = value.slice(
      openIndex + INTERNAL_LINK_MARKUP_OPEN.length,
      pathEndIndex,
    );
    const anchor = value.slice(pathEndIndex + 1, markerEndIndex);
    const markerEnd = markerEndIndex + INTERNAL_LINK_MARKUP_CLOSE.length;

    if (
      isValidInternalLinkPath(path) &&
      !!anchor.trim() &&
      !anchor.includes(INTERNAL_LINK_MARKUP_OPEN)
    ) {
      nodes.push({ type: 'link', text: anchor, href: path });
    } else {
      appendTextNode(nodes, value.slice(openIndex, markerEnd));
      isValid = false;
    }

    cursor = markerEnd;
  }

  return { nodes, isValid };
}

function isValidInternalLinkPath(path: string): boolean {
  if (
    !path.startsWith('/') ||
    path.startsWith('//') ||
    path.trim() !== path ||
    /\s/.test(path) ||
    path.includes('[') ||
    path.includes(']') ||
    path.includes('\\')
  ) {
    return false;
  }

  try {
    const url = new URL(path, INTERNAL_LINK_BASE_URL);
    return url.origin === INTERNAL_LINK_BASE_URL;
  } catch {
    return false;
  }
}

function appendTextNode(nodes: InternalLinkMarkupNode[], text: string): void {
  if (!text) return;

  const previousNode = nodes.at(-1);
  if (previousNode?.type === 'text') {
    previousNode.text += text;
    return;
  }

  nodes.push({ type: 'text', text });
}
