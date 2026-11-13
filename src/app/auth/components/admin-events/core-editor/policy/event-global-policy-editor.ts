import { Component, computed, DestroyRef, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';
import { EMPTY, finalize, switchMap } from 'rxjs';

import { UiConfirm } from '../../../../../core/services/ui-confirm/ui-confirm';
import { UiToast } from '../../../../../core/services/ui-toast/ui-toast';
import { resolveEventCoreAdminErrorMessage } from '../../event-admin-errors';
import { createEventCoreEditorI18n } from '../core-editor.i18n';
import { EventGlobalPolicyFacade } from './event-global-policy-facade';
import { EventGlobalPriceEditor } from './event-global-price-editor';
import { EventGlobalRulesEditor } from './event-global-rules-editor';
import type { AdminGlobalEventPageFieldError } from '../../../../../core/interfaces/i-admin-global-event-preview';
import { EventGlobalDiagnosticMessages, selectEventGlobalDiagnosticIssues } from '../event-global-diagnostic-messages';

@Component({
  selector: 'app-event-global-policy-editor',
  imports: [ReactiveFormsModule, ButtonModule, MessageModule, EventGlobalPriceEditor, EventGlobalRulesEditor, EventGlobalDiagnosticMessages],
  templateUrl: './event-global-policy-editor.html',
  host: { class: 'd-block w-100 min-w-0' },
})
export class EventGlobalPolicyEditor {
  readonly fieldErrors = input<readonly AdminGlobalEventPageFieldError[]>([]);
  protected readonly policyIssues = computed(() => selectEventGlobalDiagnosticIssues(this.fieldErrors(), ['policy']));
  protected readonly editor = inject(EventGlobalPolicyFacade);
  protected readonly i18n = createEventCoreEditorI18n();
  protected readonly copy = this.i18n.policyEditor;
  protected readonly deciding = signal(false);
  private readonly confirm = inject(UiConfirm);
  private readonly toast = inject(UiToast);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly errorMessage = computed(() => {
    if (this.editor.readbackPending()) return this.copy().readbackPending;
    const issue = this.editor.issue();
    if (issue) return this.copy()[issue];
    const error = this.editor.error();
    return error === null ? null : resolveEventCoreAdminErrorMessage(error, this.i18n.rpcErrors(), this.i18n.commonErrors().generic);
  });

  protected reload(): void {
    if (!this.editor.canReload() || this.deciding()) return;
    const coreId = this.editor.draft()?.coreId;
    this.deciding.set(true);
    this.confirm.modalDecision({ header: this.copy().discard, message: this.copy().discardConfirm,
      acceptLabel: this.copy().discard, rejectLabel: this.i18n.commonActions().cancel,
    }).pipe(switchMap(accepted => accepted && coreId === this.editor.draft()?.coreId ? this.editor.reload() : EMPTY),
      finalize(() => this.deciding.set(false)), takeUntilDestroyed(this.destroyRef)).subscribe({
      error: error => this.toast.danger({ summary: this.i18n.page().loadErrorTitle,
        detail: resolveEventCoreAdminErrorMessage(error, this.i18n.rpcErrors(), this.i18n.commonErrors().generic) }),
    });
  }
}
