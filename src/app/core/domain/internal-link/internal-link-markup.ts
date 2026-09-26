import type { InternalLinkMarkupNode } from '../../types/internal-link';
import { parseInlineMarkup } from '../rich-content/rich-content-inline-markup';

export function parseInternalLinkText(value: string): InternalLinkMarkupNode[] {
  return parseInlineMarkup(value, 'internal-link').nodes;
}

export function hasInvalidInternalLinkSyntax(value: string): boolean {
  return parseInlineMarkup(value, 'internal-link').issues.length > 0;
}
