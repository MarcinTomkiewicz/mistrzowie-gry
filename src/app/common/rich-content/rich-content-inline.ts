import { Component, input } from '@angular/core';

import type { RichContentInlineNode } from '../../core/types/rich-content';

@Component({
  selector: 'app-rich-content-inline',
  templateUrl: './rich-content-inline.html',
})
export class RichContentInline {
  readonly nodes = input.required<readonly RichContentInlineNode[]>();
}
