import { computed, effect, inject, Injectable, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import {
  catchError,
  finalize,
  forkJoin,
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
} from '../../../core/interfaces/i-event-signup';
import { IOccurrenceSwitcherOption } from '../../../core/interfaces/i-occurrence-switcher';
import { Auth } from '../../../core/services/auth/auth';
import { EventRead } from '../../../core/services/event-read/event-read';
import { EventSignup } from '../../../core/services/event-signup/event-signup';
import { UiToast } from '../../../core/services/ui-toast/ui-toast';
import {
  EventSignupFormToastConfig,
  HOST_SIGNUP_OCCURRENCE_STATUSES,
} from '../../../core/types/event-signup';
import {
  getEndOfNextMonthIso,
  getStartOfCurrentMonthIso,
} from '../../../core/utils/date';
import { createEventSignupFormI18n } from './event-signup-form.i18n';

@Injectable()
export class EventSignupFormFacade {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly auth = inject(Auth);
  private readonly eventRead = inject(EventRead);
  private readonly eventSignup = inject(EventSignup);
  private readonly toast = inject(UiToast);
  private readonly i18n = createEventSignupFormI18n();

  private readonly rangeStartIso = getStartOfCurrentMonthIso();
  private readonly rangeEndIso = getEndOfNextMonthIso();

  readonly isLoading = signal(true);
  readonly isSubmitting = signal(false);
  readonly data = signal<IEventSignupLoadData>(
    this.eventRead.createEmptyHostSignupLoadData(),
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

    return this.getScreenData().pipe(
      map(({ data, occurrenceOptions }) => {
        this.data.set(data);
        this.occurrenceOptions.set(occurrenceOptions);
      }),
      catchError((error) => {
        console.error('[EVENT SIGNUP FORM LOAD ERROR]', error);

        this.data.set(this.eventRead.createEmptyHostSignupLoadData());
        this.occurrenceOptions.set([]);

        this.toast.danger({
          summary: this.i18n.toast().loadFailedSummary,
          detail: this.i18n.toast().loadFailedDetail,
        });

        return of(void 0);
      }),
      finalize(() => this.isLoading.set(false)),
    );
  }

  saveSignup(
    payload: IEventSignupSavePayload,
    toastConfig: EventSignupFormToastConfig,
  ): void {
    this.runRequest(this.eventSignup.saveSignup(payload), toastConfig);
  }

  withdraw(
    signupId: string,
    toastConfig: EventSignupFormToastConfig,
  ): void {
    this.runRequest(this.eventSignup.withdraw(signupId), toastConfig);
  }

  navigateToOccurrence(index: number): void {
    const page = this.page();
    const option = this.occurrenceOptions()[index];

    if (!page.event?.slug || !option?.occurrenceDate) {
      return;
    }

    void this.router.navigate(
      buildEventHostSignupRoute(page.event.slug, option.occurrenceDate),
    );
  }

  private runRequest(
    request$: Observable<unknown>,
    toastConfig: EventSignupFormToastConfig,
  ): void {
    this.isSubmitting.set(true);

    request$
      .pipe(
        switchMap(() => this.getScreenData()),
        finalize(() => this.isSubmitting.set(false)),
      )
      .subscribe({
        next: ({ data, occurrenceOptions }) => {
          this.data.set(data);
          this.occurrenceOptions.set(occurrenceOptions);

          this.toast.success({
            summary: toastConfig.successSummary,
            detail: toastConfig.successDetail,
          });
        },
        error: (error) => {
          console.error('[EVENT SIGNUP FORM REQUEST ERROR]', error);

          this.toast.danger({
            summary: toastConfig.errorSummary,
            detail: toastConfig.errorDetail,
          });
        },
      });
  }

  private getScreenData(): Observable<{
    data: IEventSignupLoadData;
    occurrenceOptions: IOccurrenceSwitcherOption[];
  }> {
    const params = this.routeParams();
    const eventSlug = params.get('eventSlug');
    const occurrenceDate = params.get('occurrenceDate');
    const userId = this.auth.userId();

    if (!eventSlug || !occurrenceDate) {
      return of({
        data: this.eventRead.createEmptyHostSignupLoadData(),
        occurrenceOptions: [],
      });
    }

    return this.eventRead
      .getHostSignupLoadData(eventSlug, occurrenceDate, userId)
      .pipe(
        switchMap((data) => {
          const eventId = data.page.event?.id;

          if (!eventId) {
            return of({
              data,
              occurrenceOptions: [],
            });
          }

          return forkJoin({
            data: of(data),
            occurrenceOptions: this.eventRead.getOccurrenceOptions(
              eventId,
              this.rangeStartIso,
              this.rangeEndIso,
              [...HOST_SIGNUP_OCCURRENCE_STATUSES],
            ),
          });
        }),
      );
  }
}
