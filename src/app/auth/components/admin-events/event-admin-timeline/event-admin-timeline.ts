import { Component, DestroyRef, computed, inject, input, output, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';

import { LoadingOverlay } from '../../../../common/loading-overlay/loading-overlay';
import type { AdminEventTimeline } from '../../../../core/interfaces/i-admin-event-timeline';
import { UiConfirm } from '../../../../core/services/ui-confirm/ui-confirm';
import { UiToast } from '../../../../core/services/ui-toast/ui-toast';
import { formatDateLabel } from '../../../../core/utils/date';
import { resolveEventEditionAdminErrorMessage } from '../event-admin-errors';
import { EventEditionEditorFacade } from '../edition-editor/event-edition-editor-facade';
import { createEventAdminTimelineI18n } from './event-admin-timeline.i18n';
import { presentEventTimelineRows } from './event-admin-timeline-presenter';

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
  protected readonly errorMessage = computed(() => this.error()
    ? resolveEventEditionAdminErrorMessage(this.error(), this.i18n.rpcErrors(), this.i18n.errors().concurrentModification)
    : null);
  protected readonly days = computed(() => {
    const timeline = this.timeline();
    if (!timeline) return [];
    return [...timeline.occurrences].sort((a, b) => a.date.localeCompare(b.date)).map((occurrence) => ({
      occurrence,
      rows: presentEventTimelineRows(occurrence.rows, this.i18n),
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
