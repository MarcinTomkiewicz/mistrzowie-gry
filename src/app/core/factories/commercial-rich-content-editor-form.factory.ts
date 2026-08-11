import { FormControl } from '@angular/forms';

import type { CommercialRichContentEditorControl } from '../types/commercial-rich-content-editor-form';
import type { RichContent } from '../types/rich-content';
import {
  commercialRichContentValidator,
  hasCommercialRichContent,
} from '../validators/commercial-builder-editor.validator';

export function createCommercialRichContentEditorControl(
  content: RichContent | null,
  required: boolean,
): CommercialRichContentEditorControl {
  return new FormControl(normalizeRichContent(content), {
    nonNullable: true,
    validators: [commercialRichContentValidator(required)],
  });
}

export function mapCommercialRichContentEditorControl(
  control: CommercialRichContentEditorControl,
  required: true,
): RichContent;
export function mapCommercialRichContentEditorControl(
  control: CommercialRichContentEditorControl,
  required: false,
): RichContent | null;
export function mapCommercialRichContentEditorControl(
  control: CommercialRichContentEditorControl,
  required: boolean,
): RichContent | null {
  const content = normalizeRichContent(control.getRawValue());

  if (!hasCommercialRichContent(content)) {
    if (required) {
      throw new TypeError('RichContent must contain visible text.');
    }

    return null;
  }

  return content;
}

function normalizeRichContent(content: RichContent | null): RichContent {
  const value = content ?? {
    sections: [{ blocks: [{ type: 'paragraph', content: [] }] }],
  } satisfies RichContent;

  return {
    sections: value.sections.map((section) => ({
      ...(section.title?.trim() ? { title: section.title.trim() } : {}),
      blocks: section.blocks.map(normalizeBlock),
    })),
  };
}

function normalizeBlock(
  block: RichContent['sections'][number]['blocks'][number],
): RichContent['sections'][number]['blocks'][number] {
  if (block.type === 'paragraph') {
    return {
      type: 'paragraph',
      content: block.content?.map((node) => ({ ...node })) ??
        (block.text === undefined ? [] : [{ type: 'text', text: block.text }]),
    };
  }

  return {
    type: block.type,
    items: block.items.map((item) => ({
      content: item.content?.map((node) => ({ ...node })) ??
        (item.text === undefined ? [] : [{ type: 'text', text: item.text }]),
      ...(item.blocks?.length
        ? { blocks: item.blocks.map(normalizeBlock) }
        : {}),
    })),
  };
}
