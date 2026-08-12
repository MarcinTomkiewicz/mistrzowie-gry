import type {
  RichContent,
  RichContentBlock,
  RichContentInput,
  RichContentLinkNode,
  RichContentOrderedListBlock,
  RichContentSection,
  RichContentTextNode,
  RichContentUnorderedListBlock,
} from '../types/rich-content';

const INTERNAL_LINK_OPEN = '[url=';
const INTERNAL_LINK_CLOSE = '[/url]';
const INTERNAL_LINK_BASE_URL = 'https://internal.invalid';

function isRichContent(value: RichContentInput): value is RichContent {
  return !!value && typeof value === 'object' && 'sections' in value;
}

export function parseInternalLinkText(
  value: string,
): Array<RichContentTextNode | RichContentLinkNode> {
  return parseInternalLinkMarkup(value).nodes;
}

export function hasInvalidInternalLinkSyntax(value: string): boolean {
  return !parseInternalLinkMarkup(value).isValid;
}

export function resolveRichContent(value: RichContentInput): RichContent | null {
  if (isRichContent(value)) {
    return value;
  }

  if (typeof value !== 'string') {
    return null;
  }

  const normalized = normalizePlainText(value);

  if (!normalized) {
    return null;
  }

  return parsePlainTextToRichContent(normalized);
}

function normalizePlainText(value: string): string {
  return value.replace(/\r\n/g, '\n').trim();
}

function parsePlainTextToRichContent(text: string): RichContent {
  const chunks = text
    .split(/\n{2,}/)
    .map((chunk) => chunk.trim())
    .filter(Boolean);

  if (!chunks.length) {
    return { sections: [] };
  }

  const sections: RichContentSection[] = [];
  let currentSection: RichContentSection = { blocks: [] };

  for (const chunk of chunks) {
    if (isArticleHeading(chunk)) {
      if (currentSection.title || currentSection.blocks.length) {
        sections.push(currentSection);
      }

      currentSection = {
        title: chunk,
        blocks: [],
      };

      continue;
    }

    const block =
      parseOrderedList(chunk) ??
      parseUnorderedList(chunk) ??
      parseParagraph(chunk);

    currentSection.blocks.push(block);
  }

  if (currentSection.title || currentSection.blocks.length) {
    sections.push(currentSection);
  }

  return { sections };
}

function isArticleHeading(chunk: string): boolean {
  return !chunk.includes('\n') && /^art\.\s*\d+[a-z0-9.\-:)]*/i.test(chunk);
}

function parseOrderedList(chunk: string): RichContentOrderedListBlock | null {
  const lines = splitLines(chunk);
  const orderedPattern = /^\d+[.)]\s+/;

  if (!lines.length || !lines.every((line) => orderedPattern.test(line))) {
    return null;
  }

  return {
    type: 'ordered-list',
    items: lines.map((line) => ({
      content: parseInternalLinkText(
        line.replace(orderedPattern, '').trim(),
      ),
    })),
  };
}

function parseUnorderedList(chunk: string): RichContentUnorderedListBlock | null {
  const lines = splitLines(chunk);
  const unorderedPattern = /^[-*•]\s+/;

  if (!lines.length || !lines.every((line) => unorderedPattern.test(line))) {
    return null;
  }

  return {
    type: 'unordered-list',
    items: lines.map((line) => ({
      content: parseInternalLinkText(
        line.replace(unorderedPattern, '').trim(),
      ),
    })),
  };
}

function parseParagraph(chunk: string): RichContentBlock {
  return {
    type: 'paragraph',
    content: parseInternalLinkText(splitLines(chunk).join('\n')),
  };
}

function splitLines(chunk: string): string[] {
  return chunk
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}

function parseInternalLinkMarkup(value: string) {
  const nodes: Array<RichContentTextNode | RichContentLinkNode> = [];
  let cursor = 0;
  let isValid = true;

  while (cursor < value.length) {
    const openIndex = value.indexOf(INTERNAL_LINK_OPEN, cursor);
    const closeIndex = value.indexOf(INTERNAL_LINK_CLOSE, cursor);

    if (
      closeIndex >= 0 &&
      (openIndex < 0 || closeIndex < openIndex)
    ) {
      appendTextNode(
        nodes,
        value.slice(cursor, closeIndex + INTERNAL_LINK_CLOSE.length),
      );
      cursor = closeIndex + INTERNAL_LINK_CLOSE.length;
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
      openIndex + INTERNAL_LINK_OPEN.length,
    );

    if (pathEndIndex < 0) {
      appendTextNode(nodes, value.slice(openIndex));
      isValid = false;
      break;
    }

    const markerEndIndex = value.indexOf(
      INTERNAL_LINK_CLOSE,
      pathEndIndex + 1,
    );

    if (markerEndIndex < 0) {
      appendTextNode(nodes, value.slice(openIndex));
      isValid = false;
      break;
    }

    const path = value.slice(
      openIndex + INTERNAL_LINK_OPEN.length,
      pathEndIndex,
    );
    const anchor = value.slice(pathEndIndex + 1, markerEndIndex);
    const markerEnd = markerEndIndex + INTERNAL_LINK_CLOSE.length;

    if (
      isValidInternalLinkPath(path) &&
      !!anchor.trim() &&
      !anchor.includes(INTERNAL_LINK_OPEN)
    ) {
      nodes.push({
        type: 'link',
        text: anchor,
        href: path,
      });
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

function appendTextNode(
  nodes: Array<RichContentTextNode | RichContentLinkNode>,
  text: string,
): void {
  if (!text) {
    return;
  }

  const previousNode = nodes.at(-1);

  if (previousNode?.type === 'text') {
    previousNode.text += text;
    return;
  }

  nodes.push({
    type: 'text',
    text,
  });
}
