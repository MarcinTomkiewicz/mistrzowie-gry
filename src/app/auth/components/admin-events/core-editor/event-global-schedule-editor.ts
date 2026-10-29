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
import { createScopedObjectI18n } from '../../../../core/translations/scoped.i18n';
import type { EventGlobalScheduleCopy } from '../../../../core/types/i18n/event-global-draft';
import { formatDateLabel } from '../../../../core/utils/date';
import { resolveEventCoreAdminErrorMessage } from '../event-admin-errors';
import { EventScheduleEditor } from '../edition-editor/event-schedule-editor';
import { createEventCoreEditorI18n } from './core-editor.i18n';
import { EventGlobalScheduleController } from './event-global-schedule-controller';

@Component({
  selector: 'app-event-global-schedule-editor',
  imports: [ReactiveFormsModule, ButtonModule, MessageModule, EventScheduleEditor],
  templateUrl: './event-global-schedule-editor.html',
  host: { class: 'd-block w-100 min-w-0' },
})
export class EventGlobalScheduleEditor {
  readonly core = input.required<IEventCoreDetail>();
  readonly calendar = input.required<AdminGlobalCalendarResult>();
  readonly blocked = input(false);
  readonly calendarChanged = output<AdminGlobalCalendarResult>();
  readonly applied = output<void>();
  protected readonly editor = inject(EventGlobalScheduleController);
  protected readonly i18n = createEventCoreEditorI18n();
  protected readonly copy = createScopedObjectI18n<EventGlobalScheduleCopy>('adminEvents', 'editor.schedule');
  protected readonly formatDateLabel = formatDateLabel;
  private readonly destroyRef = inject(DestroyRef);
  private readonly confirm = inject(UiConfirm);
  private readonly toast = inject(UiToast);
  protected readonly fullPreview = computed(() => {
    const preview = this.editor.preview();
    return preview && preview.status !== 'invalid' ? preview : null;
  });
  protected readonly errorMessage = computed(() => {
    const issue = this.editor.issue();
    if (this.editor.state().endsWith('uncertain')) return this.copy().uncertain;
    if (issue) return this.copy()[issue];
    if (this.editor.state().endsWith('readback')) return this.copy().readback;
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
        if (!blocked && this.editor.calendar() !== calendar && !this.editor.locked()) this.editor.load(core, calendar);
      });
    });
  }

  protected preview(): void { this.run(this.editor.previewChanges()); }
  protected save(): void { this.run(this.editor.save()); }
  protected refresh(): void { this.run(this.editor.refresh()); }

  protected discard(): void {
    if (!this.editor.canDiscard()) return;
    const coreId = this.core().id;
    this.confirm.modalDecision({
      header: this.i18n.commonLabels().schedule, message: this.copy().discardConfirm,
      acceptLabel: this.copy().discard, rejectLabel: this.i18n.commonActions().cancel,
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(accepted => {
      if (accepted && this.core().id === coreId && this.editor.canDiscard()) this.run(this.editor.discardLocalChanges());
    });
  }

  protected apply(): void {
    if (!this.editor.canApply()) return;
    const coreId = this.core().id;
    this.confirm.modalDecision({
      header: this.i18n.commonLabels().schedule, message: this.copy().applyConfirm,
      acceptLabel: this.copy().apply, rejectLabel: this.i18n.commonActions().cancel,
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(accepted => {
      if (accepted && this.core().id === coreId && this.editor.canApply()) this.run(this.editor.apply());
    });
  }

  protected blockerMessage(code: string): string {
    if (code === 'HISTORICAL_CITY_EXCLUSION') return this.copy().historical;
    if (code === 'GLOBAL_BLUEPRINT_CHANGE_SEPARATE' || code === 'PROTECTED_GLOBAL_TIME_BLOCKS') return this.copy().offScope;
    return `${this.copy().blocked} (${code})`;
  }

  private run(request: Observable<unknown>): void {
    request.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.publishCalendar();
        const result = this.editor.result();
        if (!result) return;
        this.toast.success({ summary: this.i18n.commonLabels().schedule,
          detail: result === 'applied' ? this.copy().applied : this.copy().draftSaved });
        if (result === 'applied') this.applied.emit();
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
