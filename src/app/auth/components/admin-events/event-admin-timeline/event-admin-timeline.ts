import { Component, DestroyRef, computed, effect, inject, input, output, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';

import { LoadingOverlay } from '../../../../common/loading-overlay/loading-overlay';
import type { AdminEventTimeline } from '../../../../core/interfaces/i-admin-event-timeline';
import type { AdminEventProgramParticipants } from '../../../../core/interfaces/i-event-admin';
import { EventAdmin } from '../../../../core/services/event-admin/event-admin';
import { resolveEventEditionAdminErrorMessage } from '../event-admin-errors';
import { createEventAdminTimelineI18n } from './event-admin-timeline.i18n';
import { EventProgramSchedule } from '../event-program-schedule/event-program-schedule';

type ProgramParticipantsState =
  | { kind: 'loading' }
  | { kind: 'error'; error: unknown }
  | { kind: 'ready'; data: AdminEventProgramParticipants };

@Component({
  selector: 'app-event-admin-timeline',
  imports: [ButtonModule, TableModule, LoadingOverlay, EventProgramSchedule],
  templateUrl: './event-admin-timeline.html',
  host: { class: 'd-block w-100 min-w-0' },
})
export class EventAdminTimeline {
  private readonly admin = inject(EventAdmin);
  private readonly destroyRef = inject(DestroyRef);
  readonly timeline = input<AdminEventTimeline | null>(null);
  readonly loading = input(false);
  readonly error = input<unknown>(null);
  readonly disabled = input(false);
  readonly reload = output<void>();

  protected readonly i18n = createEventAdminTimelineI18n();
  protected readonly expandedProgramItemId = signal<string | null>(null);
  protected readonly participants = signal<ReadonlyMap<string, ProgramParticipantsState>>(new Map());
  protected readonly errorMessage = computed(() => this.error() === null ? null
    : resolveEventEditionAdminErrorMessage(this.error(), this.i18n.rpcErrors(), this.i18n.errors().concurrentModification));

  constructor() {
    effect(() => {
      this.timeline();
      this.expandedProgramItemId.set(null);
      this.participants.set(new Map());
    });
  }

  protected toggleParticipants(programItemId: string): void {
    if (this.disabled() || this.loading()) return;
    const expanded = this.expandedProgramItemId() !== programItemId;
    this.expandedProgramItemId.set(expanded ? programItemId : null);
    if (expanded) this.reloadParticipants(programItemId);
  }

  protected refresh(): void {
    if (this.disabled() || this.loading()) return;
    this.reload.emit();
  }

  protected reloadParticipants(programItemId: string): void {
    if (this.disabled() || this.loading()) return;
    const timeline = this.timeline();
    const occurrence = timeline?.occurrences.find(day => day.rows.some(row => row.programItemId === programItemId && row.session !== null));
    if (!occurrence || this.participants().get(programItemId)?.kind === 'loading') return;
    const pending: ProgramParticipantsState = { kind: 'loading' };
    this.setParticipants(programItemId, pending);
    this.admin.getProgramParticipants(programItemId, occurrence.occurrenceId).pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: data => {
        if (this.timeline() === timeline && this.participants().get(programItemId) === pending) {
          this.setParticipants(programItemId, { kind: 'ready', data });
        }
      },
      error: (error: unknown) => {
        if (this.timeline() === timeline) this.setParticipants(programItemId, { kind: 'error', error });
      },
    });
  }

  private setParticipants(programItemId: string, state: ProgramParticipantsState): void {
    this.participants.update(states => new Map(states).set(programItemId, state));
  }
}
