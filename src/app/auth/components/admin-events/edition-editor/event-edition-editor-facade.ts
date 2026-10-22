import { DestroyRef, Injectable, computed, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  EMPTY, Observable, catchError, defer, finalize, forkJoin, map, of, switchMap, tap,
  throwError,
} from 'rxjs';

import { buildPublicEventPath, isPublicEventSlug } from '../../../../core/configs/events.config';
import { EventProgramItemStatus } from '../../../../core/enums/event';
import type { AdminEventTimeline } from '../../../../core/interfaces/i-admin-event-timeline';
import type {
  AdminEventProgramParticipants, EventEditionSaveResult, EventPublishResult, IAdminEventDetail,
  IEventCoreDetail, IEventSavePayload,
} from '../../../../core/interfaces/i-event-admin';
import { EventAdmin } from '../../../../core/services/event-admin/event-admin';
import { EventParticipant } from '../../../../core/services/event-participant/event-participant';
import { assertEdgeContract } from '../../../../core/utils/edge-contract';

type ProgramParticipantsState =
  | { kind: 'loading' }
  | { kind: 'error'; error: unknown }
  | { kind: 'ready'; data: AdminEventProgramParticipants };

@Injectable()
export class EventEditionEditorFacade {
  private readonly admin = inject(EventAdmin);
  private readonly participant = inject(EventParticipant);
  private readonly destroyRef = inject(DestroyRef);
  private readonly coreState = signal<IEventCoreDetail | null>(null);
  private readonly editionState = signal<IAdminEventDetail | null>(null);
  private readonly loading = signal(true);
  private readonly operation = signal<'save' | 'publish' | null>(null);
  private readonly notFound = signal(false);
  private readonly publishResult = signal<EventPublishResult | null>(null);
  private readonly timelineState = signal<AdminEventTimeline | null>(null);
  private readonly timelineFailure = signal<unknown>(null);
  private readonly timelineLoading = signal(false);
  private readonly participantStates = signal<ReadonlyMap<string, ProgramParticipantsState>>(new Map());
  private readonly removingParticipant = signal<string | null>(null);

  readonly core = this.coreState.asReadonly();
  readonly edition = this.editionState.asReadonly();
  readonly isLoading = this.loading.asReadonly();
  readonly isNotFound = this.notFound.asReadonly();
  readonly publicationResult = this.publishResult.asReadonly();
  readonly timeline = computed(() => {
    const timeline = this.timelineState();
    return timeline?.eventId === this.edition()?.id ? timeline : null;
  });
  readonly timelineError = this.timelineFailure.asReadonly();
  readonly isTimelineLoading = this.timelineLoading.asReadonly();
  readonly isSaving = computed(() => this.operation() === 'save');
  readonly isPublishing = computed(() => this.operation() === 'publish');
  readonly programParticipants = this.participantStates.asReadonly();
  readonly removingParticipantId = this.removingParticipant.asReadonly();
  readonly isBusy = computed(() => this.loading() || this.operation() !== null || this.removingParticipant() !== null);
  readonly privateDraftBlocked = computed(() => {
    const core = this.core();
    const edition = this.edition();
    return !!core && !!edition && !edition.isStaffingReleased &&
      (core.isActive || core.hasPublicPage || edition.isActive || edition.isDefaultPublic);
  });
  readonly publicPath = computed(() => {
    const edition = this.edition();
    return edition?.isStaffingReleased && edition.currentlyPublic &&
      isPublicEventSlug(edition.eventCoreKey) && isPublicEventSlug(edition.slug)
      ? buildPublicEventPath(edition.eventCoreKey, edition.slug) : null;
  });

  constructor() {
    effect((onCleanup) => {
      const edition = this.edition();
      this.timelineState.set(null);
      this.timelineFailure.set(null);
      this.timelineLoading.set(!!edition);
      if (!edition) return;

      const subscription = this.admin.getTimeline(edition.id).pipe(
        map((timeline) => {
          if (timeline.eventId !== edition.id || timeline.eventCoreId !== edition.eventCoreId) {
            throw new Error('[EVENT_TIMELINE] Inconsistent Edition readback.');
          }
          return timeline;
        }),
        finalize(() => {
          if (this.edition() === edition) this.timelineLoading.set(false);
        }),
      ).subscribe({
        next: (timeline) => {
          if (this.edition() === edition) this.timelineState.set(timeline);
        },
        error: (error: unknown) => {
          if (this.edition() === edition) this.timelineFailure.set(error);
        },
      });
      onCleanup(() => subscription.unsubscribe());
    });
  }

  reloadTimeline(): void {
    const edition = this.edition();
    if (!edition || this.isBusy() || this.isTimelineLoading()) return;
    this.timelineLoading.set(true);
    this.timelineFailure.set(null);
    this.readEdition(edition).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (detail) => {
        if (this.edition() === edition) this.editionState.set(detail);
      },
      error: (error: unknown) => {
        if (this.edition() !== edition) return;
        this.timelineFailure.set(error);
        this.timelineLoading.set(false);
      },
    });
  }

  loadProgramParticipants(programItemId: string): void {
    const occurrenceId = this.programOccurrenceId(programItemId);
    if (!occurrenceId || this.isBusy() || this.participantStates().get(programItemId)?.kind === 'loading') return;
    const pending: ProgramParticipantsState = { kind: 'loading' };
    this.setParticipants(programItemId, pending);
    this.readParticipants(programItemId, occurrenceId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data) => {
        if (this.participantStates().get(programItemId) === pending) {
          this.setParticipants(programItemId, { kind: 'ready', data });
        }
      },
      error: (error: unknown) => {
        if (this.participantStates().get(programItemId) === pending) {
          this.setParticipants(programItemId, { kind: 'error', error });
        }
      },
    });
  }

  removeProgramParticipant(programItemId: string, registrationId: string): Observable<'removed' | 'refreshFailed'> {
    return defer(() => {
      const edition = this.edition();
      const state = this.participantStates().get(programItemId);
      const occurrenceId = this.programOccurrenceId(programItemId);
      if (!edition || !occurrenceId || this.isBusy() || state?.kind !== 'ready' ||
        !state.data.registrations.some((item) => item.registrationId === registrationId)) return EMPTY;
      this.removingParticipant.set(registrationId);
      return this.participant.cancelMy({ registrationId, confirmationCode: null }).pipe(
        tap((result) => assertEdgeContract(
          result?.cancelled === true && result.status === 'cancelled' && result.registrationId === registrationId &&
            result.eventProgramItemId === programItemId && result.occurrenceId === occurrenceId,
          'participantCancellation', 'a confirmed cancellation of the selected registration',
        )),
        switchMap(() => forkJoin({
          participants: this.readParticipants(programItemId, occurrenceId),
          edition: this.readEdition(edition),
        }).pipe(
          tap((result) => {
            if (this.edition()?.id !== edition.id) return;
            this.setParticipants(programItemId, { kind: 'ready', data: result.participants });
            this.editionState.set(result.edition);
          }),
          map(() => 'removed' as const),
          catchError((error: unknown) => {
            if (this.edition()?.id === edition.id) {
              this.setParticipants(programItemId, { kind: 'error', error });
              this.timelineFailure.set(error);
            }
            return of('refreshFailed' as const);
          }),
        )),
        finalize(() => this.removingParticipant.set(null)),
      );
    });
  }

  reset(): void {
    this.coreState.set(null);
    this.editionState.set(null);
    this.publishResult.set(null);
    this.participantStates.set(new Map());
  }

  load(coreId: string, eventId: string): Observable<void> {
    return defer(() => {
      this.loading.set(true);
      this.notFound.set(false);
      return forkJoin({
        core: this.admin.getCoreDetail(coreId),
        edition: eventId
          ? this.admin.getEditionDetail(eventId)
          : of<IAdminEventDetail | null>(null),
      }).pipe(
        map(({ core, edition }) => {
          if (!core || (eventId && (!edition || edition.eventCoreId !== core.id))) {
            this.coreState.set(null);
            this.editionState.set(null);
            this.notFound.set(true);
            return;
          }
          this.coreState.set(core);
          this.editionState.set(edition);
        }),
        catchError((error: unknown) => {
          this.coreState.set(null);
          this.editionState.set(null);
          return throwError(() => error);
        }),
        finalize(() => this.loading.set(false)),
      );
    });
  }

  save(payload: IEventSavePayload, file: File | null): Observable<EventEditionSaveResult> {
    return defer(() => {
      this.operation.set('save');
      return this.admin.saveEditionWithCover(
        payload, file, this.edition()?.coverImagePath ?? null,
      ).pipe(
        tap((result) => {
          if (result.status === 'saved') this.editionState.set(result.edition);
        }),
        finalize(() => this.operation.set(null)),
      );
    });
  }

  publish(coreId: string, eventId: string): Observable<EventPublishResult> {
    return defer(() => {
      this.operation.set('publish');
      this.publishResult.set(null);
      return this.admin.publishStaffingEvent(eventId).pipe(
        tap((result) => this.publishResult.set(result)),
        switchMap((result) => this.load(coreId, eventId).pipe(
          map(() => {
            if (!this.edition() || !this.core()) {
              throw new Error('Published Event is missing from the admin read.');
            }
            return result;
          }),
        )),
        finalize(() => this.operation.set(null)),
      );
    });
  }

  updateEdition(edition: IAdminEventDetail): void {
    this.editionState.set(edition);
  }

  private programOccurrenceId(programItemId: string): string | null {
    return this.timeline()?.occurrences.find((occurrence) => occurrence.rows.some((row) =>
      row.programItemId === programItemId && row.session !== null &&
        (row.programStatus === EventProgramItemStatus.Approved || row.programStatus === EventProgramItemStatus.Published),
    ))?.occurrenceId ?? null;
  }

  private setParticipants(programItemId: string, state: ProgramParticipantsState): void {
    this.participantStates.update((states) => new Map(states).set(programItemId, state));
  }

  private readParticipants(programItemId: string, occurrenceId: string): Observable<AdminEventProgramParticipants> {
    return this.admin.getProgramParticipants(programItemId).pipe(map((data) => {
      assertEdgeContract(data?.programItemId === programItemId && data.occurrenceId === occurrenceId,
        'programParticipants', 'participants of the selected session and occurrence');
      return data;
    }));
  }

  private readEdition(edition: IAdminEventDetail): Observable<IAdminEventDetail> {
    return this.admin.getEditionDetail(edition.id).pipe(map((detail) => {
      assertEdgeContract(detail !== null && detail.id === edition.id && detail.eventCoreId === edition.eventCoreId,
        'eventEdition', 'the current Edition readback');
      return detail;
    }));
  }
}
