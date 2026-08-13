import { Component, computed, effect, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { provideTranslocoScope } from '@jsverse/transloco';

import { ButtonModule } from 'primeng/button';

import { EVENT_SIGNUP_SELECTION_ROUTE } from '../../../core/configs/event-signup.config';
import { Seo } from '../../../core/services/seo/seo';
import type { BreadcrumbItem } from '../../../core/types/breadcrumb';
import { formatDateLabel } from '../../../core/utils/date';
import { joinTextParts } from '../../../core/utils/normalize-text';
import { Breadcrumbs } from '../../../common/breadcrumbs/breadcrumbs';
import { LoadingOverlay } from '../../../common/loading-overlay/loading-overlay';
import { OccurrenceSwitcher } from '../../../common/occurrence-switcher/occurrence-switcher';
import { EventSignupFormFacade } from './event-signup-form.facade';
import { createEventSignupFormI18n } from './event-signup-form.i18n';
import { EventSignupSessionEditor } from './event-signup-session-editor';

@Component({
  selector: 'app-event-signup-form',
  standalone: true,
  imports: [
    RouterModule,
    ButtonModule,
    Breadcrumbs,
    LoadingOverlay,
    OccurrenceSwitcher,
    EventSignupSessionEditor,
  ],
  templateUrl: './event-signup-form.html',
  styleUrl: './event-signup-form.scss',
  providers: [
    EventSignupFormFacade,
    provideTranslocoScope('eventSignup', 'common', 'sessions'),
  ],
})
export class EventSignupForm {
  private readonly facade = inject(EventSignupFormFacade);
  private readonly seo = inject(Seo);

  readonly i18n = createEventSignupFormI18n();
  readonly eventSignupSelectionRoute = EVENT_SIGNUP_SELECTION_ROUTE;

  readonly isLoading = this.facade.isLoading;
  readonly isBusy = this.facade.isBusy;
  readonly occurrenceOptions = this.facade.occurrenceOptions;
  readonly loadError = this.facade.loadError;
  readonly page = this.facade.page;

  readonly selectedOccurrenceIndex = computed(() => {
    const occurrenceId = this.page().occurrence?.id;
    const options = this.occurrenceOptions();

    if (!occurrenceId || !options.length) {
      return 0;
    }

    const foundIndex = options.findIndex((item) => item.id === occurrenceId);

    return foundIndex > -1 ? foundIndex : 0;
  });

  readonly venueLabel = computed(() => {
    const edition = this.page().edition;

    return edition
      ? joinTextParts([edition.venueName, edition.venueAddress])
      : '';
  });

  readonly breadcrumbs = computed<BreadcrumbItem[]>(() => {
    const page = this.page();

    if (!page.core || !page.edition || !page.occurrence) {
      return [];
    }

    return [
      {
        label: this.i18n.breadcrumbs().eventSignupLabel,
        path: EVENT_SIGNUP_SELECTION_ROUTE,
      },
      {
        label: page.core.name,
      },
      {
        label: page.edition.city,
      },
      {
        label: formatDateLabel(page.occurrence.occurrenceDate, 'pl-PL', true),
      },
    ];
  });

  constructor() {
    effect(() => {
      this.seo.apply({
        title: this.i18n.seo().title,
        description: this.i18n.seo().description,
        canonicalUrl: this.facade.pageUrl(),
        robots: 'noindex,nofollow',
      });
    });
  }

  onOccurrenceSelect(index: number): void {
    this.facade.navigateToOccurrence(index);
  }

  onRetry(): void {
    this.facade.retry();
  }

  formatDateLabel = formatDateLabel;
}
