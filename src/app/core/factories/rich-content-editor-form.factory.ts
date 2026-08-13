import { FormControl } from '@angular/forms';

import {
  normalizeRichContent,
  hasRichContent,
  resolveRichContent,
} from '../domain/rich-content/rich-content';
import type { RichContentEditorControl } from '../types/rich-content-editor';
import type { RichContent, RichContentInput } from '../types/rich-content';
import { richContentValidator } from '../validators/rich-content.validator';

export function createRichContentEditorControl(
  content: RichContentInput,
  required: boolean,
): RichContentEditorControl {
  return new FormControl(
    normalizeEditorContent(resolveRichContent(content), required),
    {
      nonNullable: true,
      validators: [richContentValidator(required)],
    },
  );
}

export function mapRichContentEditorControl(
  control: RichContentEditorControl,
  required: true,
): RichContent;
export function mapRichContentEditorControl(
  control: RichContentEditorControl,
  required: false,
): RichContent | null;
export function mapRichContentEditorControl(
  control: RichContentEditorControl,
  required: boolean,
): RichContent | null {
  const content = normalizeEditorContent(control.getRawValue(), required);

  if (!hasRichContent(content) && !required) return null;

  return content;
}

function normalizeEditorContent(
  content: RichContent | null,
  required: boolean,
): RichContent {
  const value = normalizeRichContent(content ??
    (required
      ? {
          sections: [{ blocks: [{ type: 'paragraph', content: [] }] }],
        }
      : { sections: [] }));

  return {
    sections: value.sections.map((section) => ({
      ...(section.title?.trim() ? { title: section.title.trim() } : {}),
      blocks: section.blocks,
    })),
  };
}
