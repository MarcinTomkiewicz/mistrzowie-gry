import type { FormControl } from '@angular/forms';

import type { NumericInterval } from './interval';
import type { RichContent, RichContentInlineNode } from './rich-content';

export type RichContentEditorControl = FormControl<RichContent>;

export type RichContentTextInput = NumericInterval & {
  inputType: string;
  value: string;
};

export type RichContentInlineReplacement = NumericInterval & {
  text: string;
};

export type RichContentLinkRange = NumericInterval & {
  text: string;
  href: string;
  external: boolean;
};

export type RichContentInlineHistoryState = {
  nodes: RichContentInlineNode[];
  selection: NumericInterval;
};

export type RichContentLinkEditTarget = NumericInterval & {
  existing: boolean;
};
