import { Component, input, output } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { provideTranslocoScope } from '@jsverse/transloco';
import { InputTextModule } from 'primeng/inputtext';
import { DatePickerModule } from 'primeng/datepicker';

import { ItemEditorActions } from '../../../../common/item-editor-actions/item-editor-actions';
import { STAFFING_SCOPE } from '../../../../core/translations/staffing.i18n';
import { StaffingRealizationSlotForm } from '../../../../core/types/staffing-realization-form';
import { setControlValue } from '../../../../core/utils/form-controls';
import { normalizeTimeInput } from '../../../../core/utils/time-format';
import { getStaffingSlotFieldError } from '../staffing-realization-form-errors';
import { createStaffingRealizationScheduleEditorI18n } from './staffing-realization-schedule-editor.i18n';

@Component({
  selector: 'app-staffing-realization-slot-editor',
  imports: [ReactiveFormsModule, InputTextModule, DatePickerModule, ItemEditorActions],
  templateUrl: './staffing-realization-slot-editor.html',
  providers: [
    provideTranslocoScope('adminStaffing', STAFFING_SCOPE, 'common'),
  ],
})
export class StaffingRealizationSlotEditor {
  readonly slot = input.required<StaffingRealizationSlotForm>();
  readonly dayIndex = input.required<number>();
  readonly slotIndex = input.required<number>();
  readonly slotCount = input.required<number>();
  readonly hasConflict = input.required<boolean>();
  readonly isSaving = input.required<boolean>();
  readonly moveUp = output<void>();
  readonly moveDown = output<void>();
  readonly copyItem = output<void>();
  readonly remove = output<void>();

  protected readonly i18n = createStaffingRealizationScheduleEditorI18n();
  protected readonly fieldError = getStaffingSlotFieldError;

  protected normalizeTime(field: 'startTime' | 'endTime', event: Event): void {
    const input = event.target;
    if (input instanceof HTMLInputElement) {
      const value = normalizeTimeInput(input.value);
      const control = this.slot().controls[field];
      if (control.value !== value || input.value !== value) {
        setControlValue(control, value);
      }
    }
  }
}
