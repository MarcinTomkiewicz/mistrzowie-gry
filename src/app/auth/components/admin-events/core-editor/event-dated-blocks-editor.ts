import { Component, computed, inject } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MessageModule } from 'primeng/message';
import { SelectModule } from 'primeng/select';
import { ToggleSwitchModule } from 'primeng/toggleswitch';

import { ContextHelp } from '../../../../common/context-help/context-help';
import { formatDateLabel } from '../../../../core/utils/date';
import { resolveEventCoreAdminErrorMessage } from '../event-admin-errors';
import { createEventCoreEditorI18n } from './core-editor.i18n';
import { EventDatedBlocksController } from './event-dated-blocks-controller';
import { EventGlobalTimeBlocks } from './event-global-time-blocks';
import { EventGlobalTimeBlocksSummary } from './event-global-time-blocks-summary';
import { sameScheduleBlocks } from './event-global-schedule-state';

@Component({
  selector: 'app-event-dated-blocks-editor',
  imports: [FormsModule, ReactiveFormsModule, MessageModule, SelectModule, ToggleSwitchModule,
    EventGlobalTimeBlocks, EventGlobalTimeBlocksSummary, ContextHelp],
  templateUrl: './event-dated-blocks-editor.html',
  host: { class: 'd-block w-100 min-w-0' },
})
export class EventDatedBlocksEditor {
  protected readonly editor = inject(EventDatedBlocksController);
  protected readonly i18n = createEventCoreEditorI18n();
  protected readonly formatDateLabel = formatDateLabel;
  protected readonly dateOptions = computed(() => this.editor.calendar()?.datedTimeBlocks.map(row => ({
    value: row.date, label: formatDateLabel(row.date),
  })) ?? []);
  protected readonly scopeOptions = computed(() => [
    { value: 'date', label: this.i18n.datedBlocks().dateScope },
    ...((this.editor.calendar()?.cities.length ?? 0) > 1
      ? this.editor.day()?.cities.map(row => ({ value: row.editionId, label: row.city })) ?? [] : []),
  ]);
  protected readonly readOnly = computed(() => this.editor.contextBlocker() !== null);
  protected readonly showScope = computed(() => this.scopeOptions().length > 1 && this.editor.canEdit() &&
    !this.editor.isBusy() && !this.editor.readbackPending() && !this.editor.conflicted());
  protected readonly readOnlyCities = computed(() => this.editor.editionId() ? [] :
    this.editor.day()?.cities.filter(city => !sameScheduleBlocks(city.timeBlocks, this.editor.currentBlocks())) ?? []);
  protected readonly selectionLocked = computed(() => this.editor.isBusy() || this.editor.isDirty() || this.editor.readbackPending());
  protected readonly errorMessage = computed(() => this.editor.error() === null ? null : resolveEventCoreAdminErrorMessage(
    this.editor.error(), this.i18n.rpcErrors(), this.i18n.commonErrors().concurrentModification,
  ));
  protected readonly exceptions = computed(() => {
    const calendar = this.editor.calendar();
    return calendar?.datedTimeBlocks.map(day => ({ ...day,
      ownBlocks: !sameScheduleBlocks(day.timeBlocks, calendar.timeBlocks),
      cities: day.cities.filter(city => !sameScheduleBlocks(city.timeBlocks, day.timeBlocks)),
    })).filter(day => (day.ownBlocks || day.cities.length > 0) && (!this.readOnly() || day.date !== this.editor.date())) ?? [];
  });

  protected select(value: unknown, scope: 'date' | 'city'): void {
    if (typeof value === 'string') this.editor.select(scope === 'date' ? value : this.editor.date(),
      scope === 'city' && value !== 'date' ? value : '');
  }
}
