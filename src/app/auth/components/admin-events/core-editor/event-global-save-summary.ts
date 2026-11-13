import { Component, computed, DestroyRef, inject, input, output, signal, TemplateRef, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';
import { EMPTY, finalize, switchMap } from 'rxjs';

import { UiConfirm } from '../../../../core/services/ui-confirm/ui-confirm';
import { UiToast } from '../../../../core/services/ui-toast/ui-toast';
import { resolveEventCoreAdminErrorMessage, resolveEventEditionAdminErrorMessage } from '../event-admin-errors';
import { createEventCoreEditorI18n } from './core-editor.i18n';
import { EventGlobalSaveController, GLOBAL_SAVE_STEPS, type GlobalSaveSection } from './event-global-save-controller';

@Component({
  selector: 'app-event-global-save-summary',
  imports: [ButtonModule, MessageModule],
  templateUrl: './event-global-save-summary.html',
  host: { class: 'd-contents' },
})
export class EventGlobalSaveSummary {
  readonly disabled = input(false);
  readonly navigateToStep = output<number>();
  readonly saved = output<void>();
  readonly discard = output<void>();
  readonly secondaryActions = viewChild<TemplateRef<unknown>>('secondaryActions');
  readonly primaryActions = viewChild<TemplateRef<unknown>>('primaryActions');
  protected readonly save = inject(EventGlobalSaveController);
  protected readonly i18n = createEventCoreEditorI18n();
  protected readonly copy = this.i18n.saveChanges;
  protected readonly deciding = signal(false);
  private readonly confirm = inject(UiConfirm);
  private readonly toast = inject(UiToast);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly checkStep = computed(() => {
    const issue = this.save.checkIssue();
    if (!issue) return null;
    if (issue.section) return GLOBAL_SAVE_STEPS[issue.section];
    return issue.reason === 'coverDirty' || issue.reason === 'coverPending' ? 1
      : issue.reason === 'program' ? 5 : issue.reason === 'city' ? 2 : null;
  });
  protected readonly checkMessage = computed(() => {
    const issue = this.save.checkIssue();
    if (!issue) return null;
    const section = issue.section;
    let detail = this.copy().checkReasons[issue.reason];
    if (section && issue.reason === 'section') {
      let sectionDetail: string | null = null;
      const error = this.save.error() ?? (section === 'core' || section === 'edition' ? this.save.metadata.errors()[section]
        : this.save[section].error());
      if (section === 'base' || section === 'schedule' || section === 'dated') {
        const blocker = this.save[section].blockingReason();
        if (blocker) sectionDetail = this.i18n.schedule().blockers[blocker];
        else if (section === 'base' && this.save.base.conflicted()) sectionDetail = this.i18n.baseTimeBlocks().conflict;
        else if (section === 'dated' && this.save.dated.conflicted()) sectionDetail = this.i18n.datedBlocks().conflict;
      } else if (section === 'policy') {
        const policyIssue = this.save.policy.issue();
        if (policyIssue) sectionDetail = this.i18n.policyEditor()[policyIssue];
        else if (!this.save.policy.canEdit()) sectionDetail = this.i18n.policyEditor().protected;
      } else {
        const metadataIssue = this.save.metadata.issues()[section];
        if (metadataIssue) sectionDetail = this.i18n.metadata()[metadataIssue];
        else if (!(section === 'core' ? this.save.metadata.canEditCore() : this.save.metadata.canEditEdition())) {
          sectionDetail = this.i18n.metadata().protected;
        }
      }
      if (sectionDetail !== null) detail = sectionDetail;
      else if (error !== null && error !== undefined) detail = section === 'edition'
        ? resolveEventEditionAdminErrorMessage(error, this.i18n.editionRpcErrors(), this.i18n.commonErrors().concurrentModification)
        : resolveEventCoreAdminErrorMessage(error, this.i18n.rpcErrors(), this.i18n.commonErrors().concurrentModification);
    }
    return section ? `${this.label(section)}: ${detail}` : detail;
  });

  protected label(key: GlobalSaveSection): string {
    return { core: this.i18n.creationSteps().event, edition: this.i18n.creationSteps().location,
      base: this.i18n.creation().blocks, schedule: this.i18n.creationSteps().schedule,
      dated: this.copy().localChanges, policy: this.i18n.creationSteps().policy }[key];
  }

  protected edit(key: GlobalSaveSection): void { this.navigateToStep.emit(GLOBAL_SAVE_STEPS[key]); }

  protected check(): void {
    this.save.check(this.disabled() || this.deciding()).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: valid => { if (!valid) this.showCheckFailure(); },
      error: () => this.showCheckFailure(),
    });
  }

  protected confirmSave(): void {
    if (this.disabled() || this.deciding() || this.save.busy() || this.save.pending() || !this.save.checked()) return;
    const invalid = this.save.validate();
    if (invalid) { this.showCheckFailure(); return; }
    const coreId = this.save.metadata.core()?.id;
    this.deciding.set(true);
    this.confirm.modalDecision({ header: this.copy().confirmQuestion, message: this.copy().confirm,
      acceptLabel: this.copy().action, rejectLabel: this.i18n.commonActions().cancel,
    }).pipe(switchMap(accepted => accepted && coreId === this.save.metadata.core()?.id && !this.disabled()
      ? this.save.save() : EMPTY), finalize(() => this.deciding.set(false)), takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.toast.success({ summary: this.i18n.toast().saveSuccessSummary, detail: this.copy().saved });
        this.saved.emit();
      },
      error: () => {
        this.toast.show(this.save.pending() ? 'warn' : 'danger', {
          summary: this.save.pending() ? this.copy().retryRead : this.i18n.toast().saveFailedSummary,
          detail: this.save.pending() ? this.copy().uncertain : this.copy().failed });
        queueMicrotask(() => {
          const key = this.save.failed();
          if (key && !this.save.pending() && !this.destroyRef.destroyed) this.edit(key);
        });
      },
    });
  }

  protected retryReadback(): void {
    this.save.retryReadback().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => { if (!this.save.dirty() && !this.save.pending()) this.saved.emit(); },
      error: () => this.toast.show(this.save.pending() ? 'warn' : 'danger', {
        summary: this.copy().retryRead, detail: this.save.pending() ? this.copy().uncertain : this.copy().failed,
      }),
    });
  }

  private showCheckFailure(): void {
    const issue = this.save.checkIssue();
    this.toast.show(issue?.reason === 'invalid' || issue?.reason === 'section' ? 'danger' : 'warn', {
      summary: this.copy().checkChanges, detail: this.checkMessage() ?? this.i18n.commonErrors().generic,
    });
    const section = issue?.section;
    if (section && !this.save.pending()) queueMicrotask(() => {
      if (!this.destroyRef.destroyed) this.edit(section);
    });
  }
}
