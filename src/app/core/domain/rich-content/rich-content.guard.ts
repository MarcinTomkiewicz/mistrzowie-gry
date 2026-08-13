import type {
  RichContent,
  RichContentBlock,
  RichContentSection,
} from '../../types/rich-content';
import { isRecord } from '../../utils/is-record';

export function isRichContent(value: unknown): value is RichContent {
  return isRecord(value) &&
    Array.isArray(value['sections']) &&
    value['sections'].every(isRichContentSection);
}

function isRichContentSection(value: unknown): value is RichContentSection {
  return isRecord(value) &&
    isOptionalString(value['title']) &&
    Array.isArray(value['blocks']) &&
    value['blocks'].every(isRichContentBlock);
}

function isRichContentBlock(value: unknown): value is RichContentBlock {
  if (!isRecord(value)) return false;

  switch (value['type']) {
    case 'paragraph':
      return isOptionalString(value['text']) &&
        isOptionalInlineNodes(value['content']);
    case 'ordered-list':
    case 'unordered-list':
      return Array.isArray(value['items']) &&
        value['items'].every(isRichContentListItem);
    default:
      return false;
  }
}

function isRichContentListItem(value: unknown): boolean {
  return isRecord(value) &&
    isOptionalString(value['text']) &&
    isOptionalInlineNodes(value['content']) &&
    (value['blocks'] === undefined ||
      (Array.isArray(value['blocks']) &&
        value['blocks'].every(isRichContentBlock)));
}

function isOptionalInlineNodes(value: unknown): boolean {
  return value === undefined ||
    (Array.isArray(value) && value.every(isRichContentInlineNode));
}

function isRichContentInlineNode(value: unknown): boolean {
  if (!isRecord(value) || typeof value['text'] !== 'string') return false;

  switch (value['type']) {
    case 'text':
    case 'strong':
      return true;
    case 'link':
      return typeof value['href'] === 'string' &&
        (value['external'] === undefined ||
          typeof value['external'] === 'boolean');
    default:
      return false;
  }
}

function isOptionalString(value: unknown): boolean {
  return value === undefined || typeof value === 'string';
}
