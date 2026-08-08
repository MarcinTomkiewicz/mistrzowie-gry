import { Component, computed, input, signal } from '@angular/core';

import { provideTranslocoScope } from '@jsverse/transloco';
import { ButtonModule } from 'primeng/button';

import { createCommonCtaI18n } from '../../../core/translations/common.i18n';

const EXPANDABLE_TEXT_THRESHOLD = 180;

@Component({
  selector: 'app-expandable-text',
  imports: [ButtonModule],
  host: { class: 'd-block' },
  templateUrl: './expandable-text.html',
  providers: [provideTranslocoScope('common')],
})
export class ExpandableText {
  readonly text = input.required<string | null | undefined>();
  readonly muted = input(false);
  readonly icon = input<string | undefined>('pi pi-lever');

  protected readonly cta = createCommonCtaI18n();
  protected readonly expanded = signal(false);
  protected readonly expandable = computed(
    () => (this.text()?.trim().length ?? 0) > EXPANDABLE_TEXT_THRESHOLD,
  );
  protected readonly collapsed = computed(
    () => this.expandable() && !this.expanded(),
  );

  protected toggle(): void {
    this.expanded.update((expanded) => !expanded);
  }
}
