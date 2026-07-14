import { Component, computed, effect, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { provideTranslocoScope } from '@jsverse/transloco';

import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { TabsModule } from 'primeng/tabs';

import { catchError, forkJoin, map, of, startWith, switchMap } from 'rxjs';

import {
  buildEventHostSignupRoute,
  EVENT_SIGNUP_SELECTION_ROUTE,
} from '../../../core/configs/event-signup.config';
import { buildSiteUrl } from '../../../core/config/site';
import { IEvent } from '../../../core/interfaces/i-event';
import {
  EventSignupForm,
  IEventSignupEventVm,
  IEventSignupOccurrenceVm,
} from '../../../core/interfaces/i-event-signup';
import { IUser } from '../../../core/interfaces/i-user';
import { Auth } from '../../../core/services/auth/auth';
import { Backend } from '../../../core/services/backend/backend';
import { EventProgramRead } from '../../../core/services/event-program-read/event-program-read';
import { EventRead } from '../../../core/services/event-read/event-read';
import { EventSignup } from '../../../core/services/event-signup/event-signup';
import { Seo } from '../../../core/services/seo/seo';
import { HOST_SIGNUP_OCCURRENCE_STATUSES } from '../../../core/types/event-signup';
import {
  formatDateLabel,
  getEndOfNextMonthIso,
  getStartOfCurrentMonthIso,
} from '../../../core/utils/date';
import { hasMinimumRole } from '../../../core/utils/roles';
import { formatTimeRangeLabel } from '../../../core/utils/time';
import { LoadingOverlay } from '../../../public/common/loading-overlay/loading-overlay';
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
  providers: [provideTranslocoScope('auth', 'common')],
})
export class EventSignupComponent {
  private readonly backend = inject(Backend);
  private readonly eventProgramRead = inject(EventProgramRead);
  private readonly eventRead = inject(EventRead);
  private readonly eventSignup = inject(EventSignup);
  private readonly auth = inject(Auth);
  private readonly router = inject(Router);
  private readonly seo = inject(Seo);
  private readonly pageUrl = buildSiteUrl(EVENT_SIGNUP_SELECTION_ROUTE);

  private readonly rangeStartIso = getStartOfCurrentMonthIso();
  private readonly rangeEndIso = getEndOfNextMonthIso();

  readonly i18n = createEventSignupI18n();

  readonly form: EventSignupForm = new FormGroup({
    eventId: new FormControl<string | null>(null),
  });

  readonly eventsVm = toSignal(this.loadEventsVm(), {
    initialValue: null,
  });

  readonly selectedEventId = toSignal(
    this.form.controls.eventId.valueChanges.pipe(
      startWith(this.form.controls.eventId.value),
    ),
    { initialValue: null },
  );

  readonly isLoading = computed(() => this.eventsVm() === null);

  readonly eventOptions = computed(() =>
    (this.eventsVm() ?? []).map(({ event }) => ({
      label: event.name,
      value: event.id,
    })),
  );

  readonly selectedEventVm = computed(() => {
    const events = this.eventsVm();

    if (!events?.length) {
      return null;
    }

    const selectedEventId = this.selectedEventId();

    if (!selectedEventId) {
      return events[0] ?? null;
    }

    return (
      events.find(({ event }) => event.id === selectedEventId) ??
      events[0] ??
      null
    );
  });

  readonly selectedEventTimeLabel = computed(() => {
    const event = this.selectedEventVm()?.event;

    if (!event) {
      return '';
    }

    return formatTimeRangeLabel(event.startTime, event.endTime);
  });

  private readonly applySeoEffect = effect(() => {
    this.seo.apply({
      title: this.i18n.seo().title,
      description: this.i18n.seo().description,
      canonicalUrl: this.pageUrl,
      robots: 'noindex,nofollow',
    });
  });

  onEventChange(eventId: string): void {
    this.form.controls.eventId.setValue(eventId);
  }

  openOccurrence(
    eventSlug: string,
    occurrenceDate: string,
    canOpen: boolean,
  ): void {
    if (!canOpen) {
      return;
    }

    void this.router.navigate(
      buildEventHostSignupRoute(eventSlug, occurrenceDate),
    );
  }

  trackByEventId = (_: number, item: IEventSignupEventVm) => item.event.id;
  trackByOccurrenceId = (_: number, item: IEventSignupOccurrenceVm) =>
    item.occurrence.id;

  private loadCurrentUser() {
    const userId = this.auth.userId();

    if (!userId) {
      return of(null);
    }

    return this.backend
      .getById<IUser>('users', userId)
      .pipe(catchError(() => of(null)));
  }

  private loadEventsVm() {
    return forkJoin({
      currentUser: this.loadCurrentUser(),
      events: this.backend.getAll<IEvent>({
        table: 'events',
        sortBy: 'name',
        sortOrder: 'asc',
      }),
    }).pipe(
      switchMap(({ currentUser, events }) => {
        if (!events.length) {
          return of([] as IEventSignupEventVm[]);
        }

        return forkJoin(
          events.map((event) => this.loadEventVm(event, currentUser)),
        );
      }),
      map((items) => {
        const currentValue = this.form.controls.eventId.value;

        if (items.length && !currentValue) {
          this.form.controls.eventId.setValue(items[0].event.id, {
            emitEvent: false,
          });
        }

        return items;
      }),
      catchError((error) => {
        console.error('[EVENT SIGNUP LIST ERROR]', error);
        return of([] as IEventSignupEventVm[]);
      }),
    );
  }

  private loadEventVm(event: IEvent, currentUser: IUser | null) {
    return this.eventRead
      .getOccurrencesInRange(
        event.id,
        this.rangeStartIso,
        this.rangeEndIso,
        [...HOST_SIGNUP_OCCURRENCE_STATUSES],
      )
      .pipe(
        switchMap((occurrences) => {
          if (!occurrences.length) {
            return of({
              event,
              occurrences: [],
            } as IEventSignupEventVm);
          }

          return forkJoin(
            occurrences.map((occurrence) =>
              forkJoin({
                signupCount: this.eventProgramRead
                  .getActiveHostSignupCountByOccurrenceId(occurrence.id)
                  .pipe(catchError(() => of(0))),
                mySignup: this.getMySignupForOccurrence(
                  event.id,
                  occurrence.id,
                ),
              }).pipe(
                map(({ signupCount, mySignup }) => {
                  const isFull = signupCount >= occurrence.slotCapacity;
                  const isAdmin = hasMinimumRole(currentUser, 'admin');
                  const canHostSignup = hasMinimumRole(currentUser, 'gm');
                  const canOpen =
                    (canHostSignup && (!isFull || !!mySignup)) || isAdmin;

                  return {
                    occurrence,
                    label: formatDateLabel(
                      occurrence.occurrenceDate,
                      'pl-PL',
                      true,
                    ),
                    signupCount,
                    isFull,
                    mySignup,
                    canOpen,
                  } satisfies IEventSignupOccurrenceVm;
                }),
              ),
            ),
          ).pipe(
            map((occurrenceVms) => ({
              event,
              occurrences: occurrenceVms,
            })),
          );
        }),
      );
  }

  private getMySignupForOccurrence(eventId: string, occurrenceId: string) {
    return this.eventSignup
      .getMySignup({
        eventId,
        occurrenceId,
      })
      .pipe(catchError(() => of(null)));
  }
}
