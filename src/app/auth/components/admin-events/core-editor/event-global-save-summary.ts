import { Component, computed, DestroyRef, inject, input, output, signal, TemplateRef, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';
import { EMPTY, finalize, switchMap } from 'rxjs';

import { UiConfirm } from '../../../../core/services/ui-confirm/ui-confirm';
import { UiToast } from '../../../../core/services/ui-toast/ui-toast';
import type { EventGlobalDiagnosticGroup, EventGlobalDiagnosticIssue } from '../../../../core/interfaces/i-event-global-saved-summary';
import { RpcError } from '../../../../core/types/rpc-error';
import { EventGlobalSaveError, presentEventGlobalPreviewError, resolveEventCoreAdminErrorMessage, resolveEventEditionAdminErrorMessage } from '../event-admin-errors';
import { createEventCoreEditorI18n } from './core-editor.i18n';
import { EventGlobalDiagnostics } from './event-global-diagnostics';
import { eventGlobalDiagnosticField, eventGlobalServerIssue, eventGlobalValidationIssues } from './event-global-diagnostic-messages';
import { EventGlobalSaveController, GLOBAL_SAVE_STEPS, type GlobalSaveSection } from './event-global-save-controller';
import { EventGlobalScheduleError } from './event-global-schedule-state';
import { EventGlobalPolicyError } from './policy/event-global-policy-state';

@Component({
  selector: 'app-event-global-save-summary',
  imports: [ButtonModule, MessageModule, EventGlobalDiagnostics],
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
    const detail = this.copy().checkReasons[issue.reason];
    if (section && issue.reason === 'section') return `${this.label(section)}: ${this.operationMessage(this.save.error())}`;
    return section ? `${this.label(section)}: ${detail}` : detail;
  });
  protected readonly failureMessage = computed(() => {
    const check = this.checkMessage();
    if (!this.save.pending() && check) return check;
    const section = this.save.failed();
    const detail = this.operationMessage(this.save.error());
    return section ? `${this.label(section)}: ${detail}` : detail;
  });
  protected readonly diagnosticGroups = computed<EventGlobalDiagnosticGroup[]>(() => {
    const section = this.save.failed() ?? this.save.checkIssue()?.section;
    const error = this.save.error();
    if (!section || this.save.busy() || !error && this.save.checkIssue()?.reason !== 'invalid') return [];
    const cities = this.save.schedule.calendar()?.cities ?? [];
    const invalid = this.save.checkIssue()?.reason === 'invalid' || error instanceof EventGlobalSaveError && error.guard === 'invalid';
    const issues = invalid ? eventGlobalValidationIssues(this.save.forms[section], this.i18n, cities) : [];
    issues.push(this.generalIssue(this.operationMessage(error)));
    const preview = section === 'base' || section === 'schedule' || section === 'policy' ? this.save[section].preview() : null;
    if (preview && !preview.valid && error instanceof EventGlobalSaveError &&
      (error.reason === 'previewRejected' || error.reason === 'writeRejected')) {
      issues.push(...[...preview.fieldErrors, ...preview.blockers].map(value => eventGlobalServerIssue(value, this.i18n, cities)));
      if (!preview.fieldErrors.length && !preview.blockers.length) issues.push(this.generalIssue(this.i18n.diagnostics().noReason));
    }
    const fields = error instanceof EventGlobalPolicyError ? error.fields
      : section === 'policy' && error !== null && error === this.save.policy.error() ? this.save.policy.issueFields() : [];
    for (const field of fields) issues.push({
      field: eventGlobalDiagnosticField(field, this.i18n),
      location: cities.find(city => field.includes(city.editionId))?.city ?? null,
      message: this.i18n.diagnostics().readbackDifference, code: null, technical: field,
    });
    const technical = presentEventGlobalPreviewError(error).map(field => ({
      label: this.i18n.diagnostics().errorFields[field.key], value: field.value,
    }));
    return [{ key: section, title: this.label(section), phase: this.i18n.diagnostics().phases[this.save.phase()],
      step: GLOBAL_SAVE_STEPS[section], issues, technical }];
  });

  protected label(key: GlobalSaveSection): string {
    return { core: this.i18n.creationSteps().event, edition: this.i18n.creationSteps().location,
      base: this.i18n.creation().blocks, schedule: this.i18n.creationSteps().schedule,
      dated: this.copy().localChanges, policy: this.i18n.creationSteps().policy }[key];
  }

  protected check(): void {
    this.save.check(this.disabled() || this.deciding()).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: valid => {
        if (valid) this.toast.success({ summary: this.copy().checkChanges, detail: this.copy().checked });
        else this.showCheckFailure();
      },
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
        this.toast.success({ summary: this.i18n.toast().saveSuccessSummary,
          detail: this.save.completed().length ? this.copy().saved : this.copy().unchanged });
        this.saved.emit();
      },
      error: () => this.showSaveFailure(),
    });
  }

  protected retryReadback(): void {
    this.save.retryReadback().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => { if (!this.save.dirty() && !this.save.pending()) this.saved.emit(); },
      error: () => this.showSaveFailure(),
    });
  }

  private showCheckFailure(): void {
    const issue = this.save.checkIssue();
    this.toast.show(issue?.reason === 'invalid' || issue?.reason === 'section' ? 'danger' : 'warn', {
      summary: this.copy().checkChanges, detail: this.checkMessage() ?? this.i18n.commonErrors().generic,
    });
  }

  private showSaveFailure(): void {
    this.toast.show(this.save.pending() ? 'warn' : 'danger', {
      summary: this.save.pending() ? this.copy().retryRead : this.i18n.toast().saveFailedSummary,
      detail: this.failureMessage(),
    });
  }

  private generalIssue(message: string): EventGlobalDiagnosticIssue {
    return { field: null, location: null, message, code: null, technical: null };
  }

  private operationMessage(error: unknown): string {
    if (error instanceof EventGlobalSaveError) return error.guard
      ? this.i18n.diagnostics().guards[error.guard] : this.i18n.diagnostics().failures[error.reason];
    if (error instanceof EventGlobalPolicyError) return this.i18n.policyEditor()[error.issue];
    if (error instanceof EventGlobalScheduleError) return error.issue === 'active'
      ? this.i18n.schedule().blockers.active : this.i18n.schedule()[error.issue];
    if (error instanceof RpcError) return this.save.failed() === 'edition'
      ? resolveEventEditionAdminErrorMessage(error, this.i18n.editionRpcErrors(), this.i18n.metadata().conflict)
      : resolveEventCoreAdminErrorMessage(error, this.i18n.rpcErrors(), this.i18n.commonErrors().concurrentModification);
    if (this.save.checkIssue()?.reason === 'invalid') return this.copy().checkReasons.invalid;
    return this.save.pending() ? this.i18n.diagnostics().failures.unconfirmed : this.i18n.diagnostics().noReason;
  }
}
