import { computed, effect, inject, Injectable, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import {
  catchError,
  EMPTY,
  finalize,
  map,
  Observable,
  of,
  startWith,
  switchMap,
} from 'rxjs';

import {
  buildEventHostSignupPath,
  buildEventHostSignupRoute,
  EVENT_SIGNUP_SELECTION_ROUTE,
} from '../../../core/configs/event-signup.config';
import { buildSiteUrl } from '../../../core/config/site';
import {
  IEventSignupLoadData,
  IEventSignupSavePayload,
  IEventSignupScreenData,
} from '../../../core/interfaces/i-event-signup';
import { IOccurrenceSwitcherOption } from '../../../core/interfaces/i-occurrence-switcher';
import { EventSignup } from '../../../core/services/event-signup/event-signup';
import { EventSignupRead } from '../../../core/reads/events/event-signup-read';
import { UiToast } from '../../../core/services/ui-toast/ui-toast';
import {
  getEndOfNextMonthIso,
  getStartOfCurrentMonthIso,
} from '../../../core/utils/date';
import { createEventSignupFormI18n } from './event-signup-form.i18n';

@Injectable()
export class EventSignupFormFacade {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly eventSignup = inject(EventSignup);
  private readonly eventSignupRead = inject(EventSignupRead);
  private readonly toast = inject(UiToast);
  private readonly i18n = createEventSignupFormI18n();

  private readonly rangeStartIso = getStartOfCurrentMonthIso();
  private readonly rangeEndIso = getEndOfNextMonthIso();

  readonly isLoading = signal(true);
  readonly isSubmitting = signal(false);
  readonly loadError = signal<unknown | null>(null);
  readonly data = signal<IEventSignupLoadData>(
    this.eventSignupRead.createEmptyLoadData(),
  );
  readonly occurrenceOptions = signal<IOccurrenceSwitcherOption[]>([]);

  readonly routeParams = toSignal(
    this.route.paramMap.pipe(startWith(this.route.snapshot.paramMap)),
    { requireSync: true },
  );

  readonly page = computed(() => this.data().page);
  readonly resources = computed(() => this.data().resources);
  readonly isBusy = computed(() => this.isLoading() || this.isSubmitting());
  readonly pageUrl = computed(() => {
    const params = this.routeParams();
    const eventSlug = params.get('eventSlug');
    const occurrenceDate = params.get('occurrenceDate');

    return eventSlug && occurrenceDate
      ? buildSiteUrl(buildEventHostSignupPath(eventSlug, occurrenceDate))
      : buildSiteUrl(EVENT_SIGNUP_SELECTION_ROUTE);
  });

  constructor() {
    effect((onCleanup) => {
      this.routeParams();

      const sub = this.refreshData().subscribe();

      onCleanup(() => sub.unsubscribe());
    });
  }

  refreshData(): Observable<void> {
    this.isLoading.set(true);
    this.loadError.set(null);

    return this.getScreenData().pipe(
      map(({ data, occurrenceOptions }) => {
        this.data.set(data);
        this.occurrenceOptions.set(occurrenceOptions);
        this.loadError.set(null);
      }),
      catchError((error) => {
        this.handleLoadError(error);

        return of(void 0);
      }),
      finalize(() => this.isLoading.set(false)),
    );
  }

  retry(): void {
    this.refreshData().subscribe();
  }

  saveSignup(payload: IEventSignupSavePayload): void {
    this.runRequest(this.eventSignup.saveSignup(payload), 'save');
  }

  withdraw(signupId: string): void {
    this.runRequest(this.eventSignup.withdraw(signupId), 'withdraw');
  }

  navigateToOccurrence(index: number): void {
    const page = this.page();
    const option = this.occurrenceOptions()[index];

    if (!page.edition?.slug || !option?.occurrenceDate) {
      return;
    }

    void this.router.navigate(
      buildEventHostSignupRoute(page.edition.slug, option.occurrenceDate),
    );
  }

  private runRequest(
    request$: Observable<unknown>,
    requestKind: 'save' | 'withdraw',
  ): void {
    const toast = this.i18n.toast();
    const toastCopy =
      requestKind === 'save'
        ? {
            successSummary: toast.saveSuccessSummary,
            successDetail: toast.saveSuccessDetail,
            errorSummary: toast.saveFailedSummary,
            errorDetail: toast.saveFailedDetail,
          }
        : {
            successSummary: toast.withdrawSuccessSummary,
            successDetail: toast.withdrawSuccessDetail,
            errorSummary: toast.withdrawFailedSummary,
            errorDetail: toast.withdrawFailedDetail,
          };

    this.isSubmitting.set(true);
    this.loadError.set(null);

    request$
      .pipe(
        switchMap(() =>
          this.getScreenData().pipe(
            catchError((error) => {
              this.handleLoadError(error);
              return EMPTY;
            }),
          ),
        ),
        finalize(() => this.isSubmitting.set(false)),
      )
      .subscribe({
        next: ({ data, occurrenceOptions }) => {
          this.data.set(data);
          this.occurrenceOptions.set(occurrenceOptions);

          this.toast.success({
            summary: toastCopy.successSummary,
            detail: toastCopy.successDetail,
          });
        },
        error: (error) => {
          console.error('[EVENT SIGNUP FORM REQUEST ERROR]', error);

          this.toast.danger({
            summary: toastCopy.errorSummary,
            detail: toastCopy.errorDetail,
          });
        },
      });
  }

  private handleLoadError(error: unknown): void {
    console.error('[EVENT SIGNUP FORM LOAD ERROR]', error);

    this.loadError.set(error);

    this.toast.danger({
      summary: this.i18n.toast().loadFailedSummary,
      detail: this.i18n.toast().loadFailedDetail,
    });
  }

  private getScreenData(): Observable<IEventSignupScreenData> {
    const params = this.routeParams();
    const eventSlug = params.get('eventSlug');
    const occurrenceDate = params.get('occurrenceDate');

    if (!eventSlug || !occurrenceDate) {
      return of({
        data: this.eventSignupRead.createEmptyLoadData(),
        occurrenceOptions: [],
      });
    }

    return this.eventSignupRead.getFormScreenData(
      eventSlug,
      occurrenceDate,
      this.rangeStartIso,
      this.rangeEndIso,
    );
  }
}
