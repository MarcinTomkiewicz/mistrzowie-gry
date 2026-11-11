import { Component, DestroyRef, inject, input, output, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';
import { EMPTY, finalize, switchMap } from 'rxjs';

import { UiConfirm } from '../../../../core/services/ui-confirm/ui-confirm';
import { UiToast } from '../../../../core/services/ui-toast/ui-toast';
import { createEventCoreEditorI18n } from './core-editor.i18n';
import { EventGlobalSaveController, GLOBAL_SAVE_STEPS, type GlobalSaveSection } from './event-global-save-controller';

@Component({
  selector: 'app-event-global-save-summary',
  imports: [ButtonModule, MessageModule],
  templateUrl: './event-global-save-summary.html',
  host: { class: 'd-block w-100 min-w-0' },
})
export class EventGlobalSaveSummary {
  readonly disabled = input(false);
  readonly navigateToStep = output<number>();
  readonly saved = output<void>();
  readonly discard = output<void>();
  protected readonly save = inject(EventGlobalSaveController);
  protected readonly i18n = createEventCoreEditorI18n();
  protected readonly copy = this.i18n.saveChanges;
  protected readonly deciding = signal(false);
  private readonly confirm = inject(UiConfirm);
  private readonly toast = inject(UiToast);
  private readonly destroyRef = inject(DestroyRef);

  protected label(key: GlobalSaveSection): string {
    return { core: this.i18n.creationSteps().event, edition: this.i18n.creationSteps().location,
      base: this.i18n.creation().blocks, schedule: this.i18n.creationSteps().schedule,
      dated: this.copy().localChanges, policy: this.i18n.creationSteps().policy }[key];
  }

  protected edit(key: GlobalSaveSection): void { this.navigateToStep.emit(GLOBAL_SAVE_STEPS[key]); }

  protected check(): void {
    if (this.disabled() || this.deciding() || this.save.busy() || this.save.pending()) return;
    const invalid = this.save.validate();
    if (invalid) { this.edit(invalid); return; }
    this.save.check().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      error: () => {
        const key = this.save.failed();
        if (key) queueMicrotask(() => { if (!this.destroyRef.destroyed) this.edit(key); });
      },
    });
  }

  protected confirmSave(): void {
    if (this.disabled() || this.deciding() || this.save.busy() || this.save.pending() || !this.save.checked()) return;
    const invalid = this.save.validate();
    if (invalid) { this.edit(invalid); return; }
    const coreId = this.save.metadata.core()?.id;
    this.deciding.set(true);
    this.confirm.modalDecision({ header: this.copy().action, message: this.copy().confirm,
      acceptLabel: this.copy().action, rejectLabel: this.i18n.commonActions().cancel,
    }).pipe(switchMap(accepted => accepted && coreId === this.save.metadata.core()?.id && !this.disabled()
      ? this.save.save() : EMPTY), finalize(() => this.deciding.set(false)), takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.toast.success({ summary: this.i18n.toast().saveSuccessSummary, detail: this.copy().saved });
        this.saved.emit();
      },
      error: () => {
        this.toast.danger({ summary: this.i18n.toast().saveFailedSummary,
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
      error: () => { /* The retained section and pending state own the inline error. */ },
    });
  }
}
