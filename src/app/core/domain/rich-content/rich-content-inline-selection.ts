import type { RichContentLinkRange } from '../../types/rich-content-editor';
import type { InternalLinkMarkupLinkNode } from '../../types/internal-link';
import type { RichContentInlineNode } from '../../types/rich-content';
import { assertRichContentInlineRange } from './rich-content-inline-operations';

export function richContentSelectionHasLink(
  nodes: readonly RichContentInlineNode[],
  start: number,
  end: number,
): boolean {
  assertRichContentInlineRange(nodes, start, end);

  if (start === end) {
    return richContentLinkAtSelection(nodes, start, end) !== null;
  }

  return richContentLinks(nodes).some(
    (link) => link.start < end && link.end > start,
  );
}

export function isRichContentSelectionStrong(
  nodes: readonly RichContentInlineNode[],
  start: number,
  end: number,
): boolean {
  if (start === end) return false;
  assertRichContentInlineRange(nodes, start, end);

  let hasSelection = false;
  let offset = 0;

  for (const node of nodes) {
    const nodeEnd = offset + node.text.length;
    if (offset < end && nodeEnd > start) {
      hasSelection = true;
      if (node.type !== 'strong') return false;
    }
    offset = nodeEnd;
  }

  return hasSelection;
}

export function richContentSelectionHasStrong(
  nodes: readonly RichContentInlineNode[],
  start: number,
  end: number,
): boolean {
  if (start === end) return false;
  assertRichContentInlineRange(nodes, start, end);

  let offset = 0;
  for (const node of nodes) {
    const nodeEnd = offset + node.text.length;
    if (offset < end && nodeEnd > start && node.type === 'strong') return true;
    offset = nodeEnd;
  }

  return false;
}

export function richContentLinks(
  nodes: readonly RichContentInlineNode[],
): RichContentLinkRange[] {
  const links: RichContentLinkRange[] = [];
  let offset = 0;

  for (const node of nodes) {
    const end = offset + node.text.length;
    if (node.type === 'link') links.push(linkRange(node, offset, end));
    offset = end;
  }

  return links;
}

export function richContentLinkAtSelection(
  nodes: readonly RichContentInlineNode[],
  start: number,
  end: number,
): RichContentLinkRange | null {
  assertRichContentInlineRange(nodes, start, end);

  return richContentLinks(nodes).find((link) =>
    start === end
      ? start > link.start && start < link.end
      : start >= link.start && end <= link.end,
  ) ?? null;
}

function linkRange(
  node: InternalLinkMarkupLinkNode,
  start: number,
  end: number,
): RichContentLinkRange {
  return {
    start,
    end,
    text: node.text,
    href: node.href,
    external: node.external ?? false,
  };
}
