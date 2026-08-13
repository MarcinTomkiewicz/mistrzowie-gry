import { NgTemplateOutlet } from '@angular/common';
import { Component, computed, input } from '@angular/core';

import { resolveRichContent } from '../../core/domain/rich-content/rich-content';
import type { RichContentInput } from '../../core/types/rich-content';
import { RichContentInline } from './rich-content-inline';

@Component({
  selector: 'app-rich-content',
  standalone: true,
  imports: [NgTemplateOutlet, RichContentInline],
  templateUrl: './rich-content.html',
})
export class RichContent {
  readonly content = input<RichContentInput>(null);

  protected readonly sections = computed(
    () => resolveRichContent(this.content())?.sections ?? [],
  );
}
