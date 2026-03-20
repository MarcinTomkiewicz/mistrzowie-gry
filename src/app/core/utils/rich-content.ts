import {
  RichContent,
  RichContentBlock,
  RichContentInput,
  RichContentOrderedListBlock,
  RichContentSection,
  RichContentUnorderedListBlock,
} from '../../core/types/rich-content';

export function isRichContent(value: RichContentInput): value is RichContent {
  return !!value && typeof value === 'object' && 'sections' in value;
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

export function normalizePlainText(value: string): string {
  return value.replace(/\r\n/g, '\n').trim();
}

export function parsePlainTextToRichContent(text: string): RichContent {
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
      text: line.replace(orderedPattern, '').trim(),
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
      text: line.replace(unorderedPattern, '').trim(),
    })),
  };
}

function parseParagraph(chunk: string): RichContentBlock {
  return {
    type: 'paragraph',
    text: splitLines(chunk).join('\n'),
  };
}

function splitLines(chunk: string): string[] {
  return chunk
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}