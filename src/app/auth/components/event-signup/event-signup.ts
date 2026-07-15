import { Component, computed, effect, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { provideTranslocoScope } from '@jsverse/transloco';

import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { TabsModule } from 'primeng/tabs';

import {
  buildEventHostSignupRoute,
  EVENT_SIGNUP_SELECTION_ROUTE,
} from '../../../core/configs/event-signup.config';
import { buildSiteUrl } from '../../../core/config/site';
import {
  EventSignupForm,
  IEventSignupOccurrenceVm,
} from '../../../core/interfaces/i-event-signup';
import { Seo } from '../../../core/services/seo/seo';
import { formatTimeRangeLabel } from '../../../core/utils/time';
import { LoadingOverlay } from '../../../public/common/loading-overlay/loading-overlay';
import { EventSignupPageFacade } from './event-signup.facade';
import { createEventSignupI18n } from './event-signup.i18n';

@Component({
  selector: 'app-event-signup',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    ButtonModule,
    SelectModule,
    TabsModule,
    LoadingOverlay,
  ],
  templateUrl: './event-signup.html',
  styleUrl: './event-signup.scss',
  providers: [
    EventSignupPageFacade,
    provideTranslocoScope('eventSignup', 'common'),
  ],
})
export class EventSignup {
  private readonly facade = inject(EventSignupPageFacade);
  private readonly router = inject(Router);
  private readonly seo = inject(Seo);
  private readonly pageUrl = buildSiteUrl(EVENT_SIGNUP_SELECTION_ROUTE);

  readonly i18n = createEventSignupI18n();

  readonly form: EventSignupForm = new FormGroup({
    coreId: new FormControl<string | null>(null),
    editionId: new FormControl<string | null>(null),
  });

  readonly catalog = this.facade.catalog;
  readonly editions = this.facade.editions;
  readonly occurrences = this.facade.occurrences;
  readonly selectedCore = this.facade.selectedCore;
  readonly selectedEdition = this.facade.selectedEdition;
  readonly isLoading = this.facade.isLoading;
  readonly loadError = this.facade.loadError;

  readonly selectedEditionTimeLabel = computed(() => {
    const edition = this.selectedEdition();

    return edition
      ? formatTimeRangeLabel(edition.startTime, edition.endTime)
      : '';
  });

  private readonly syncSelectionEffect = effect(() => {
    const coreId = this.facade.selectedCoreId();
    const editionId = this.facade.selectedEditionId();

    if (this.form.controls.coreId.value !== coreId) {
      this.form.controls.coreId.setValue(coreId, { emitEvent: false });
    }

    if (this.form.controls.editionId.value !== editionId) {
      this.form.controls.editionId.setValue(editionId, { emitEvent: false });
    }
  });

  private readonly applySeoEffect = effect(() => {
    this.seo.apply({
      title: this.i18n.seo().title,
      description: this.i18n.seo().description,
      canonicalUrl: this.pageUrl,
      robots: 'noindex,nofollow',
    });
  });

  constructor() {
    this.facade.load();
  }

  onCoreChange(coreId: string | number | null | undefined): void {
    if (
      typeof coreId !== 'string' ||
      coreId === this.facade.selectedCoreId()
    ) {
      return;
    }

    this.form.controls.coreId.setValue(coreId, { emitEvent: false });
    this.form.controls.editionId.setValue(null, { emitEvent: false });
    this.facade.selectCore(coreId);
  }

  onEditionChange(editionId: string | null): void {
    if (!editionId) {
      return;
    }

    this.form.controls.editionId.setValue(editionId, { emitEvent: false });
    this.facade.selectEdition(editionId);
  }

  openOccurrence(occurrenceDate: string, canOpen: boolean): void {
    const edition = this.selectedEdition();

    if (!edition || !canOpen) {
      return;
    }

    void this.router.navigate(
      buildEventHostSignupRoute(edition.slug, occurrenceDate),
    );
  }

  onRetry(): void {
    this.facade.retry();
  }

  trackByOccurrenceId = (_: number, item: IEventSignupOccurrenceVm) =>
    item.occurrence.id;
}
