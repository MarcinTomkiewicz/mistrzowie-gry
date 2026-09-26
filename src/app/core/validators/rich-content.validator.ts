import type {
  AbstractControl,
  ValidationErrors,
  ValidatorFn,
} from '@angular/forms';

import { hasRichContent } from '../domain/rich-content/rich-content';
import { parseInlineMarkup } from '../domain/rich-content/rich-content-inline-markup';
import {
  isRichContentEditorValue,
  parseRichContentEditorValue,
} from '../domain/rich-content/rich-content-editor-value';

export function richContentInlineSourceValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value: unknown = control.value;
    if (typeof value !== 'string') return { richContent: true };

    const parsed = parseInlineMarkup(value);
    if (parsed.issues.length) return { richContentSource: true };

    return parsed.nodes.some((node) => node.text.trim()) ? null : { richContent: true };
  };
}

export function richContentValidator(required: boolean): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value: unknown = control.value;

    if (!isRichContentEditorValue(value)) return { richContent: true };

    const parsed = parseRichContentEditorValue(value);
    if (parsed.issues.length) {
      return {
        richContentSource: true,
        ...(parsed.issues.some((issue) => issue.messageKey === 'invalidLink')
          ? { richContentLink: true } : {}),
      };
    }
    return required && !hasRichContent(parsed.content) ? { richContent: true } : null;
  };
}
