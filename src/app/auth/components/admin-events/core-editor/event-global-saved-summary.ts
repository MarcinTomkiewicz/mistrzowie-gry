import { afterNextRender, Component, computed, effect, inject, input, output, signal, untracked } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';
import { TableModule } from 'primeng/table';

import type { EventGlobalSavedSnapshot } from '../../../../core/interfaces/i-event-global-saved-summary';
import { EventAdmin } from '../../../../core/services/event-admin/event-admin';
import { formatDateLabel } from '../../../../core/utils/date';
import { resolveEventCoreAdminErrorMessage } from '../event-admin-errors';
import { createEventEditionEditorI18n } from '../edition-editor/edition-editor.i18n';
import { createEventCoreEditorI18n } from './core-editor.i18n';
import { EventGlobalDraftSummary } from './event-global-draft-summary';
import { readEventGlobalSavedSummary } from './event-global-saved-summary-state';

@Component({
  selector: 'app-event-global-saved-summary',
  imports: [ButtonModule, MessageModule, TableModule, EventGlobalDraftSummary],
  templateUrl: './event-global-saved-summary.html',
  host: { class: 'flex-col-start-stretch gap-md w-100 min-w-0' },
})
export class EventGlobalSavedSummary {
  readonly coreId = input.required<string>();
  readonly disabled = input(false);
  readonly navigateToStep = output<number>();
  protected readonly i18n = createEventCoreEditorI18n();
  private readonly editionI18n = createEventEditionEditorI18n();
  protected readonly formatDateLabel = formatDateLabel;
  protected readonly loading = signal(true);
  protected readonly snapshot = signal<EventGlobalSavedSnapshot | null>(null);
  private readonly error = signal<unknown | null>(null);
  private readonly admin = inject(EventAdmin);
  private readonly browserReady = signal(false);
  private readonly readAttempt = signal(0);
  protected readonly errorMessage = computed(() => this.error() === null ? null : resolveEventCoreAdminErrorMessage(
    this.error(), this.i18n.rpcErrors(), this.i18n.commonErrors().concurrentModification,
  ));
  protected readonly cities = computed(() => {
    const copy = this.i18n.savedSummary();
    const statuses = this.editionI18n.occurrenceStatuses();
    return this.snapshot()?.cities.map(entry => ({
      city: entry.city,
      dates: entry.dates.map(date => ({
        ...date,
        participationLabel: copy.participation[date.participation],
        globalStatusLabel: date.globalStatus ? copy.calendarStatuses[date.globalStatus] : null,
        occurrenceStatusLabel: date.occurrenceStatus ? statuses[date.occurrenceStatus] : null,
      })),
    })) ?? [];
  });

  constructor() {
    // Privileged reads run in the browser, following EventGlobalProgram's boundary.
    afterNextRender(() => this.browserReady.set(true));
    effect(onCleanup => {
      const ready = this.browserReady();
      const coreId = this.coreId();
      this.readAttempt();
      untracked(() => {
        this.snapshot.set(null);
        this.error.set(null);
        this.loading.set(true);
        if (!ready) return;
        const subscription = readEventGlobalSavedSummary(this.admin, coreId).subscribe({
          next: snapshot => { this.snapshot.set(snapshot); this.loading.set(false); },
          error: (error: unknown) => { this.error.set(error); this.loading.set(false); },
        });
        onCleanup(() => subscription.unsubscribe());
      });
    });
  }

  protected refresh(): void {
    if (!this.loading()) this.readAttempt.update(value => value + 1);
  }
}
