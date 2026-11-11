import { Component, computed, inject } from '@angular/core';
import { MessageModule } from 'primeng/message';

import { resolveEventCoreAdminErrorMessage } from '../event-admin-errors';
import { EventScheduleEditor } from '../edition-editor/event-schedule-editor';
import { createEventCoreEditorI18n } from './core-editor.i18n';
import { EventGlobalScheduleController } from './event-global-schedule-controller';

@Component({
  selector: 'app-event-global-schedule-editor',
  imports: [MessageModule, EventScheduleEditor],
  templateUrl: './event-global-schedule-editor.html',
  host: { class: 'd-block w-100 min-w-0' },
})
export class EventGlobalScheduleEditor {
  protected readonly editor = inject(EventGlobalScheduleController);
  protected readonly i18n = createEventCoreEditorI18n();
  protected readonly copy = this.i18n.schedule;
  protected readonly errorMessage = computed(() => {
    const issue = this.editor.issue();
    if (this.editor.state().endsWith('uncertain')) return this.copy().uncertain;
    if (issue) return this.copy()[issue];
    if (this.editor.state().endsWith('readback')) return this.copy().readback;
    const error = this.editor.error();
    return error === null ? null : resolveEventCoreAdminErrorMessage(error, this.i18n.rpcErrors(), this.copy().conflict);
  });
}
