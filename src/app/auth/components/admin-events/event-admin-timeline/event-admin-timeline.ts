import { Component, computed, input, output } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';

import { LoadingOverlay } from '../../../../common/loading-overlay/loading-overlay';
import type { AdminEventTimeline } from '../../../../core/interfaces/i-admin-event-timeline';
import { formatDateLabel } from '../../../../core/utils/date';
import { formatTimeLabel } from '../../../../core/utils/time-format';
import { resolveEventEditionAdminErrorMessage } from '../event-admin-errors';
import { createEventAdminTimelineI18n } from './event-admin-timeline.i18n';

@Component({
  selector: 'app-event-admin-timeline',
  imports: [ButtonModule, TableModule, LoadingOverlay],
  templateUrl: './event-admin-timeline.html',
  host: { class: 'd-block w-100 min-w-0' },
})
export class EventAdminTimeline {
  readonly timeline = input<AdminEventTimeline | null>(null);
  readonly loading = input(false);
  readonly error = input<unknown>(null);
  readonly disabled = input(false);
  readonly reload = output<void>();

  protected readonly i18n = createEventAdminTimelineI18n();
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
}
