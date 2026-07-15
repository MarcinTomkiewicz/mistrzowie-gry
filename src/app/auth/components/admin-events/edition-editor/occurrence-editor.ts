import {
  Component,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { DialogModule } from 'primeng/dialog';
import { IftaLabelModule } from 'primeng/iftalabel';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { finalize, map, switchMap, tap } from 'rxjs';

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
import { EventAdmin } from '../../../../core/services/event-admin/event-admin';
import { UiToast } from '../../../../core/services/ui-toast/ui-toast';
import { formatDateLabel } from '../../../../core/utils/date';
import {
  createParticipantSignupKindOptions,
  resolveEventEditionAdminErrorMessage,
  resolveEventOccurrenceAdminErrorMessage,
} from '../../../../core/utils/event-admin';
import { createEventEditionEditorI18n } from './edition-editor.i18n';

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
})
export class OccurrenceEditor {
  private readonly eventAdmin = inject(EventAdmin);
  private readonly toast = inject(UiToast);

  readonly eventId = input.required<string>();
  readonly occurrence = input.required<IAdminOccurrenceListItem>();
  readonly timezone = input.required<string>();
  readonly i18n =
    input.required<ReturnType<typeof createEventEditionEditorI18n>>();

  readonly closed = output<void>();
  readonly saved = output<IAdminEventDetail>();

  protected readonly form = createEventOccurrenceForm(
    () => this.timezone(),
    () => this.occurrence(),
  );
  protected readonly isSaving = signal(false);
  protected readonly formatDateLabel = formatDateLabel;
  protected readonly statusOptions = computed<
    ISelectOption<EventOccurrenceStatus>[]
  >(() =>
    Object.values(EventOccurrenceStatus).map((value) => ({
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
    if (!this.isSaving()) {
      this.closed.emit();
    }
  }

  protected onVisibleChange(visible: boolean): void {
    if (!visible) {
      this.close();
    }
  }

  protected saveOccurrence(): void {
    if (this.form.invalid || this.isSaving()) {
      this.form.markAllAsTouched();

      if (this.form.invalid) {
        this.toast.danger({
          summary: this.i18n().commonForm().invalidSummary,
          detail: this.i18n().commonForm().invalid,
        });
      }

      return;
    }

    this.isSaving.set(true);
    let occurrenceSaved = false;

    this.eventAdmin
      .saveOccurrence(
        mapEventOccurrenceFormToPayload(
          this.form,
          this.occurrence(),
          this.timezone(),
        ),
      )
      .pipe(
        tap(() => {
          occurrenceSaved = true;
        }),
        switchMap(() => this.eventAdmin.getEditionDetail(this.eventId())),
        map((detail) => {
          if (!detail) {
            throw new Error(
              `[OCCURRENCE_EDITOR] Missing event detail "${this.eventId()}" after saving occurrence "${this.occurrence().id}".`,
            );
          }

          return detail;
        }),
        finalize(() => this.isSaving.set(false)),
      )
      .subscribe({
        next: (detail) => {
          this.toast.success({
            summary: this.i18n().occurrenceToast().saveSuccessSummary,
            detail: this.i18n().occurrenceToast().saveSuccessDetail,
          });
          this.saved.emit(detail);
        },
        error: (error) => {
          this.toast.danger({
            summary: occurrenceSaved
              ? this.i18n().occurrenceToast().reloadFailedSummary
              : this.i18n().occurrenceToast().saveFailedSummary,
            detail: occurrenceSaved
              ? resolveEventEditionAdminErrorMessage(
                  error,
                  this.i18n().rpcErrors(),
                )
              : resolveEventOccurrenceAdminErrorMessage(
                  error,
                  this.i18n().occurrenceRpcErrors(),
                ),
          });
        },
      });
  }
}
