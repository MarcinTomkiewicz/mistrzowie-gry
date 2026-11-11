import { Component, computed, inject } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MessageModule } from 'primeng/message';

import { resolveEventCoreAdminErrorMessage } from '../../event-admin-errors';
import { createEventCoreEditorI18n } from '../core-editor.i18n';
import { EventGlobalPolicyFacade } from './event-global-policy-facade';
import { EventGlobalPriceEditor } from './event-global-price-editor';
import { EventGlobalRulesEditor } from './event-global-rules-editor';

@Component({
  selector: 'app-event-global-policy-editor',
  imports: [ReactiveFormsModule, MessageModule, EventGlobalPriceEditor, EventGlobalRulesEditor],
  templateUrl: './event-global-policy-editor.html',
  host: { class: 'd-block w-100 min-w-0' },
})
export class EventGlobalPolicyEditor {
  protected readonly editor = inject(EventGlobalPolicyFacade);
  protected readonly i18n = createEventCoreEditorI18n();
  protected readonly copy = this.i18n.policyEditor;
  protected readonly errorMessage = computed(() => {
    if (this.editor.readbackPending()) return this.copy().readbackPending;
    const issue = this.editor.issue();
    if (issue) return this.copy()[issue];
    const error = this.editor.error();
    return error === null ? null : resolveEventCoreAdminErrorMessage(error, this.i18n.rpcErrors(), this.copy().conflict);
  });
}
