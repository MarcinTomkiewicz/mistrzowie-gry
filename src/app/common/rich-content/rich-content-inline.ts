import { Component, inject, input } from '@angular/core';

import { LegalDialogs } from '../../core/services/legal-dialogs/legal-dialogs';
import type { RichContentInlineNode } from '../../core/types/rich-content';

@Component({
  selector: 'app-rich-content-inline',
  templateUrl: './rich-content-inline.html',
})
export class RichContentInline {
  readonly nodes = input.required<readonly RichContentInlineNode[]>();
  protected readonly legalDialogs = inject(LegalDialogs);
}
