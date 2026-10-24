import { Component, computed, DestroyRef, effect, inject, input, output, signal, untracked } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { FloatLabelModule } from 'primeng/floatlabel';
import { SelectModule } from 'primeng/select';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { map, Observable } from 'rxjs';

import type { AdminGlobalCalendarResult } from '../../../../core/interfaces/i-admin-global-event';
import { Platform } from '../../../../core/services/platform/platform';
import { UiConfirm } from '../../../../core/services/ui-confirm/ui-confirm';
import { UiToast } from '../../../../core/services/ui-toast/ui-toast';
import { formatDateLabel } from '../../../../core/utils/date';
import { resolveEventCoreAdminErrorMessage } from '../event-admin-errors';
import { createEventCoreEditorI18n } from './core-editor.i18n';
import { EventDatedBlocksController } from './event-dated-blocks-controller';
import { EventGlobalTimeBlocks } from './event-global-time-blocks';
import { EventGlobalTimeBlocksSummary } from './event-global-time-blocks-summary';

@Component({
  selector: 'app-event-dated-blocks-editor',
  imports: [FormsModule, ReactiveFormsModule, ButtonModule, FloatLabelModule, SelectModule, ToggleSwitchModule,
    EventGlobalTimeBlocks, EventGlobalTimeBlocksSummary],
  templateUrl: './event-dated-blocks-editor.html',
  providers: [EventDatedBlocksController],
  host: { class: 'd-block w-100 min-w-0' },
})
export class EventDatedBlocksEditor {
  readonly calendar = input.required<AdminGlobalCalendarResult>();
  readonly saved = output<AdminGlobalCalendarResult>();
  protected readonly editor = inject(EventDatedBlocksController);
  protected readonly i18n = createEventCoreEditorI18n();
  private readonly destroyRef = inject(DestroyRef);
  private readonly confirm = inject(UiConfirm);
  private readonly toast = inject(UiToast);
  private readonly platform = inject(Platform);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly dateOptions = computed(() => this.calendar().datedTimeBlocks.map(row => ({ value: row.date, label: formatDateLabel(row.date) })));
  protected readonly scopeOptions = computed(() => [
    { value: 'date', label: this.i18n.datedBlocks().dateScope },
    ...(this.editor.day()?.cities.map(row => ({ value: row.editionId, label: row.city })) ?? []),
  ]);
  protected readonly selectionLocked = computed(() => this.editor.isBusy() || this.editor.isDirty() || this.editor.readbackPending());

  constructor() {
    effect(() => {
      const calendar = this.calendar();
      untracked(() => {
        if (!this.editor.isDirty() && !this.editor.isBusy() && !this.editor.readbackPending()) this.editor.load(calendar);
      });
    });
    this.destroyRef.onDestroy(this.platform.onWindow('beforeunload', event => {
      if (!this.editor.isDirty() && !this.editor.isBusy()) return;
      event.preventDefault();
      event.returnValue = '';
    }));
  }

  protected select(value: unknown, scope: 'date' | 'city'): void {
    if (typeof value !== 'string') return;
    this.errorMessage.set(null);
    this.editor.select(scope === 'date' ? value : this.editor.date(), scope === 'city' && value !== 'date' ? value : '');
  }

  protected preview(): void {
    this.errorMessage.set(null);
    this.editor.previewChanges().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({ error: error => this.showError(error) });
  }

  protected save(): void {
    this.runWrite(this.editor.save(), true);
  }

  protected refresh(): void {
    if (this.editor.isBusy()) return;
    if (!this.editor.isDirty() || this.editor.readbackPending()) {
      this.runWrite(this.editor.refresh(), this.editor.readbackPending());
      return;
    }
    this.confirm.modalDecision({
      header: this.i18n.datedBlocks().editTitle, message: this.i18n.datedBlocks().discardPrompt,
      acceptLabel: this.i18n.datedBlocks().discard, rejectLabel: this.i18n.commonActions().cancel,
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(accepted => {
      if (accepted) this.runWrite(this.editor.refresh(), false);
    });
  }

  canDeactivate(): boolean | Observable<boolean> {
    if (this.editor.isBusy()) return false;
    if (!this.editor.isDirty() || this.editor.readbackPending()) return true;
    return this.confirm.modalDecision({
      header: this.i18n.datedBlocks().editTitle, message: this.i18n.creation().leaveConfirmation,
      acceptLabel: this.i18n.creation().discardDraft, rejectLabel: this.i18n.commonActions().cancel,
    }).pipe(map(accepted => accepted && !this.destroyRef.destroyed && !this.editor.isBusy()));
  }

  private runWrite(request: Observable<AdminGlobalCalendarResult>, notify: boolean): void {
    this.errorMessage.set(null);
    request.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: calendar => {
        this.saved.emit(calendar);
        if (notify) this.toast.success({ summary: this.i18n.toast().saveSuccessSummary, detail: this.i18n.toast().saveSuccessDetail });
      },
      error: error => this.showError(error),
    });
  }

  private showError(error: unknown): void {
    const copy = this.i18n.datedBlocks();
    const detail = this.editor.readbackPending() ? copy.readbackFailed : this.editor.conflicted() ? copy.conflict
      : resolveEventCoreAdminErrorMessage(error, this.i18n.rpcErrors(), copy.conflict);
    this.errorMessage.set(detail);
    this.toast.danger({ summary: this.i18n.toast().saveFailedSummary, detail });
  }
}
