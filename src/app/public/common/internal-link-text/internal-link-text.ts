import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { parseInternalLinkText } from '../../../core/utils/rich-content';

@Component({
  selector: 'app-internal-link-text',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './internal-link-text.html',
})
export class InternalLinkText {
  readonly text = input.required<string>();

  protected readonly nodes = computed(() =>
    parseInternalLinkText(this.text()),
  );
}
