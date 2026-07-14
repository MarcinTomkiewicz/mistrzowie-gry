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
import { IEvent } from '../../../core/interfaces/i-event';
import {
  IEventSignupLoadData,
  IEventSignupSavePayload,
} from '../../../core/interfaces/i-event-signup';
import { IOccurrenceSwitcherOption } from '../../../core/interfaces/i-occurrence-switcher';
import { Auth } from '../../../core/services/auth/auth';
import { EventProgramRead } from '../../../core/services/event-program-read/event-program-read';
import { EventRead } from '../../../core/services/event-read/event-read';
import { EventSignup } from '../../../core/services/event-signup/event-signup';
import { GmSessionsFacade } from '../../../core/services/gm-sessions/gm-sessions';
import { SessionRead } from '../../../core/services/session-read/session-read';
import { UiToast } from '../../../core/services/ui-toast/ui-toast';
import {
  EventSignupFormToastConfig,
  HOST_SIGNUP_OCCURRENCE_STATUSES,
} from '../../../core/types/event-signup';
import {
  getEndOfNextMonthIso,
  getStartOfCurrentMonthIso,
} from '../../../core/utils/date';
import { hasMinimumRole } from '../../../core/utils/roles';
import { createEventSignupFormI18n } from './event-signup-form.i18n';

@Injectable()
export class EventSignupFormFacade {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly auth = inject(Auth);
  private readonly eventProgramRead = inject(EventProgramRead);
  private readonly eventRead = inject(EventRead);
  private readonly eventSignup = inject(EventSignup);
  private readonly gmSessions = inject(GmSessionsFacade);
  private readonly sessionRead = inject(SessionRead);
  private readonly toast = inject(UiToast);
  private readonly i18n = createEventSignupFormI18n();

  private readonly rangeStartIso = getStartOfCurrentMonthIso();
  private readonly rangeEndIso = getEndOfNextMonthIso();

  readonly isLoading = signal(true);
  readonly isSubmitting = signal(false);
  readonly data = signal<IEventSignupLoadData>(this.createEmptyLoadData());
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

        this.data.set(this.createEmptyLoadData());
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

    if (!eventSlug || !occurrenceDate) {
      return of({
        data: this.createEmptyLoadData(),
        occurrenceOptions: [],
      });
    }

    return this.eventRead.getEventBySlug(eventSlug).pipe(
      switchMap((event) => {
        if (!event) {
          return of({
            data: this.createEmptyLoadData(),
            occurrenceOptions: [],
          });
        }

        return forkJoin({
          data: this.getSignupLoadData(event, occurrenceDate),
          occurrenceOptions: this.getOccurrenceOptions(event.id),
        });
      }),
    );
  }

  private getSignupLoadData(
    event: IEvent,
    occurrenceDate: string,
  ): Observable<IEventSignupLoadData> {
    return this.eventRead.getOccurrenceByDate(event.id, occurrenceDate).pipe(
      switchMap((occurrence) => {
        const empty = this.createEmptyLoadData();

        if (!occurrence) {
          return of({
            ...empty,
            page: {
              ...empty.page,
              event,
            },
          } satisfies IEventSignupLoadData);
        }

        if (!HOST_SIGNUP_OCCURRENCE_STATUSES.includes(occurrence.status)) {
          return of({
            ...empty,
            page: {
              ...empty.page,
              event,
              occurrence,
            },
          } satisfies IEventSignupLoadData);
        }

        const user = this.auth.user();

        return forkJoin({
          signupCount:
            this.eventProgramRead.getActiveHostSignupCountByOccurrenceId(
              occurrence.id,
            ),
          mySignup: this.eventSignup.getMySignup({
            eventId: event.id,
            occurrenceId: occurrence.id,
          }),
          templateSessions: user
            ? this.sessionRead.getSessionsByGmProfileId(user.id, 'template')
            : of([]),
          customSessions: user
            ? this.sessionRead.getSessionsByGmProfileId(user.id, 'custom')
            : of([]),
          systems: this.gmSessions.getAvailableSystems(),
          styles: this.gmSessions.getAvailableStyles(),
          triggers: this.gmSessions.getAvailableTriggers(),
          languages: this.gmSessions.getAvailableLanguages(),
        }).pipe(
          map(
            ({
              signupCount,
              mySignup,
              templateSessions,
              customSessions,
              systems,
              styles,
              triggers,
              languages,
            }) => {
              const isFull = signupCount >= occurrence.slotCapacity;
              const isAdmin = hasMinimumRole(user, 'admin');
              const canHostSignup = hasMinimumRole(user, 'gm');
              const canAccess =
                (canHostSignup && (!isFull || !!mySignup)) || isAdmin;

              return {
                page: {
                  event,
                  occurrence,
                  mySignup,
                  signupCount,
                  isFull,
                  canAccess,
                },
                resources: {
                  templateSessions,
                  customSessions,
                  systems,
                  styles,
                  triggers,
                  languages,
                },
              } satisfies IEventSignupLoadData;
            },
          ),
        );
      }),
    );
  }

  private getOccurrenceOptions(
    eventId: string,
  ): Observable<IOccurrenceSwitcherOption[]> {
    return this.eventRead
      .getOccurrencesInRange(
        eventId,
        this.rangeStartIso,
        this.rangeEndIso,
        [...HOST_SIGNUP_OCCURRENCE_STATUSES],
      )
      .pipe(
        map((occurrences) =>
          occurrences.map((occurrence) => ({
            id: occurrence.id,
            label: occurrence.occurrenceDate,
            occurrenceDate: occurrence.occurrenceDate,
          })),
        ),
      );
  }

  private createEmptyLoadData(): IEventSignupLoadData {
    return {
      page: {
        event: null,
        occurrence: null,
        mySignup: null,
        signupCount: 0,
        isFull: false,
        canAccess: false,
      },
      resources: {
        templateSessions: [],
        customSessions: [],
        systems: [],
        styles: [],
        triggers: [],
        languages: [],
      },
    };
  }
}
