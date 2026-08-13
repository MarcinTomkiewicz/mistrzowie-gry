import type { RichContentInlineNode } from '../../types/rich-content';

export function richContentInlineText(
  nodes: readonly RichContentInlineNode[],
): string {
  return nodes.map((node) => node.text).join('');
}

export function updateRichContentInlineText(
  nodes: readonly RichContentInlineNode[],
  start: number,
  end: number,
  text: string,
): RichContentInlineNode[] {
  assertRichContentInlineRange(nodes, start, end);

  const source = text ? sourceNodeForEdit(nodes, start, end) : null;
  const replacement: RichContentInlineNode[] = source
    ? [cloneNodeWithText(source, text)]
    : text
      ? [{ type: 'text', text }]
      : [];

  return normalizeNodes([
    ...sliceNodes(nodes, 0, start),
    ...replacement,
    ...sliceNodes(nodes, end, richContentInlineText(nodes).length),
  ]);
}

export function toggleRichContentStrong(
  nodes: readonly RichContentInlineNode[],
  start: number,
  end: number,
): RichContentInlineNode[] {
  assertNonEmptyRange(nodes, start, end);
  const selectedNodes = sliceNodes(nodes, start, end);

  if (selectedNodes.some((node) => node.type === 'link')) {
    throw new Error('A link selection cannot also be formatted as strong');
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
  assertNonEmptyRange(nodes, start, end);
  const normalizedHref = href.trim();
  if (!normalizedHref) throw new Error('A RichContent link requires an href');

  const selectedNodes = sliceNodes(nodes, start, end);
  if (selectedNodes.some((node) => node.type === 'strong')) {
    throw new Error('A strong selection cannot also be formatted as a link');
  }

  if (
    selectedNodes.some((node) => node.type === 'link') &&
    !isExactLinkSelection(nodes, start, end)
  ) {
    throw new Error('A link selection cannot partially overlap another link');
  }

  const text = richContentInlineText(nodes).slice(start, end);
  return replaceNodesInRange(nodes, start, end, [
    { type: 'link', text, href: normalizedHref, external },
  ]);
}

export function removeRichContentLink(
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

function sourceNodeForEdit(
  nodes: readonly RichContentInlineNode[],
  start: number,
  end: number,
): RichContentInlineNode | null {
  let offset = 0;

  for (const node of nodes) {
    const nodeEnd = offset + node.text.length;
    const contained = start === end
      ? start > offset && end < nodeEnd
      : start >= offset && end <= nodeEnd;
    if (contained) return node;
    offset = nodeEnd;
  }

  return null;
}

function isExactLinkSelection(
  nodes: readonly RichContentInlineNode[],
  start: number,
  end: number,
): boolean {
  let offset = 0;

  for (const node of nodes) {
    const nodeEnd = offset + node.text.length;
    if (node.type === 'link' && start === offset && end === nodeEnd) {
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
    if (previous && nodesHaveSameFormat(previous, node)) {
      previous.text += node.text;
    } else {
      result.push(cloneNode(node));
    }
  }

  return result;
}

function nodesHaveSameFormat(
  left: RichContentInlineNode,
  right: RichContentInlineNode,
): boolean {
  if (left.type !== right.type) return false;
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
  if (node.type === 'link') {
    return {
      type: 'link',
      text,
      href: node.href,
      ...(node.external === undefined ? {} : { external: node.external }),
    };
  }

  return { type: node.type, text };
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
