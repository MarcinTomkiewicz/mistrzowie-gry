import { afterNextRender, computed, DestroyRef, effect, inject, Injectable, signal, untracked } from '@angular/core';
import { catchError, defer, finalize, map, Observable, of, Subscription, switchMap, throwError } from 'rxjs';

import type {
  AdminEventProgramOfflineSeats, AdminEventProgramOfflineSeatsAdjustment, AdminEventProgramOfflineSeatsItem, EventOfflineSeatsDelta,
} from '../../../core/interfaces/i-event-admin';
import { assertOfflineSeatsPublicScope } from '../../../core/reads/events/admin-event-offline-seats.contract';
import { Auth } from '../../../core/services/auth/auth';
import { EventAdmin } from '../../../core/services/event-admin/event-admin';
import { RpcError } from '../../../core/types/rpc-error';
import { assertEdgeContract } from '../../../core/utils/edge-contract';
import { EventPageFacade } from './event-page-facade';
import { EventParticipantAvailability } from './event-participant-availability';
import { EventParticipantSignupFacade } from './event-participant-signup-facade';

type OfflineSeatsOperation = {
  item: AdminEventProgramOfflineSeatsItem;
  delta: EventOfflineSeatsDelta;
  result: AdminEventProgramOfflineSeatsAdjustment | null;
};

@Injectable()
export class EventProgramOfflineSeats {
  private readonly admin = inject(EventAdmin);
  private readonly auth = inject(Auth);
  private readonly page = inject(EventPageFacade);
  private readonly availability = inject(EventParticipantAvailability);
  private readonly signup = inject(EventParticipantSignupFacade);
  private readonly clientReady = signal(false);
  private readonly inventory = signal<AdminEventProgramOfflineSeats | null>(null);
  private readonly pending = signal<OfflineSeatsOperation | null>(null);
  private readonly busy = signal(false);
  private request: Subscription | null = null;
  private ownerId: string | null = null;
  readonly isAdmin = computed(() => this.clientReady() && this.auth.isReady() &&
    this.auth.userId() !== null && this.auth.hasRole('admin'));
  readonly isBusy = this.busy.asReadonly();
  readonly locked = computed(() => this.pending() !== null);
  readonly operation = computed(() => this.isAdmin() ? this.pending() : null);
  readonly error = signal<{ cause: unknown; programItemId: string | null } | null>(null);
  readonly feedback = signal<{ programItemId: string; kind: 'verified' | 'abandoned' } | null>(null);
  readonly canEndReadback = computed(() => this.isAdmin() && this.locked() && !this.isBusy());

  constructor() {
    // Private inventory is client memory only. Never fetch it during SSR or put it in public page/card DTOs.
    afterNextRender(() => this.clientReady.set(true));
    effect(() => {
      const userId = this.auth.userId();
      const admin = this.isAdmin();
      const role = this.auth.appRole();
      const page = this.page.state();
      const program = this.page.programState();
      untracked(() => {
        if (page.kind !== 'ready' || this.inventory()?.eventId !== page.edition.id) {
          this.feedback.set(null);
        }
        if (userId !== this.ownerId || role !== 'admin') {
          this.request?.unsubscribe();
          this.ownerId = userId;
          this.inventory.set(null);
          this.pending.set(null);
          this.error.set(null);
          this.feedback.set(null);
        }
        if (!admin || this.pending()) return;
        this.request?.unsubscribe();
        this.inventory.set(null);
        if (page.kind === 'ready' && program.kind === 'ready' && program.eventId === page.edition.id) {
          this.error.set(null);
          this.run(this.readInventory(page.edition.id));
        }
      });
    });
    inject(DestroyRef).onDestroy(() => this.request?.unsubscribe());
  }

  forProgramItem(programItemId: string | null): AdminEventProgramOfflineSeatsItem | null {
    const page = this.page.state();
    const inventory = this.inventory();
    const occurrence = this.page.selectedOccurrence();
    if (!this.isAdmin() || page.kind !== 'ready' || inventory?.eventId !== page.edition.id || !occurrence) return null;
    return inventory.items.find(item => item.programItemId === programItemId && item.occurrenceId === occurrence.id &&
      item.occurrenceDate === occurrence.occurrenceDate) ?? null;
  }

  refresh(): void {
    const page = this.page.state();
    if (!this.isAdmin() || page.kind !== 'ready' || this.isBusy() || this.locked()) return;
    this.error.set(null);
    this.run(this.readInventory(page.edition.id).pipe(switchMap(() => this.availability.refresh(page.edition.id))));
  }

  adjust(programItemId: string, delta: EventOfflineSeatsDelta): void {
    const item = this.forProgramItem(programItemId);
    if (!item || this.isBusy() || this.locked() || this.signup.isSubmitting() ||
      (delta !== 1 && delta !== -1) || (delta === 1 ? item.remainingOnlineSeats === 0 : item.offlineOccupiedSeats === 0)) return;
    this.error.set(null);
    this.feedback.set(null);
    const context: OfflineSeatsOperation = { item, delta, result: null };
    this.pending.set(context);
    const write = this.admin.adjustProgramOfflineSeats(programItemId, delta).pipe(map(result => {
      assertEdgeContract(result.eventId === item.eventId && result.occurrenceId === item.occurrenceId,
        'offlineSeats.adjustmentScope', 'the exact selected Edition and occurrence');
      const confirmed: OfflineSeatsOperation = { ...context, result };
      this.pending.set(confirmed);
      return confirmed;
    }), catchError((error: unknown) => {
      this.error.set({ cause: error, programItemId });
      if (error instanceof RpcError && ['42501', '22023', 'P0002', '23514'].includes(error.code)) {
        this.pending.set(null);
        return this.readInventory(item.eventId).pipe(switchMap(() => this.availability.refresh(item.eventId)), map(() => null));
      }
      // Delta has no idempotency key. An uncertain command can only be followed by reads.
      return throwError(() => error);
    }));
    this.run(write.pipe(switchMap(operation => operation ? this.readback(operation) : of(null))), programItemId);
  }

  retryReadback(): void {
    const operation = this.operation();
    if (!operation || this.isBusy()) return;
    this.error.set(null);
    this.run(this.readback(operation), operation.item.programItemId);
  }

  endReadback(): boolean {
    const operation = this.operation();
    if (!operation || !this.canEndReadback()) return false;
    this.pending.set(null);
    this.error.set(null);
    this.feedback.set({ programItemId: operation.item.programItemId, kind: 'abandoned' });
    this.refresh();
    return true;
  }

  private readInventory(eventId: string) {
    return defer(() => {
      const page = this.page.state();
      const program = this.page.programState();
      assertEdgeContract(this.isAdmin() && this.auth.userId() === this.ownerId && page.kind === 'ready' && page.edition.id === eventId &&
        program.kind === 'ready' && program.eventId === eventId,
        'offlineSeats.actorScope', 'the current client administrator and public Edition');
      return this.admin.getProgramOfflineSeats(eventId).pipe(map(inventory => {
        assertOfflineSeatsPublicScope(inventory, program);
        assertEdgeContract(this.isAdmin() && this.auth.userId() === this.ownerId && this.page.state() === page && this.page.programState() === program,
          'offlineSeats.readbackScope', 'the same administrator and public page after the authoritative read');
        this.inventory.set(inventory);
        return inventory;
      }));
    });
  }

  private readback(operation: OfflineSeatsOperation) {
    return this.readInventory(operation.item.eventId).pipe(switchMap(inventory =>
      this.availability.refresh(operation.item.eventId).pipe(map(availability => {
        const item = operation.item;
        assertEdgeContract(this.operation() === operation && inventory.items.some(row => row.programItemId === item.programItemId &&
          row.occurrenceId === item.occurrenceId && row.occurrenceDate === item.occurrenceDate) &&
          availability.some(row => row.programItemId === item.programItemId && row.occurrenceId === item.occurrenceId),
        'offlineSeats.readback', 'the same session, occurrence and date in admin inventory and refreshed public availability');
        // Concurrent bookings/admin deltas may change counts after the reply. Display GET data, never old +/- delta or reply counters.
        if (operation.result !== null) {
          this.pending.set(null);
          this.feedback.set({ programItemId: item.programItemId, kind: 'verified' });
        }
        return inventory;
      }))));
  }

  private run(request: Observable<unknown>, programItemId: string | null = null): void {
    this.busy.set(true);
    this.request = request.pipe(finalize(() => this.busy.set(false))).subscribe({
      error: (cause: unknown) => { if (this.error() === null) this.error.set({ cause, programItemId }); },
    });
  }
}
