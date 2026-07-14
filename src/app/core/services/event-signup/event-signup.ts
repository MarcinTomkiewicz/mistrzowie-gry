import { inject, Injectable } from '@angular/core';
import { map, Observable, of, switchMap, throwError } from 'rxjs';

import {
  EventProgramItemSourceKind,
  EventProgramItemStatus,
} from '../../enums/event';
import { FilterOperator } from '../../enums/filter-operators';
import { IEventOccurrence } from '../../interfaces/i-event-occurence';
import {
  IEventSignupSavePayload,
  IEventSignupSelection,
} from '../../interfaces/i-event-signup';
import {
  ICreateEventProgramItemPayload,
  IEventProgramItem,
} from '../../interfaces/i-event-program-item';
import { IUser } from '../../interfaces/i-user';
import {
  ACTIVE_HOST_SIGNUP_STATUSES,
  HOST_SIGNUP_OCCURRENCE_STATUSES,
} from '../../types/event-signup';
import { hasMinimumRole } from '../../utils/roles';
import { Auth } from '../auth/auth';
import { Backend } from '../backend/backend';
import { EventProgramRead } from '../event-program-read/event-program-read';
import { GmSessionsFacade } from '../gm-sessions/gm-sessions';
import { SessionRead } from '../session-read/session-read';

@Injectable({ providedIn: 'root' })
export class EventSignup {
  private readonly auth = inject(Auth);
  private readonly backend = inject(Backend);
  private readonly eventProgramRead = inject(EventProgramRead);
  private readonly gmSessions = inject(GmSessionsFacade);
  private readonly sessionRead = inject(SessionRead);

  getMySignup(
    selection: IEventSignupSelection,
  ): Observable<IEventProgramItem | null> {
    const userId = this.auth.userId();

    if (!userId) {
      return of(null);
    }

    return this.findMySignup(selection, userId);
  }

  saveSignup(payload: IEventSignupSavePayload): Observable<IEventProgramItem> {
    const userId = this.auth.userId();

    if (!userId) {
      return throwError(() => new Error('Unauthorized.'));
    }

    return this.getHostSignupSaveContext(payload.selection, userId).pipe(
      switchMap(({ occurrence, canOverrideCapacity }) => {
        if (payload.mode === 'template') {
          return this.saveTemplateSignup(
            payload,
            userId,
            occurrence,
            canOverrideCapacity,
          );
        }

        return this.saveCustomSignup(
          payload,
          userId,
          occurrence,
          canOverrideCapacity,
        );
      }),
    );
  }

  withdraw(signupId: string): Observable<void> {
    const userId = this.auth.userId();

    if (!userId) {
      return throwError(() => new Error('Unauthorized.'));
    }

    return this.getOwnedSignup(signupId, userId).pipe(
      switchMap((signup) =>
        this.backend.update<IEventProgramItem>(
          'event_program_items',
          signup.id,
          {
            status: EventProgramItemStatus.Withdrawn,
          },
        ),
      ),
      map(() => void 0),
    );
  }

  private saveTemplateSignup(
    payload: Extract<IEventSignupSavePayload, { mode: 'template' }>,
    userId: string,
    occurrence: IEventOccurrence,
    canOverrideCapacity: boolean,
  ): Observable<IEventProgramItem> {
    return this.ensureOwnedTemplateSession(
      payload.templateSessionId,
      userId,
    ).pipe(
      switchMap(() => {
        if (payload.signupId) {
          return this.getActiveOwnedSignupForEdit(
            payload.signupId,
            userId,
            payload.selection,
          ).pipe(
            switchMap((signup) =>
              this.backend.update<IEventProgramItem>(
                'event_program_items',
                signup.id,
                {
                  sourceKind: EventProgramItemSourceKind.GmSessionTemplate,
                  gmSessionTemplateId: payload.templateSessionId,
                  customSessionId: null,
                  status: EventProgramItemStatus.Published,
                },
              ),
            ),
          );
        }

        return this.ensureCanCreateSignup(
          payload.selection,
          userId,
          occurrence,
          canOverrideCapacity,
        ).pipe(
          switchMap(() =>
            this.createProgramItem({
              occurrenceId: payload.selection.occurrenceId,
              hostUserId: userId,
              sourceKind: EventProgramItemSourceKind.GmSessionTemplate,
              gmSessionTemplateId: payload.templateSessionId,
              customSessionId: null,
            }),
          ),
        );
      }),
    );
  }

  private saveCustomSignup(
    payload: Extract<IEventSignupSavePayload, { mode: 'custom' }>,
    userId: string,
    occurrence: IEventOccurrence,
    canOverrideCapacity: boolean,
  ): Observable<IEventProgramItem> {
    if (payload.signupId) {
      return this.getActiveOwnedSignupForEdit(
        payload.signupId,
        userId,
        payload.selection,
      ).pipe(
        switchMap((signup) =>
          this.saveOrUpdateCustomSession(
            payload.customSessionPayload,
            payload.customSourceSessionId ?? signup.customSessionId ?? null,
          ).pipe(map((customSessionId) => ({ signup, customSessionId }))),
        ),
        switchMap(({ signup, customSessionId }) =>
          this.backend.update<IEventProgramItem>(
            'event_program_items',
            signup.id,
            {
              sourceKind: EventProgramItemSourceKind.CustomSession,
              gmSessionTemplateId: null,
              customSessionId,
              status: EventProgramItemStatus.Published,
            },
          ),
        ),
      );
    }

    return this.ensureCanCreateSignup(
      payload.selection,
      userId,
      occurrence,
      canOverrideCapacity,
    ).pipe(
      switchMap(() =>
        this.saveOrUpdateCustomSession(
          payload.customSessionPayload,
          payload.customSourceSessionId,
        ),
      ),
      switchMap((customSessionId) =>
        this.createProgramItem({
          occurrenceId: payload.selection.occurrenceId,
          hostUserId: userId,
          sourceKind: EventProgramItemSourceKind.CustomSession,
          gmSessionTemplateId: null,
          customSessionId,
        }),
      ),
    );
  }

  private saveOrUpdateCustomSession(
    payload: Extract<IEventSignupSavePayload, { mode: 'custom' }>['customSessionPayload'],
    customSessionId: string | null,
  ): Observable<string> {
    if (customSessionId) {
      return this.gmSessions
        .updateMySession(customSessionId, payload, 'custom')
        .pipe(map((session) => session.id));
    }

    return this.gmSessions
      .createMySession(payload, 'custom')
      .pipe(map((session) => session.id));
  }

  private findMySignup(
    selection: IEventSignupSelection,
    userId: string,
  ): Observable<IEventProgramItem | null> {
    return this.backend
      .getAll<IEventProgramItem>({
        table: 'event_program_items',
        sortBy: 'createdAt',
        sortOrder: 'desc',
        pagination: {
          filters: {
            occurrenceId: {
              operator: FilterOperator.EQ,
              value: selection.occurrenceId,
            },
            hostUserId: {
              operator: FilterOperator.EQ,
              value: userId,
            },
            status: {
              operator: FilterOperator.IN,
              value: [...ACTIVE_HOST_SIGNUP_STATUSES],
            },
          },
        },
        range: { from: 0, to: 9 },
      })
      .pipe(map((items) => items[0] ?? null));
  }

  private getOwnedSignup(
    signupId: string,
    userId: string,
  ): Observable<IEventProgramItem> {
    return this.backend
      .getById<IEventProgramItem>('event_program_items', signupId)
      .pipe(
        switchMap((signup) => {
          if (!signup) {
            return throwError(() => new Error('Signup not found.'));
          }

          if (signup.hostUserId !== userId) {
            return throwError(() => new Error('Forbidden.'));
          }

          return of(signup);
        }),
      );
  }

  private getActiveOwnedSignupForEdit(
    signupId: string,
    userId: string,
    selection: IEventSignupSelection,
  ): Observable<IEventProgramItem> {
    return this.getOwnedSignup(signupId, userId).pipe(
      switchMap((signup) => {
        if (!ACTIVE_HOST_SIGNUP_STATUSES.includes(signup.status)) {
          return throwError(() => new Error('Signup is not active.'));
        }

        if (signup.occurrenceId !== selection.occurrenceId) {
          return throwError(() => new Error('Selection mismatch.'));
        }

        return of(signup);
      }),
    );
  }

  private getHostSignupSaveContext(
    selection: IEventSignupSelection,
    userId: string,
  ) {
    return this.getOccurrence(selection).pipe(
      switchMap((occurrence) =>
        this.backend.getById<IUser>('users', userId).pipe(
          switchMap((user) => {
            if (!user || !hasMinimumRole(user, 'gm')) {
              return throwError(() => new Error('Forbidden.'));
            }

            if (!HOST_SIGNUP_OCCURRENCE_STATUSES.includes(occurrence.status)) {
              return throwError(() => new Error('Host signup is closed.'));
            }

            return of({
              occurrence,
              canOverrideCapacity: hasMinimumRole(user, 'admin'),
            });
          }),
        ),
      ),
    );
  }

  private getOccurrence(
    selection: IEventSignupSelection,
  ): Observable<IEventOccurrence> {
    return this.backend
      .getOneByFields<IEventOccurrence>('event_occurrences', {
        id: selection.occurrenceId,
        eventId: selection.eventId,
      })
      .pipe(
        switchMap((occurrence) => {
          if (!occurrence) {
            return throwError(() => new Error('Occurrence not found.'));
          }

          return of(occurrence);
        }),
      );
  }

  private ensureCanCreateSignup(
    selection: IEventSignupSelection,
    userId: string,
    occurrence: IEventOccurrence,
    canOverrideCapacity: boolean,
  ): Observable<void> {
    return this.findMySignup(selection, userId).pipe(
      switchMap((existing) => {
        if (existing) {
          return throwError(() => new Error('Signup already exists.'));
        }

        if (canOverrideCapacity) {
          return of(void 0);
        }

        return this.eventProgramRead.getActiveHostSignupCountByOccurrenceId(
          occurrence.id,
        ).pipe(
          switchMap((signupCount) =>
            signupCount >= occurrence.slotCapacity
              ? throwError(() => new Error('Occurrence is full.'))
              : of(void 0),
          ),
        );
      }),
    );
  }

  private ensureOwnedTemplateSession(
    templateSessionId: string,
    userId: string,
  ): Observable<void> {
    return this.sessionRead
      .getSessionById(templateSessionId, 'template', userId)
      .pipe(
        switchMap((session) =>
          session
            ? of(void 0)
            : throwError(() => new Error('Template session not found.')),
        ),
      );
  }

  private createProgramItem(
    payload: Omit<ICreateEventProgramItemPayload, 'status' | 'displayOrder'>,
  ): Observable<IEventProgramItem> {
    const createPayload: ICreateEventProgramItemPayload = {
      ...payload,
      status: EventProgramItemStatus.Published,
      displayOrder: null,
    };

    return this.backend.create<
      IEventProgramItem,
      ICreateEventProgramItemPayload
    >('event_program_items', createPayload);
  }
}
