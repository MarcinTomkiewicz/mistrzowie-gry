import type {
  RichContentInlineNode,
  RichContentInlineTargetType,
} from '../../types/rich-content';
import type { LegalDialogId } from '../../types/legal-dialog';
import { isValidRichContentLinkHref } from './rich-content-link-target';

export function richContentInlineText(
  nodes: readonly RichContentInlineNode[],
): string {
  return nodes.map((node) => node.text).join('');
}

export function toggleRichContentStrong(
  nodes: readonly RichContentInlineNode[],
  start: number,
  end: number,
): RichContentInlineNode[] {
  assertNonEmptyRange(nodes, start, end);
  const selectedNodes = sliceNodes(nodes, start, end);

  if (selectedNodes.some((node) => node.type === 'link' || node.type === 'dialog')) {
    throw new Error('An interactive selection cannot also be formatted as strong');
  }

  const removeStrong = selectedNodes.every((node) => node.type === 'strong');
  const formattedNodes = selectedNodes.map((node): RichContentInlineNode => ({
    type: removeStrong ? 'text' : 'strong',
    text: node.text,
  }));

  return replaceNodesInRange(nodes, start, end, formattedNodes);
}

export function applyRichContentLink(
  nodes: readonly RichContentInlineNode[],
  start: number,
  end: number,
  href: string,
  external: boolean,
): RichContentInlineNode[] {
  assertTargetSelection(nodes, start, end, 'link');
  const normalizedHref = href.trim();
  if (!isValidRichContentLinkHref(normalizedHref)) {
    throw new Error('A RichContent link requires a valid href');
  }

  const text = richContentInlineText(nodes).slice(start, end);
  if (!text.trim()) throw new Error('A RichContent link requires nonempty text');
  return replaceNodesInRange(nodes, start, end, [
    { type: 'link', text, href: normalizedHref, external },
  ]);
}

export function applyRichContentDialog(
  nodes: readonly RichContentInlineNode[],
  start: number,
  end: number,
  dialog: LegalDialogId,
): RichContentInlineNode[] {
  assertTargetSelection(nodes, start, end, 'dialog');
  const text = richContentInlineText(nodes).slice(start, end);
  if (!text.trim()) throw new Error('A RichContent dialog requires nonempty text');
  return replaceNodesInRange(nodes, start, end, [{ type: 'dialog', text, dialog }]);
}

export function removeRichContentInlineTarget(
  nodes: readonly RichContentInlineNode[],
  start: number,
  end: number,
): RichContentInlineNode[] {
  assertNonEmptyRange(nodes, start, end);
  const text = richContentInlineText(nodes).slice(start, end);

  return replaceNodesInRange(nodes, start, end, [{ type: 'text', text }]);
}

function replaceNodesInRange(
  nodes: readonly RichContentInlineNode[],
  start: number,
  end: number,
  replacements: readonly RichContentInlineNode[],
): RichContentInlineNode[] {
  const length = richContentInlineText(nodes).length;

  return normalizeNodes([
    ...sliceNodes(nodes, 0, start),
    ...replacements.map(cloneNode),
    ...sliceNodes(nodes, end, length),
  ]);
}

function sliceNodes(
  nodes: readonly RichContentInlineNode[],
  start: number,
  end: number,
): RichContentInlineNode[] {
  if (start === end) return [];

  const result: RichContentInlineNode[] = [];
  let offset = 0;

  for (const node of nodes) {
    const nodeEnd = offset + node.text.length;
    const sliceStart = Math.max(start, offset);
    const sliceEnd = Math.min(end, nodeEnd);

    if (sliceStart < sliceEnd) {
      result.push(cloneNodeWithText(
        node,
        node.text.slice(sliceStart - offset, sliceEnd - offset),
      ));
    }
    offset = nodeEnd;
  }

  return result;
}

function assertTargetSelection(
  nodes: readonly RichContentInlineNode[],
  start: number,
  end: number,
  type: RichContentInlineTargetType,
): void {
  assertNonEmptyRange(nodes, start, end);
  const selectedNodes = sliceNodes(nodes, start, end);
  if (selectedNodes.some((node) => node.type !== 'text' && node.type !== type)) {
    throw new Error('Inline formats cannot overlap');
  }
  if (
    selectedNodes.some((node) => node.type === type) &&
    !isExactTargetSelection(nodes, start, end, type)
  ) {
    throw new Error('An interactive selection cannot partially overlap another target');
  }
}

function isExactTargetSelection(
  nodes: readonly RichContentInlineNode[],
  start: number,
  end: number,
  type: RichContentInlineTargetType,
): boolean {
  let offset = 0;

  for (const node of nodes) {
    const nodeEnd = offset + node.text.length;
    if (node.type === type && start === offset && end === nodeEnd) {
      return true;
    }
    offset = nodeEnd;
  }

  return false;
}

function normalizeNodes(
  nodes: readonly RichContentInlineNode[],
): RichContentInlineNode[] {
  const result: RichContentInlineNode[] = [];

  for (const node of nodes) {
    if (!node.text) continue;

    const previous = result.at(-1);
    if (previous && richContentNodesHaveSameFormat(previous, node)) {
      previous.text += node.text;
    } else {
      result.push(cloneNode(node));
    }
  }

  return result;
}

function richContentNodesHaveSameFormat(
  left: RichContentInlineNode,
  right: RichContentInlineNode,
): boolean {
  if (left.type !== right.type) return false;
  if (left.type === 'dialog' && right.type === 'dialog') {
    return left.dialog === right.dialog;
  }
  if (left.type !== 'link' || right.type !== 'link') return true;

  return left.href === right.href &&
    (left.external ?? false) === (right.external ?? false);
}

function cloneNode(node: RichContentInlineNode): RichContentInlineNode {
  return cloneNodeWithText(node, node.text);
}

function cloneNodeWithText(
  node: RichContentInlineNode,
  text: string,
): RichContentInlineNode {
  return { ...node, text };
}

function assertNonEmptyRange(
  nodes: readonly RichContentInlineNode[],
  start: number,
  end: number,
): void {
  assertRichContentInlineRange(nodes, start, end);
  if (start === end) throw new RangeError('Inline selection cannot be empty');
}

export function assertRichContentInlineRange(
  nodes: readonly RichContentInlineNode[],
  start: number,
  end: number,
): void {
  const length = richContentInlineText(nodes).length;
  if (start < 0 || end < start || end > length) {
    throw new RangeError(`Invalid inline selection: ${start}-${end}`);
  }
}
