import type { RichContent, RichContentBlock } from '../../types/rich-content';
import type {
  RichContentEditorBlock,
  RichContentEditorValue,
} from '../../types/rich-content-editor-value';
import type { RichContentMarkupIssue } from '../../types/rich-content-markup';
import { isRecord } from '../../utils/is-record';
import { normalizeRichContent } from './rich-content';
import { parseInlineMarkup } from './rich-content-inline-markup';
import { serializeRichContentInlineMarkup } from './rich-content-markup-source';

export function createRichContentEditorValue(content: RichContent): RichContentEditorValue {
  const mapBlock = (block: RichContentBlock): RichContentEditorBlock => {
    if (block.type === 'paragraph') {
      return { type: block.type, content: serializeRichContentInlineMarkup(block.content ?? []) };
    }
    return {
      type: block.type,
      items: block.items.map((item) => ({
        content: serializeRichContentInlineMarkup(item.content ?? []),
        ...(item.blocks ? { blocks: item.blocks.map(mapBlock) } : {}),
      })),
    };
  };

  return {
    sections: normalizeRichContent(content).sections.map((section) => ({
      ...(section.title === undefined ? {} : { title: section.title }),
      blocks: section.blocks.map(mapBlock),
    })),
  };
}

export function parseRichContentEditorValue(value: RichContentEditorValue): {
  content: RichContent;
  issues: RichContentMarkupIssue[];
} {
  const issues: RichContentMarkupIssue[] = [];
  const parseSource = (source: string) => {
    const parsed = parseInlineMarkup(source);
    issues.push(...parsed.issues);
    return parsed.nodes;
  };
  const mapBlock = (block: RichContentEditorBlock): RichContentBlock => {
    if (block.type === 'paragraph') {
      return { type: block.type, content: parseSource(block.content) };
    }
    return {
      type: block.type,
      items: block.items.map((item) => ({
        content: parseSource(item.content),
        ...(item.blocks ? { blocks: item.blocks.map(mapBlock) } : {}),
      })),
    };
  };

  return {
    content: {
      sections: value.sections.map((section) => ({
        ...(section.title === undefined ? {} : { title: section.title }),
        blocks: section.blocks.map(mapBlock),
      })),
    },
    issues,
  };
}

export function isRichContentEditorValue(value: unknown): value is RichContentEditorValue {
  return isRecord(value) && Array.isArray(value['sections']) &&
    value['sections'].every((section: unknown) =>
      isRecord(section) &&
      (section['title'] === undefined || typeof section['title'] === 'string') &&
      isEditorBlocks(section['blocks'])
    );
}

function isEditorBlocks(value: unknown): value is RichContentEditorBlock[] {
  return Array.isArray(value) && value.every((block: unknown) => {
    if (!isRecord(block)) return false;
    if (block['type'] === 'paragraph') return typeof block['content'] === 'string';
    return (block['type'] === 'ordered-list' || block['type'] === 'unordered-list') &&
      Array.isArray(block['items']) && block['items'].every((item: unknown) =>
        isRecord(item) && typeof item['content'] === 'string' &&
        (item['blocks'] === undefined || isEditorBlocks(item['blocks']))
      );
  });
}
