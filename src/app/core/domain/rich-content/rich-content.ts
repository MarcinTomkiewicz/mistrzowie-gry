import type {
  RichContent,
  RichContentBlock,
  RichContentInlineNode,
  RichContentInput,
  RichContentListItem,
} from '../../types/rich-content';
import { isRichContent } from './rich-content.guard';
import { parseLegacyRichContent } from './rich-content-legacy-parser';

export function resolveRichContent(value: RichContentInput): RichContent | null {
  if (value === null || value === undefined) return null;
  if (typeof value === 'string') return parseLegacyRichContent(value);
  if (!isRichContent(value)) throw new Error('Invalid RichContent');

  return normalizeRichContent(value);
}

export function normalizeRichContent(content: RichContent): RichContent {
  return {
    sections: content.sections.map((section) => ({
      ...(section.title === undefined ? {} : { title: section.title }),
      blocks: section.blocks.map(normalizeBlock),
    })),
  };
}

export function hasRichContent(content: RichContent): boolean {
  return normalizeRichContent(content).sections.some((section) =>
    !!section.title?.trim() || section.blocks.some(hasBlockContent),
  );
}

export function richContentLength(content: RichContent): number {
  return normalizeRichContent(content).sections.reduce(
    (length, section) =>
      length +
      (section.title?.length ?? 0) +
      section.blocks.reduce(
        (blocksLength, block) => blocksLength + blockLength(block),
        0,
      ),
    0,
  );
}

function normalizeBlock(block: RichContentBlock): RichContentBlock {
  if (block.type === 'paragraph') {
    return {
      type: 'paragraph',
      content: normalizeInlineNodes(block.content, block.text),
    };
  }

  return {
    type: block.type,
    items: block.items.map(normalizeListItem),
  };
}

function normalizeListItem(item: RichContentListItem): RichContentListItem {
  return {
    content: normalizeInlineNodes(item.content, item.text),
    ...(item.blocks?.length
      ? { blocks: item.blocks.map(normalizeBlock) }
      : {}),
  };
}

function normalizeInlineNodes(
  content: RichContentInlineNode[] | undefined,
  text: string | undefined,
): RichContentInlineNode[] {
  return (content ?? (text === undefined ? [] : [{ type: 'text', text }]))
    .map((node) => ({ ...node }));
}

function hasBlockContent(block: RichContentBlock): boolean {
  if (block.type === 'paragraph') return hasInlineContent(block.content);

  return block.items.some((item) =>
    hasInlineContent(item.content) || item.blocks?.some(hasBlockContent),
  );
}

function hasInlineContent(nodes: RichContentInlineNode[] | undefined): boolean {
  return nodes?.some((node) => !!node.text.trim()) ?? false;
}

function blockLength(block: RichContentBlock): number {
  if (block.type === 'paragraph') return inlineLength(block.content);

  return block.items.reduce(
    (length, item) => length + listItemLength(item),
    0,
  );
}

function listItemLength(item: RichContentListItem): number {
  return inlineLength(item.content) +
    (item.blocks?.reduce(
      (length, block) => length + blockLength(block),
      0,
    ) ?? 0);
}

function inlineLength(nodes: RichContentInlineNode[] | undefined): number {
  return nodes?.reduce((length, node) => length + node.text.length, 0) ?? 0;
}
