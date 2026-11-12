import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';

import { formatDateLabel } from '../../../../core/utils/date';
import { resolveEventCoreAdminErrorMessage } from '../event-admin-errors';
import { EventScheduleEditor } from '../edition-editor/event-schedule-editor';
import { createEventScheduleEditorI18n } from '../edition-editor/edition-editor.i18n';
import { createEventCoreEditorI18n } from './core-editor.i18n';
import { EventGlobalDraftController } from './event-global-draft-controller';
import { EventGlobalScheduleController } from './event-global-schedule-controller';

@Component({
  selector: 'app-event-global-schedule-editor',
  imports: [MessageModule, EventScheduleEditor, ButtonModule, RouterLink],
  templateUrl: './event-global-schedule-editor.html',
  host: { class: 'd-block w-100 min-w-0' },
})
export class EventGlobalScheduleEditor {
  protected readonly editor = inject(EventGlobalScheduleController);
  protected readonly i18n = createEventCoreEditorI18n();
  protected readonly copy = this.i18n.schedule;
  private readonly global = inject(EventGlobalDraftController);
  private readonly scheduleI18n = createEventScheduleEditorI18n();
  protected readonly formatDateLabel = formatDateLabel;
  protected readonly staffingConverted = computed(() => {
    const edition = this.global.mainEdition();
    const calendar = this.editor.calendar();
    return !!calendar && edition?.id === calendar.mainEditionId && edition.eventCoreId === calendar.coreId && edition.isStaffingConverted;
  });
  protected readonly savedDates = computed(() => [...(this.editor.calendar()?.globalDates ?? [])].sort((a, b) => a.date.localeCompare(b.date)));
  protected readonly savedScheduleKind = computed(() => {
    const kind = this.editor.calendar()?.schedule.kind;
    const options = this.scheduleI18n.options();
    return kind === 'single' ? options.single : kind === 'recurring' ? options.recurring : options.exactDates;
  });
  protected readonly errorMessage = computed(() => {
    const issue = this.editor.issue();
    if (this.editor.state().endsWith('uncertain')) return this.copy().uncertain;
    if (this.editor.state().endsWith('readback')) return this.copy().readback;
    if (issue !== null && issue === this.editor.contextBlocker()) return null;
    if (issue) return issue === 'active' ? this.copy().blockers.active : this.copy()[issue];
    const error = this.editor.error();
    return error === null ? null : resolveEventCoreAdminErrorMessage(error, this.i18n.rpcErrors(), this.copy().conflict);
  });
}
