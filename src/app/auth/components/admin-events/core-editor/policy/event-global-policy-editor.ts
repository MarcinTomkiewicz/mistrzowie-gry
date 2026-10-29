import { Component, computed, DestroyRef, effect, inject, input, untracked } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';
import type { Observable } from 'rxjs';

import type { IEventCoreDetail } from '../../../../../core/interfaces/i-event-admin';
import { UiConfirm } from '../../../../../core/services/ui-confirm/ui-confirm';
import { UiToast } from '../../../../../core/services/ui-toast/ui-toast';
import { RpcError } from '../../../../../core/types/rpc-error';
import { resolveEventCoreAdminErrorMessage } from '../../event-admin-errors';
import { createEventCoreEditorI18n } from '../core-editor.i18n';
import { EventGlobalPolicySummary } from './event-global-policy-summary';
import { EventGlobalPolicyFacade } from './event-global-policy-facade';
import { EventGlobalPriceEditor } from './event-global-price-editor';
import { EventGlobalRulesEditor } from './event-global-rules-editor';

@Component({
  selector: 'app-event-global-policy-editor',
  imports: [ReactiveFormsModule, ButtonModule, MessageModule, EventGlobalPolicySummary, EventGlobalPriceEditor, EventGlobalRulesEditor],
  templateUrl: './event-global-policy-editor.html',
  host: { class: 'd-block w-100 min-w-0' },
})
export class EventGlobalPolicyEditor {
  readonly core = input.required<IEventCoreDetail>();
  readonly blocked = input(false);
  protected readonly editor = inject(EventGlobalPolicyFacade);
  protected readonly i18n = createEventCoreEditorI18n();
  protected readonly copy = this.i18n.policyEditor;
  private readonly destroyRef = inject(DestroyRef);
  private readonly confirm = inject(UiConfirm);
  private readonly toast = inject(UiToast);
  protected readonly fullPreview = computed(() => {
    const preview = this.editor.preview();
    return preview && 'normalizedDocument' in preview && preview.valid ? preview : null;
  });
  protected readonly fieldErrors = computed(() => this.editor.preview()?.fieldErrors.map(error => ({
    field: error.field, code: error.code, detail: 'detail' in error ? error.detail : null,
    editionId: 'editionId' in error ? error.editionId : null,
  })) ?? []);
  protected readonly errorMessage = computed(() => {
    if (this.editor.readbackPending()) return this.copy().readbackPending;
    const issue = this.editor.issue();
    if (issue) return this.copy()[issue];
    const error = this.editor.error();
    if (error instanceof RpcError && error.code === '42501') return this.copy().denied;
    if (error instanceof RpcError && error.code === '23514') return this.copy().protected;
    return error === null ? null : resolveEventCoreAdminErrorMessage(error, this.i18n.rpcErrors(), this.copy().conflict);
  });

  constructor() {
    effect(() => this.editor.blocked.set(this.blocked()));
    effect(() => {
      const core = this.core();
      const blocked = this.blocked();
      untracked(() => { if (!blocked && !this.editor.locked()) this.run(this.editor.load(core)); });
    });
  }

  protected preview(): void { this.run(this.editor.previewChanges()); }
  protected refresh(): void { this.run(this.editor.refresh()); }

  protected save(): void {
    if (!this.editor.canSave()) return;
    const coreId = this.core().id;
    const preview = this.editor.preview();
    this.confirm.modalDecision({
      header: this.copy().title, message: this.copy().saveConfirm,
      acceptLabel: this.copy().save, rejectLabel: this.i18n.commonActions().cancel,
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(accepted => {
      if (accepted && this.core().id === coreId && this.editor.preview() === preview && this.editor.canSave()) this.run(this.editor.save());
    });
  }

  protected discard(): void {
    if (!this.editor.canDiscard()) return;
    const coreId = this.core().id;
    this.confirm.modalDecision({
      header: this.copy().title, message: this.copy().discardConfirm,
      acceptLabel: this.copy().discard, rejectLabel: this.i18n.commonActions().cancel,
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(accepted => {
      if (accepted && this.core().id === coreId && this.editor.canDiscard()) this.run(this.editor.refresh(true));
    });
  }

  private run(request: Observable<unknown>): void {
    request.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        if (this.editor.saved()) this.toast.success({ summary: this.i18n.toast().saveSuccessSummary, detail: this.copy().saved });
      },
      error: () => this.toast.danger({ summary: this.i18n.toast().saveFailedSummary,
        detail: this.errorMessage() ?? this.i18n.rpcErrors().unknown }),
    });
  }
}
