import type {
  AbstractControl,
  ValidationErrors,
  ValidatorFn,
} from '@angular/forms';

import type {
  RichContent,
  RichContentBlock,
  RichContentInlineNode,
} from '../types/rich-content';
import { hasRichContent } from '../domain/rich-content/rich-content';
import { isRichContent } from '../domain/rich-content/rich-content.guard';

export function richContentValidator(required: boolean): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value: unknown = control.value;

    if (!isRichContent(value)) return { richContent: true };
    if (hasInvalidRichContentLink(value)) return { richContentLink: true };

    return required && !hasRichContent(value) ? { richContent: true } : null;
  };
}

function hasInvalidRichContentLink(content: RichContent): boolean {
  return content.sections.some((section) =>
    section.blocks.some(hasInvalidBlockLink),
  );
}

function hasInvalidBlockLink(block: RichContentBlock): boolean {
  if (block.type === 'paragraph') {
    return hasInvalidInlineLink(block.content);
  }

  return block.items.some((item) =>
    hasInvalidInlineLink(item.content) ||
    item.blocks?.some(hasInvalidBlockLink),
  );
}

function hasInvalidInlineLink(
  nodes: RichContentInlineNode[] | undefined,
): boolean {
  return nodes?.some((node) =>
    node.type === 'link' && !node.href.trim()
  ) ?? false;
}
