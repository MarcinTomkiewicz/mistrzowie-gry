import { Component, computed, DestroyRef, effect, inject, input, output, untracked } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';
import type { Observable } from 'rxjs';

import type { AdminGlobalCalendarResult } from '../../../../core/interfaces/i-admin-global-event';
import type { IEventCoreDetail } from '../../../../core/interfaces/i-event-admin';
import { UiConfirm } from '../../../../core/services/ui-confirm/ui-confirm';
import { UiToast } from '../../../../core/services/ui-toast/ui-toast';
import { resolveEventCoreAdminErrorMessage } from '../event-admin-errors';
import { createEventCoreEditorI18n } from './core-editor.i18n';
import { EventGlobalBaseTimeBlocksController } from './event-global-base-time-blocks-controller';
import { EventGlobalTimeBlocks } from './event-global-time-blocks';
import { EventGlobalTimeBlocksSummary } from './event-global-time-blocks-summary';

@Component({
  selector: 'app-event-global-base-time-blocks-editor',
  imports: [ReactiveFormsModule, ButtonModule, MessageModule, EventGlobalTimeBlocks, EventGlobalTimeBlocksSummary],
  templateUrl: './event-global-base-time-blocks-editor.html',
  host: { class: 'd-block w-100 min-w-0' },
})
export class EventGlobalBaseTimeBlocksEditor {
  readonly core = input.required<IEventCoreDetail>();
  readonly calendar = input.required<AdminGlobalCalendarResult>();
  readonly blocked = input(false);
  readonly calendarChanged = output<AdminGlobalCalendarResult>();
  readonly saved = output<void>();
  protected readonly editor = inject(EventGlobalBaseTimeBlocksController);
  protected readonly i18n = createEventCoreEditorI18n();
  protected readonly copy = this.i18n.baseTimeBlocks;
  private readonly destroyRef = inject(DestroyRef);
  private readonly confirm = inject(UiConfirm);
  private readonly toast = inject(UiToast);
  protected readonly errorMessage = computed(() => {
    if (this.editor.readbackPending()) return this.copy().readbackPending;
    if (this.editor.conflicted()) return this.copy().conflict;
    const error = this.editor.error();
    return error === null ? null : resolveEventCoreAdminErrorMessage(error, this.i18n.rpcErrors(), this.copy().conflict);
  });

  constructor() {
    effect(() => this.editor.blocked.set(this.blocked()));
    effect(() => {
      const core = this.core();
      const calendar = this.calendar();
      const blocked = this.blocked();
      untracked(() => {
        if (!blocked && !this.editor.locked() && this.editor.calendar() !== calendar) this.editor.load(core, calendar);
      });
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
        this.publishCalendar();
        if (this.editor.result() === 'saved') {
          this.toast.success({ summary: this.i18n.toast().saveSuccessSummary, detail: this.copy().saved });
          this.saved.emit();
        } else if (this.editor.result() === 'unchanged') this.toast.info({ summary: this.copy().unchanged });
      },
      error: () => {
        this.publishCalendar();
        this.toast.danger({ summary: this.i18n.toast().saveFailedSummary,
          detail: this.errorMessage() ?? this.i18n.rpcErrors().unknown });
      },
      complete: () => this.publishCalendar(),
    });
  }

  private publishCalendar(): void {
    const calendar = this.editor.calendar();
    if (!this.destroyRef.destroyed && calendar?.coreId === this.core().id) this.calendarChanged.emit(calendar);
  }
}
