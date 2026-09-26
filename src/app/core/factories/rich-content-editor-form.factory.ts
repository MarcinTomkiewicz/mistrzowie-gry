import { FormControl } from '@angular/forms';

import {
  normalizeRichContent,
  hasRichContent,
  resolveRichContent,
} from '../domain/rich-content/rich-content';
import {
  createRichContentEditorValue,
  parseRichContentEditorValue,
} from '../domain/rich-content/rich-content-editor-value';
import { parseInlineMarkup } from '../domain/rich-content/rich-content-inline-markup';
import { serializeRichContentInlineMarkup } from '../domain/rich-content/rich-content-markup-source';
import type { RichContentEditorControl } from '../types/rich-content-editor';
import type { RichContent, RichContentInlineNode, RichContentInput } from '../types/rich-content';
import {
  richContentInlineSourceValidator,
  richContentValidator,
} from '../validators/rich-content.validator';

export function createRichContentInlineEditorControl(
  nodes: readonly RichContentInlineNode[],
): FormControl<string> {
  return new FormControl(serializeRichContentInlineMarkup(nodes), {
    nonNullable: true,
    validators: [richContentInlineSourceValidator()],
  });
}

export function mapRichContentInlineEditorControl(
  control: FormControl<string>,
): RichContentInlineNode[] {
  const parsed = parseInlineMarkup(control.getRawValue());
  if (parsed.issues.length) throw new Error('Invalid RichContent source markup');
  return parsed.nodes;
}

export function createRichContentEditorControl(
  content: RichContentInput,
  required: boolean,
): RichContentEditorControl {
  return new FormControl(
    createRichContentEditorValue(normalizeContent(resolveRichContent(content), required)),
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
  const parsed = parseRichContentEditorValue(control.getRawValue());
  if (parsed.issues.length) throw new Error('Invalid RichContent source markup');
  const content = normalizeContent(parsed.content, required);

  if (!hasRichContent(content) && !required) return null;

  return content;
}

function normalizeContent(
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
