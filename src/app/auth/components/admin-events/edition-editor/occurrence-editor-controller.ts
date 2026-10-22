import { Injectable, computed, inject, signal } from '@angular/core';
import { EMPTY, Observable, catchError, defer, finalize, map, of, switchMap, tap } from 'rxjs';

import { EventOccurrenceStatus } from '../../../../core/enums/event';
import type { IAdminEventDetail, IAdminOccurrenceListItem, IOccurrenceSavePayload } from '../../../../core/interfaces/i-event-admin';
import { EventAdmin } from '../../../../core/services/event-admin/event-admin';
import { assertEdgeContract } from '../../../../core/utils/edge-contract';

export type OccurrenceWriteResult =
  | { kind: 'updated'; detail: IAdminEventDetail; occurrence: IAdminOccurrenceListItem }
  | { kind: 'failed'; confirmed: boolean; error: unknown };

@Injectable()
export class OccurrenceEditorController {
  private readonly admin = inject(EventAdmin);
  private readonly operation = signal<'save' | 'signup' | null>(null);

  readonly isBusy = computed(() => this.operation() !== null);
  readonly isSaving = computed(() => this.operation() === 'save');
  readonly isChangingSignup = computed(() => this.operation() === 'signup');

  save(eventId: string, payload: IOccurrenceSavePayload): Observable<OccurrenceWriteResult> {
    return this.write('save', eventId, payload.id, payload.status, this.admin.saveOccurrence(payload));
  }

  setParticipantSignupState(eventId: string, occurrenceId: string, open: boolean): Observable<OccurrenceWriteResult> {
    const status = open ? EventOccurrenceStatus.ParticipantSignupOpen : EventOccurrenceStatus.ParticipantSignupClosed;
    const command = this.admin.setParticipantSignupState(occurrenceId, open).pipe(tap((result) => {
      assertEdgeContract(result?.occurrenceId === occurrenceId && result.status === status,
        'participantSignupState', 'the requested occurrence and signup status');
    }));
    return this.write('signup', eventId, occurrenceId, status, command);
  }

  private write(
    operation: 'save' | 'signup',
    eventId: string,
    occurrenceId: string,
    status: EventOccurrenceStatus,
    command: Observable<unknown>,
  ): Observable<OccurrenceWriteResult> {
    return defer(() => {
      if (this.isBusy()) return EMPTY;
      this.operation.set(operation);
      let confirmed = false;
      return command.pipe(
        tap(() => { confirmed = true; }),
        switchMap(() => this.admin.getEditionDetail(eventId)),
        map((detail): OccurrenceWriteResult => {
          const occurrence = detail?.occurrences.find((item) => item.id === occurrenceId);
          assertEdgeContract(detail !== null && detail.id === eventId && occurrence !== undefined && occurrence.status === status,
            'eventEdition', 'the current Edition with the confirmed occurrence status');
          return { kind: 'updated', detail, occurrence };
        }),
        catchError((error: unknown) => of<OccurrenceWriteResult>({ kind: 'failed', confirmed, error })),
        finalize(() => this.operation.set(null)),
      );
    });
  }
}
