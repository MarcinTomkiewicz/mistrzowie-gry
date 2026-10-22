import { Component, DestroyRef, computed, inject, input, output, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';

import { LoadingOverlay } from '../../../../common/loading-overlay/loading-overlay';
import { EventProgramItemStatus } from '../../../../core/enums/event';
import type { AdminEventTimeline } from '../../../../core/interfaces/i-admin-event-timeline';
import { UiConfirm } from '../../../../core/services/ui-confirm/ui-confirm';
import { UiToast } from '../../../../core/services/ui-toast/ui-toast';
import { formatDateLabel } from '../../../../core/utils/date';
import { formatTimeLabel } from '../../../../core/utils/time-format';
import { resolveEventEditionAdminErrorMessage } from '../event-admin-errors';
import { EventEditionEditorFacade } from '../edition-editor/event-edition-editor-facade';
import { createEventAdminTimelineI18n } from './event-admin-timeline.i18n';

@Component({
  selector: 'app-event-admin-timeline',
  imports: [ButtonModule, TableModule, LoadingOverlay],
  templateUrl: './event-admin-timeline.html',
  host: { class: 'd-block w-100 min-w-0' },
})
export class EventAdminTimeline {
  private readonly facade = inject(EventEditionEditorFacade);
  private readonly destroyRef = inject(DestroyRef);
  private readonly confirm = inject(UiConfirm);
  private readonly toast = inject(UiToast);
  readonly timeline = input<AdminEventTimeline | null>(null);
  readonly loading = input(false);
  readonly error = input<unknown>(null);
  readonly disabled = input(false);
  readonly reload = output<void>();

  protected readonly i18n = createEventAdminTimelineI18n();
  protected readonly expandedProgramItemId = signal<string | null>(null);
  protected readonly participants = this.facade.programParticipants;
  protected readonly removingParticipantId = this.facade.removingParticipantId;
  protected readonly formatDateLabel = formatDateLabel;
  protected readonly formatTimeLabel = formatTimeLabel;
  protected readonly errorMessage = computed(() => this.error()
    ? resolveEventEditionAdminErrorMessage(this.error(), this.i18n.rpcErrors(), this.i18n.errors().concurrentModification)
    : null);
  protected readonly days = computed(() => {
    const timeline = this.timeline();
    if (!timeline) return [];
    const copy = this.i18n.copy();
    const values = this.i18n.values();
    const statuses = this.i18n.entityStatuses();
    const candidateStates = { ...copy.candidateStates, pending: this.i18n.statusPhrases().awaitingAcceptance };
    return [...timeline.occurrences].sort((a, b) => a.date.localeCompare(b.date)).map((occurrence) => ({
      occurrence,
      rows: occurrence.rows.map((row) => ({
        key: `${row.source}:${row.slotId ?? ''}:${row.sourceFinalPlanItemId ?? row.programItemId ?? ''}`,
        participantProgramItemId: row.programItemId && row.session !== null &&
          (row.programStatus === EventProgramItemStatus.Approved || row.programStatus === EventProgramItemStatus.Published)
          ? row.programItemId : null,
        row,
        title: row.session ? row.session.title ?? values.notProvided : copy.unassigned,
        host: row.host ? row.host.displayName : copy.noHost,
        status: statuses[row.status].feminine,
        programStatus: row.programStatus === null ? null : statuses[row.programStatus].feminine,
        source: copy.sources[row.source],
        candidate: row.source === 'staffing' && row.candidateState !== null
          ? candidateStates[row.candidateState] : null,
      })),
    }));
  });

  protected toggleParticipants(programItemId: string): void {
    if (this.disabled() || this.loading()) return;
    const expanded = this.expandedProgramItemId() !== programItemId;
    this.expandedProgramItemId.set(expanded ? programItemId : null);
    if (expanded) this.facade.loadProgramParticipants(programItemId);
  }

  protected refresh(): void {
    if (this.disabled() || this.loading()) return;
    const programItemId = this.expandedProgramItemId();
    if (programItemId) this.facade.loadProgramParticipants(programItemId);
    this.reload.emit();
  }

  protected reloadParticipants(programItemId: string): void {
    if (!this.disabled() && !this.loading()) this.facade.loadProgramParticipants(programItemId);
  }

  protected confirmRemoval(event: Event, programItemId: string, registrationId: string): void {
    if (this.disabled() || this.loading()) return;
    const eventId = this.timeline()?.eventId;
    const copy = this.i18n.copy();
    this.confirm.dangerDecision(event, {
      message: copy.participantRemoveConfirm,
      acceptLabel: this.i18n.actions().delete,
      rejectLabel: this.i18n.actions().cancel,
      accept: () => {
        if (this.destroyRef.destroyed || this.disabled() || this.loading() || this.timeline()?.eventId !== eventId) return;
        this.facade.removeProgramParticipant(programItemId, registrationId).pipe(
          takeUntilDestroyed(this.destroyRef),
        ).subscribe({
          next: (result) => {
            if (result === 'refreshFailed') this.toast.warn({ summary: copy.participantsRefreshFailed });
            else this.toast.success({ summary: this.i18n.status().success });
          },
          error: () => this.toast.danger({ summary: copy.participantRemoveFailed, detail: this.i18n.errors().generic }),
        });
      },
    });
  }
}
