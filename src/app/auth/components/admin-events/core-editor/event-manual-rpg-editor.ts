import { Component, computed, DestroyRef, inject, output } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { FloatLabelModule } from 'primeng/floatlabel';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { SelectModule } from 'primeng/select';
import { Observable } from 'rxjs';

import { SessionDetails } from '../../../../common/session-details/session-details';
import type { AdminEventTimeline } from '../../../../core/interfaces/i-admin-event-timeline';
import { UiConfirm } from '../../../../core/services/ui-confirm/ui-confirm';
import { UiToast } from '../../../../core/services/ui-toast/ui-toast';
import { getGmPublicProfileDisplayName } from '../../../../core/utils/user-display';
import { resolveEventEditionAdminErrorMessage } from '../event-admin-errors';
import { createEventAdminTimelineI18n } from '../event-admin-timeline/event-admin-timeline.i18n';
import { createEventCoreEditorI18n } from './core-editor.i18n';
import { EventManualRpgController, type ManualRpgReadback } from './event-manual-rpg-controller';
import { manualRpgIntervalValid } from './event-manual-rpg-state';

@Component({
  selector: 'app-event-manual-rpg-editor',
  imports: [ReactiveFormsModule, ButtonModule, DatePickerModule, FloatLabelModule, InputNumberModule, InputTextModule,
    MessageModule, SelectModule, SessionDetails],
  templateUrl: './event-manual-rpg-editor.html',
  host: { class: 'd-block w-100 min-w-0' },
})
export class EventManualRpgEditor {
  readonly readback = output<AdminEventTimeline>();
  protected readonly editor = inject(EventManualRpgController);
  protected readonly i18n = createEventAdminTimelineI18n();
  protected readonly coreI18n = createEventCoreEditorI18n();
  protected readonly copy = computed(() => this.i18n.copy().manualRpg);
  private readonly confirm = inject(UiConfirm);
  private readonly toast = inject(UiToast);
  private readonly destroyRef = inject(DestroyRef);
  private readonly value = toSignal(this.editor.form.valueChanges);
  protected readonly profiles = computed(() => this.editor.profiles().map(profile => ({
    value: profile.user.id, label: getGmPublicProfileDisplayName(profile),
  })));
  protected readonly sources = computed(() => [
    { value: 'template', label: this.copy().template }, { value: 'custom', label: this.copy().custom },
  ]);
  protected readonly sessions = computed(() => this.editor.catalog().map(session => ({ value: session.id, label: `${session.title} - ${session.system.name}` })));
  protected readonly selectedSession = computed(() => {
    this.value();
    return this.editor.catalog().find(session => session.id === this.editor.form.controls.sessionId.value) ?? null;
  });
  protected readonly blocks = computed(() => this.editor.blocks().map(block => ({ value: block.position, label: block.label })));
  protected intervalInvalid(): boolean { return !manualRpgIntervalValid(this.editor.form.getRawValue(), this.editor.blocks()); }
  protected readonly message = computed(() => {
    if (this.editor.needsRefresh()) return this.copy().refreshRequired;
    if (this.editor.contractFailure()) return this.copy().contractFailed;
    if (this.editor.readbackPending()) return this.copy().uncertain;
    if (this.editor.conflict()) return this.copy().conflict;
    const error = this.editor.error();
    return error === null ? null : resolveEventEditionAdminErrorMessage(error, this.i18n.rpcErrors(), this.copy().conflict);
  });

  protected save(): void {
    this.editor.form.markAllAsTouched();
    if (!this.editor.canSave()) return;
    const context = this.editor.context();
    const value = JSON.stringify(this.editor.form.getRawValue());
    this.confirm.modalDecision({
      header: this.copy().action, message: this.copy().saveConfirm,
      acceptLabel: this.copy().action, rejectLabel: this.i18n.actions().cancel,
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(accepted => {
      if (accepted && this.editor.context() === context && JSON.stringify(this.editor.form.getRawValue()) === value) this.run(this.editor.save());
    });
  }

  protected discard(): void {
    if (!this.editor.canDiscard() && !this.editor.canAbandon()) return;
    const operation = this.editor.operation();
    const abandoning = this.editor.canAbandon();
    this.confirm.modalDecision({
      header: this.copy().action, message: abandoning ? this.copy().abandonConfirm : this.copy().discardConfirm,
      acceptLabel: abandoning ? this.copy().abandon : this.i18n.actions().close, rejectLabel: this.i18n.actions().cancel,
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(accepted => {
      if (accepted && this.editor.operation() === operation) {
        if (abandoning) this.editor.abandon();
        else this.editor.discard();
      }
    });
  }

  protected refresh(): void { this.run(this.editor.refresh()); }

  private run(request: Observable<ManualRpgReadback>): void {
    request.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: ({ timeline, saved }) => {
        this.readback.emit(timeline);
        if (saved) this.toast.success({ summary: this.copy().saved });
      },
      error: () => this.toast.danger({ summary: this.message() ?? this.copy().failed }),
    });
  }
}
