import { FormControl } from '@angular/forms';

import {
  AdminStaffingEditorCopy,
  AdminStaffingScheduleEditorCopy,
} from '../../../core/types/i18n/admin-staffing';
import { CommonFormTranslations } from '../../../core/types/i18n/common';
import {
  StaffingRealizationCoreForm,
  StaffingRealizationDaysForm,
  StaffingRealizationInitialDaysForm,
  StaffingRealizationSlotForm,
} from '../../../core/types/staffing-realization-form';
import { joinTextParts } from '../../../core/utils/normalize-text';

type CoreValidationCopy = AdminStaffingEditorCopy['validation'];
type ScheduleValidationCopy = AdminStaffingScheduleEditorCopy['validation'];

export function getStaffingDemandError(
  control: FormControl<number>,
  label: string,
  commonForm: CommonFormTranslations,
): string | null {
  if (!control.invalid) return null;

  return joinTextParts([
    label,
    control.hasError('required') ? commonForm.required : commonForm.positiveInteger,
  ], ': ');
}

export function getStaffingInitialDateRangeError(
  form: StaffingRealizationInitialDaysForm,
  copy: CoreValidationCopy,
): string | null {
  const control = form.controls.dateRange;
  if (!control.invalid) return null;

  return control.hasError('required') ? copy.dateRangeRequired : copy.dateRange;
}

export function getStaffingDayDateError(
  control: FormControl<Date | null>,
  copy: ScheduleValidationCopy,
): string | null {
  if (!control.invalid) return null;

  return control.hasError('required') ? copy.dateRequired : copy.dateInvalid;
}

export function getStaffingSlotFieldError(
  slot: StaffingRealizationSlotForm,
  field: 'label' | 'startTime' | 'endTime',
  copy: ScheduleValidationCopy,
): string | null {
  const control = slot.controls[field];
  if (!control.invalid) return null;
  if (field === 'label') return copy.slotLabelRequired;

  if (field === 'startTime') {
    return control.hasError('required') ? copy.slotStartRequired : copy.slotStartFormat;
  }

  return control.hasError('required') ? copy.slotEndRequired : copy.slotEndFormat;
}

export function getStaffingCoreFormError(
  form: StaffingRealizationCoreForm,
  initialDays: StaffingRealizationInitialDaysForm | null,
  copy: CoreValidationCopy,
  demandLabel: string,
  commonForm: CommonFormTranslations,
): string | null {
  if (form.controls.name.invalid) return copy.nameRequired;

  if (initialDays) {
    const error = getStaffingInitialDateRangeError(initialDays, copy) ??
      getStaffingDemandError(initialDays.controls.requiredGmCount, demandLabel, commonForm);
    if (error) return error;
  }

  if (form.controls.timezone.invalid) return copy.timezoneRequired;
  if (form.controls.type.invalid) return copy.typeRequired;

  return null;
}

export function getStaffingScheduleFormError(
  form: StaffingRealizationDaysForm,
  copy: ScheduleValidationCopy,
  demandLabel: string,
  commonForm: CommonFormTranslations,
): string | null {
  const days = form.controls.days;
  if (days.hasError('required')) return copy.daysRequired;

  for (const day of days.controls) {
    const error = getStaffingDayDateError(day.controls.date, copy) ??
      getStaffingDemandError(day.controls.requiredGmCount, demandLabel, commonForm);
    if (error) return error;

    for (const slot of day.controls.slots.controls) {
      for (const field of ['label', 'startTime', 'endTime'] as const) {
        const fieldError = getStaffingSlotFieldError(slot, field, copy);
        if (fieldError) return fieldError;
      }
      if (slot.hasError('timeRange')) return copy.slotTimeRange;
    }

    if (day.controls.slots.hasError('slotOverlap')) return copy.slotConflict;
  }

  return days.hasError('duplicateDate') ? copy.duplicateDate : null;
}
