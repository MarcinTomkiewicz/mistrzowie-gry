import {
  Component,
  DestroyRef,
  computed,
  effect,
  inject,
  input,
  output,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { DialogModule } from 'primeng/dialog';
import { IftaLabelModule } from 'primeng/iftalabel';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { finalize, type Observable } from 'rxjs';

import { EventOccurrenceStatus } from '../../../../core/enums/event';
import {
  createEventOccurrenceForm,
  mapEventOccurrenceFormToPayload,
  populateEventOccurrenceForm,
} from '../../../../core/factories/event-occurrence-form.factory';
import {
  IAdminEventDetail,
  IAdminOccurrenceListItem,
} from '../../../../core/interfaces/i-event-admin';
import { ISelectOption } from '../../../../core/interfaces/i-select-option';
import { UiToast } from '../../../../core/services/ui-toast/ui-toast';
import { formatDateLabel } from '../../../../core/utils/date';
import {
  resolveEventEditionAdminErrorMessage,
  resolveEventOccurrenceAdminErrorMessage,
} from '../event-admin-errors';
import { createParticipantSignupKindOptions } from '../participant-signup-kind-options';
import { createEventEditionEditorI18n } from './edition-editor.i18n';
import { OccurrenceEditorController, type OccurrenceWriteResult } from './occurrence-editor-controller';

@Component({
  selector: 'app-occurrence-editor',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    ButtonModule,
    DatePickerModule,
    DialogModule,
    IftaLabelModule,
    InputNumberModule,
    SelectModule,
  ],
  templateUrl: './occurrence-editor.html',
  providers: [OccurrenceEditorController],
})
export class OccurrenceEditor {
  private readonly controller = inject(OccurrenceEditorController);
  private readonly destroyRef = inject(DestroyRef);
  private readonly toast = inject(UiToast);

  readonly eventId = input.required<string>();
  readonly occurrence = input.required<IAdminOccurrenceListItem>();
  readonly timezone = input.required<string>();
  readonly isStaffingConverted = input(false);
  readonly i18n =
    input.required<ReturnType<typeof createEventEditionEditorI18n>>();

  readonly closed = output<void>();
  readonly saved = output<IAdminEventDetail>();

  protected readonly form = createEventOccurrenceForm(
    () => this.timezone(),
    () => this.occurrence(),
  );
  protected readonly isSaving = this.controller.isSaving;
  protected readonly isBusy = this.controller.isBusy;
  protected readonly isChangingSignup = this.controller.isChangingSignup;
  protected readonly participantSignupOpen = computed(() =>
    this.occurrence().status === EventOccurrenceStatus.ParticipantSignupOpen);
  protected readonly canChangeSignupState = computed(() => {
    const status = this.occurrence().status;
    return status === EventOccurrenceStatus.Published || status === EventOccurrenceStatus.ParticipantSignupOpen ||
      status === EventOccurrenceStatus.ParticipantSignupClosed;
  });
  protected readonly formatDateLabel = formatDateLabel;
  protected readonly statusOptions = computed<
    ISelectOption<EventOccurrenceStatus>[]
  >(() =>
    (this.isStaffingConverted()
      ? [this.occurrence().status]
      : Object.values(EventOccurrenceStatus)).map((value) => ({
      value,
      label: this.i18n().occurrenceStatuses()[value],
    })),
  );
  protected readonly participantSignupKindOptions = computed(() =>
    createParticipantSignupKindOptions(this.i18n().participantKinds()),
  );

  constructor() {
    effect(() => {
      populateEventOccurrenceForm(
        this.form,
        this.occurrence(),
        this.timezone(),
      );
    });
  }

  protected close(): void {
    if (!this.isBusy()) {
      this.closed.emit();
    }
  }

  protected onVisibleChange(visible: boolean): void {
    if (!visible) {
      this.close();
    }
  }

  protected saveOccurrence(): void {
    if (this.form.invalid || this.isBusy()) {
      this.form.markAllAsTouched();

      if (this.form.invalid) {
        this.toast.danger({
          summary: this.i18n().commonForm().invalidSummary,
          detail: this.i18n().commonForm().invalid,
        });
      }

      return;
    }

    this.runWrite(this.controller.save(this.eventId(),
      mapEventOccurrenceFormToPayload(this.form, this.occurrence(), this.timezone())), 'save');
  }

  protected changeParticipantSignupState(): void {
    if (this.isBusy() || this.form.dirty || !this.canChangeSignupState()) return;
    this.runWrite(this.controller.setParticipantSignupState(
      this.eventId(), this.occurrence().id, !this.participantSignupOpen()), 'signup');
  }

  private runWrite(request: Observable<OccurrenceWriteResult>, operation: 'save' | 'signup'): void {
    this.form.disable({ emitEvent: false });
    request.pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.form.enable({ emitEvent: false })),
    ).subscribe((result) => {
      const copy = this.i18n().occurrenceToast();
      if (result.kind === 'updated') {
        this.toast.success({
          summary: operation === 'save' ? copy.saveSuccessSummary
            : this.i18n().occurrenceStatuses()[result.occurrence.status],
          detail: operation === 'save' ? copy.saveSuccessDetail : undefined,
        });
        this.saved.emit(result.detail);
        return;
      }
      const summary = operation === 'save'
        ? result.confirmed ? copy.reloadFailedSummary : copy.saveFailedSummary
        : result.confirmed ? copy.signupReloadFailedSummary : copy.signupChangeFailedSummary;
      const detail = result.confirmed
        ? resolveEventEditionAdminErrorMessage(result.error, this.i18n().rpcErrors(), this.i18n().commonErrors().concurrentModification)
        : resolveEventOccurrenceAdminErrorMessage(result.error, this.i18n().occurrenceRpcErrors());
      if (result.confirmed) this.toast.warn({ summary, detail });
      else this.toast.danger({ summary, detail });
    });
  }
}
