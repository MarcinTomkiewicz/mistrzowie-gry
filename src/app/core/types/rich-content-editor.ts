import type { FormControl } from '@angular/forms';

import type { NumericInterval } from './interval';
import type { RichContentInlineTargetType } from './rich-content';
import type { RichContentEditorValue } from './rich-content-editor-value';

export type RichContentEditorControl = FormControl<RichContentEditorValue>;

export type RichContentEditorIssue = {
  messageKey: string;
  path: readonly string[];
};

export type RichContentInlineEditTarget = NumericInterval & {
  existing: boolean;
  type: RichContentInlineTargetType;
};
