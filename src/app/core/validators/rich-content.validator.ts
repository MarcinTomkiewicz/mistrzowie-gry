import type {
  AbstractControl,
  ValidationErrors,
  ValidatorFn,
} from '@angular/forms';

import { hasRichContent } from '../domain/rich-content/rich-content';
import {
  isRichContentEditorValue,
  parseRichContentEditorValue,
} from '../domain/rich-content/rich-content-editor-value';

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
