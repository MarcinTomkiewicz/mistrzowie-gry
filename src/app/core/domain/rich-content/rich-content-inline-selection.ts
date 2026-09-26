import type {
  RichContentInlineRange,
  RichContentInlineTargetType,
  RichContentInlineNode,
} from '../../types/rich-content';
import {
  assertRichContentInlineRange,
  richContentInlineText,
} from './rich-content-inline-operations';

export function richContentInlineRanges(
  nodes: readonly RichContentInlineNode[],
): RichContentInlineRange[] {
  let offset = 0;
  return nodes.map((node) => {
    const start = offset;
    offset += node.text.length;
    return { ...node, start, end: offset };
  });
}

export function richContentInlineTargetAtSelection(
  nodes: readonly RichContentInlineNode[],
  start: number,
  end: number,
  type: RichContentInlineTargetType,
): RichContentInlineRange | null {
  assertRichContentInlineRange(nodes, start, end);
  return richContentInlineRanges(nodes).find((node) =>
    node.type === type && (start === end
      ? start > node.start && start < node.end
      : start >= node.start && end <= node.end),
  ) ?? null;
}

export function richContentSelectionHasFormat(
  nodes: readonly RichContentInlineNode[],
  start: number,
  end: number,
  type: RichContentInlineNode['type'],
): boolean {
  assertRichContentInlineRange(nodes, start, end);
  return richContentInlineRanges(nodes).some((node) =>
    node.type === type && (start === end
      ? start > node.start && start < node.end
      : node.start < end && node.end > start),
  );
}

export function isRichContentSelectionStrong(
  nodes: readonly RichContentInlineNode[],
  start: number,
  end: number,
): boolean {
  if (start === end) return false;
  assertRichContentInlineRange(nodes, start, end);
  const selected = richContentInlineRanges(nodes).filter((node) =>
    node.start < end && node.end > start,
  );
  return selected.length > 0 && selected.every((node) => node.type === 'strong');
}

export function canApplyRichContentInlineTarget(
  nodes: readonly RichContentInlineNode[],
  start: number,
  end: number,
  type: RichContentInlineTargetType,
): boolean {
  const existing = richContentInlineTargetAtSelection(nodes, start, end, type);
  const other = type === 'link' ? 'dialog' : 'link';
  if (!(existing?.text ?? richContentInlineText(nodes).slice(start, end)).trim()) {
    return false;
  }
  return !richContentSelectionHasFormat(nodes, start, end, 'strong') &&
    !richContentSelectionHasFormat(nodes, start, end, other) &&
    (existing !== null || (start !== end &&
      !richContentSelectionHasFormat(nodes, start, end, type)));
}
