import { Component, input } from '@angular/core';

import type {
  CommercialTextAlign,
} from '../../../core/types/commercial-page-builder';

@Component({
  selector: 'app-commercial-section-header',
  template: `
    @if (heading() || lead()) {
      <header
        class="mg-section__header w-100"
        [class.text-left]="textAlign() === 'left'"
        [class.text-center]="textAlign() === 'center'"
        [class.text-right]="textAlign() === 'right'"
      >
        @if (heading()) {
          <h2 class="mg-section__title">{{ heading() }}</h2>
        }

        @if (lead()) {
          <p class="mg-section__subtitle mg-section__subtitle--full w-100">
            {{ lead() }}
          </p>
        }
      </header>
    }
  `,
})
export class CommercialSectionHeader {
  readonly heading = input.required<string | null>();
  readonly lead = input.required<string | null>();
  readonly textAlign = input.required<CommercialTextAlign>();
}
