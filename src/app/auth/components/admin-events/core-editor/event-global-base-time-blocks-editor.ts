import { Component, computed, inject } from '@angular/core';
import { MessageModule } from 'primeng/message';

import { ContextHelp } from '../../../../common/context-help/context-help';
import { resolveEventCoreAdminErrorMessage } from '../event-admin-errors';
import { createEventCoreEditorI18n } from './core-editor.i18n';
import { EventGlobalBaseTimeBlocksController } from './event-global-base-time-blocks-controller';
import { EventGlobalTimeBlocks } from './event-global-time-blocks';
import { EventGlobalTimeBlocksSummary } from './event-global-time-blocks-summary';

@Component({
  selector: 'app-event-global-base-time-blocks-editor',
  imports: [MessageModule, EventGlobalTimeBlocks, EventGlobalTimeBlocksSummary, ContextHelp],
  templateUrl: './event-global-base-time-blocks-editor.html',
  host: { class: 'd-block w-100 min-w-0' },
})
export class EventGlobalBaseTimeBlocksEditor {
  protected readonly editor = inject(EventGlobalBaseTimeBlocksController);
  protected readonly i18n = createEventCoreEditorI18n();
  protected readonly copy = this.i18n.baseTimeBlocks;
  protected readonly readOnly = computed(() => this.editor.contextBlocker() === 'protected' || this.editor.contextBlocker() === 'active');
  protected readonly errorMessage = computed(() => {
    if (this.editor.readbackPending()) return this.copy().readbackPending;
    if (this.editor.conflicted()) return this.copy().conflict;
    const error = this.editor.error();
    return error === null ? null : resolveEventCoreAdminErrorMessage(error, this.i18n.rpcErrors(), this.copy().conflict);
  });
}
