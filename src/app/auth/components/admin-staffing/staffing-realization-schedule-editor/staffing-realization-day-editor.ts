import { Component, input } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { provideTranslocoScope } from '@jsverse/transloco';
import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { InputNumberModule } from 'primeng/inputnumber';
import { PopoverModule } from 'primeng/popover';

import { getStaffingSlotConflicts } from '../../../../core/domain/staffing/schedule';
import {
  addStaffingRealizationSlot,
  copyStaffingRealizationSlot,
  removeStaffingRealizationSlot,
  swapStaffingRealizationSlotLabels,
} from '../../../../core/factories/staffing-realization-days-form.factory';
import { STAFFING_SCOPE } from '../../../../core/translations/staffing.i18n';
import { StaffingRealizationDayForm } from '../../../../core/types/staffing-realization-form';
import {
  formatDateLabel,
  formatWeekdayLabel,
  toIsoDate,
} from '../../../../core/utils/date';
import {
  getStaffingDayDateError,
  getStaffingDemandError,
} from '../staffing-realization-form-errors';
import { createStaffingRealizationScheduleEditorI18n } from './staffing-realization-schedule-editor.i18n';
import { StaffingRealizationSlotEditor } from './staffing-realization-slot-editor';

@Component({
  selector: 'app-staffing-realization-day-editor',
  imports: [
    ReactiveFormsModule,
    ButtonModule,
    DatePickerModule,
    InputNumberModule,
    PopoverModule,
    StaffingRealizationSlotEditor,
  ],
  templateUrl: './staffing-realization-day-editor.html',
  providers: [
    provideTranslocoScope('adminStaffing', STAFFING_SCOPE, 'common'),
  ],
})
export class StaffingRealizationDayEditor {
  readonly day = input.required<StaffingRealizationDayForm>();
  readonly dayIndex = input.required<number>();
  readonly isSaving = input.required<boolean>();

  protected readonly i18n = createStaffingRealizationScheduleEditorI18n();
  protected readonly dateError = getStaffingDayDateError;
  protected readonly demandError = getStaffingDemandError;

  protected addSlot(): void {
    if (this.isSaving()) {
      return;
    }

    const slots = this.day().controls.slots;
    addStaffingRealizationSlot(slots);
  }

  protected swapSlotLabels(fromIndex: number, toIndex: number): void {
    if (this.isSaving()) {
      return;
    }

    swapStaffingRealizationSlotLabels(
      this.day().controls.slots,
      fromIndex,
      toIndex,
    );
  }

  protected copySlot(index: number): void {
    if (this.isSaving()) {
      return;
    }

    copyStaffingRealizationSlot(this.day().controls.slots, index);
  }

  protected removeSlot(index: number): void {
    if (this.isSaving()) {
      return;
    }

    removeStaffingRealizationSlot(this.day().controls.slots, index);
  }

  protected dayDateLabel(): string {
    const date = this.day().controls.date.value;

    if (!date || this.day().controls.date.invalid) {
      return '';
    }

    const dateIso = toIsoDate(date);

    return `${formatDateLabel(dateIso)} (${formatWeekdayLabel(dateIso)})`;
  }

  protected slotHasConflict(slotIndex: number): boolean {
    return getStaffingSlotConflicts(
      this.day().controls.slots.getRawValue(),
    ).indexes.has(slotIndex);
  }
}
