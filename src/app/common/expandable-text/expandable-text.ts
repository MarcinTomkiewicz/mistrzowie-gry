import { Component, computed, input, signal } from '@angular/core';

import { provideTranslocoScope } from '@jsverse/transloco';
import { ButtonModule } from 'primeng/button';

import { EXPANDABLE_TEXT_THRESHOLD } from './expandable-text.config';
import { richContentLength } from '../../core/domain/rich-content/rich-content';
import { createCommonCtaI18n } from '../../core/translations/common.i18n';
import type {
  RichContent as RichContentModel,
} from '../../core/types/rich-content';
import { RichContent } from '../rich-content/rich-content';

@Component({
  selector: 'app-expandable-text',
  imports: [ButtonModule, RichContent],
  host: { class: 'd-block' },
  templateUrl: './expandable-text.html',
  providers: [provideTranslocoScope('common')],
})
export class ExpandableText {
  readonly text = input<string | null | undefined>(null);
  readonly richContent = input<RichContentModel | null>(null);
  readonly muted = input(false);
  readonly icon = input<string | undefined>('pi pi-lever');

  protected readonly cta = createCommonCtaI18n();
  protected readonly expanded = signal(false);
  protected readonly expandable = computed(
    () => this.contentLength() > EXPANDABLE_TEXT_THRESHOLD,
  );
  protected readonly collapsed = computed(
    () => this.expandable() && !this.expanded(),
  );

  protected toggle(): void {
    this.expanded.update((expanded) => !expanded);
  }

  private contentLength(): number {
    const richContent = this.richContent();
    return richContent
      ? richContentLength(richContent)
      : (this.text()?.trim().length ?? 0);
  }
}
