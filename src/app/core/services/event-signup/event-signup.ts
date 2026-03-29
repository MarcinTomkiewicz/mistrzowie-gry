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
import { IEventProgramItem } from '../../interfaces/i-event-program-item';
import { Auth } from '../auth/auth';
import { Backend } from '../backend/backend';
import { GmSessionsFacade } from '../gm-sessions/gm-sessions';

@Injectable({ providedIn: 'root' })
export class EventSignup {
  private readonly auth = inject(Auth);
  private readonly backend = inject(Backend);
  private readonly gmSessions = inject(GmSessionsFacade);

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

    return this.ensureOccurrenceExists(payload.selection).pipe(
      switchMap(() => {
        if (payload.mode === 'template') {
          return this.saveTemplateSignup(payload, userId);
        }

        return this.saveCustomSignup(payload, userId);
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
  ): Observable<IEventProgramItem> {
    if (payload.signupId) {
      return this.getOwnedSignup(payload.signupId, userId).pipe(
        switchMap((signup) =>
          this.ensureSameOccurrence(signup, payload.selection).pipe(
            map(() => signup),
          ),
        ),
        switchMap((signup) =>
          this.backend.update<IEventProgramItem>(
            'event_program_items',
            signup.id,
            {
              sourceKind: EventProgramItemSourceKind.GmSessionTemplate,
              gmSessionTemplateId: payload.templateSessionId,
              customSessionId: null,
              status: EventProgramItemStatus.Submitted,
            },
          ),
        ),
      );
    }

    return this.findMySignup(payload.selection, userId).pipe(
      switchMap((existing) => {
        if (existing) {
          return throwError(() => new Error('Signup already exists.'));
        }

        return this.createProgramItem({
          occurrenceId: payload.selection.occurrenceId,
          hostUserId: userId,
          sourceKind: EventProgramItemSourceKind.GmSessionTemplate,
          gmSessionTemplateId: payload.templateSessionId,
          customSessionId: null,
        });
      }),
    );
  }

  private saveCustomSignup(
    payload: Extract<IEventSignupSavePayload, { mode: 'custom' }>,
    userId: string,
  ): Observable<IEventProgramItem> {
    if (payload.signupId) {
      return this.getOwnedSignup(payload.signupId, userId).pipe(
        switchMap((signup) =>
          this.ensureSameOccurrence(signup, payload.selection).pipe(
            map(() => signup),
          ),
        ),
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
              status: EventProgramItemStatus.Submitted,
            },
          ),
        ),
      );
    }

    return this.findMySignup(payload.selection, userId).pipe(
      switchMap((existing) => {
        if (existing) {
          return throwError(() => new Error('Signup already exists.'));
        }

        return this.saveOrUpdateCustomSession(
          payload.customSessionPayload,
          payload.customSourceSessionId,
        );
      }),
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
          },
        },
        range: { from: 0, to: 9 },
      })
      .pipe(
        map(
          (items) =>
            items.find(
              (item) => item.status !== EventProgramItemStatus.Withdrawn,
            ) ?? null,
        ),
      );
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

  private ensureOccurrenceExists(
    selection: IEventSignupSelection,
  ): Observable<void> {
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

          return of(void 0);
        }),
      );
  }

  private ensureSameOccurrence(
    signup: IEventProgramItem,
    selection: IEventSignupSelection,
  ): Observable<void> {
    if (signup.occurrenceId !== selection.occurrenceId) {
      return throwError(() => new Error('Selection mismatch.'));
    }

    return of(void 0);
  }

  private createProgramItem(
    payload: Pick<
      IEventProgramItem,
      | 'occurrenceId'
      | 'hostUserId'
      | 'sourceKind'
      | 'gmSessionTemplateId'
      | 'customSessionId'
    >,
  ): Observable<IEventProgramItem> {
    return this.backend.create<IEventProgramItem>('event_program_items', {
      ...payload,
      status: EventProgramItemStatus.Published,
      displayOrder: null,
    } as IEventProgramItem);
  }
}