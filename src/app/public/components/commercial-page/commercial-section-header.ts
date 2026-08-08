import { Component, input } from '@angular/core';

@Component({
  selector: 'app-commercial-section-header',
  template: `
    @if (heading() || lead()) {
      <header class="mg-section__header">
        @if (heading()) {
          <h2 class="mg-section__title">{{ heading() }}</h2>
        }

        @if (lead()) {
          <p class="mg-section__subtitle">{{ lead() }}</p>
        }
      </header>
    }
  `,
})
export class CommercialSectionHeader {
  readonly heading = input.required<string | null>();
  readonly lead = input.required<string | null>();
}
