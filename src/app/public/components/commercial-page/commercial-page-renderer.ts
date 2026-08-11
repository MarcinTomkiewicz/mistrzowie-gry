import { Component, computed, input } from '@angular/core';
import { provideTranslocoScope } from '@jsverse/transloco';

import { createCommonCtaI18n } from '../../../core/translations/common.i18n';
import type { BreadcrumbItem } from '../../../core/types/breadcrumb';
import type {
  CommercialPageBuilderDocument,
} from '../../../core/types/commercial-page-builder';
import { formatDateLabel } from '../../../core/utils/date';
import { Breadcrumbs } from '../../common/breadcrumbs/breadcrumbs';
import { CommercialPageSection } from './commercial-page-section';
import { createCommercialPageI18n } from './commercial-page.i18n';

@Component({
  selector: 'app-commercial-page-renderer',
  imports: [Breadcrumbs, CommercialPageSection],
  templateUrl: './commercial-page-renderer.html',
  providers: [
    provideTranslocoScope('commercialPages', 'offers', 'common'),
  ],
})
export class CommercialPageRenderer {
  readonly document = input.required<CommercialPageBuilderDocument>();

  protected readonly i18n = createCommercialPageI18n();
  private readonly commonCta = createCommonCtaI18n();

  protected readonly breadcrumbs = computed<BreadcrumbItem[]>(() => [
    { label: this.commonCta().goHome, path: '/' },
    { label: this.document().page.heading },
  ]);

  protected readonly effectiveFrom = computed(() => {
    const effectiveFrom = this.document().page.effectiveFrom;

    return effectiveFrom
      ? formatDateLabel(effectiveFrom, this.document().page.locale)
      : null;
  });

  protected readonly pricingFootnote = computed(() => {
    const footnotes = this.i18n.footnotes();

    switch (this.document().page.taxDisplayMode) {
      case 'gross':
        return footnotes.gross;
      case 'net':
        return footnotes.net;
      case 'audience_dependent':
        return footnotes.both;
      case 'none':
        return null;
    }
  });
}
