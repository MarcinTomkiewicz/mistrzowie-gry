import { FormControl, FormGroup, Validators } from '@angular/forms';

import {
  AdminStaffingTravelTerms,
  SaveAdminStaffingTravelTermsPayload,
} from '../interfaces/admin-staffing-travel-terms';
import { StaffingRealizationTravelTermsDraft } from '../types/staffing-realization-editor-draft';
import { StaffingRealizationTravelTermsForm } from '../types/staffing-realization-form';
import { setControlEnabled } from '../utils/form-controls';
import { normalizeText } from '../utils/normalize-text';
import { integerValidator, positiveNumberValidator } from '../validators/form-value.validator';
import { requiredTrimmedValidator } from '../validators/required-trimmed.validator';

export function createStaffingRealizationTravelTermsForm(): StaffingRealizationTravelTermsForm {
  const draft = mapStaffingTravelTermsToDraft(null);
  const form: StaffingRealizationTravelTermsForm = new FormGroup({
    transportMode: new FormControl(draft.transportMode),
    transportNote: new FormControl(draft.transportNote, { nonNullable: true }),
    reimbursementMode: new FormControl(draft.reimbursementMode),
    mileageRatePlnPerKm: new FormControl(draft.mileageRatePlnPerKm, {
      validators: [positiveNumberValidator()],
    }),
    reimbursementNote: new FormControl(draft.reimbursementNote, { nonNullable: true }),
    lodgingProvided: new FormControl(draft.lodgingProvided, { nonNullable: true }),
    lodgingNights: new FormControl(draft.lodgingNights, {
      validators: [integerValidator(), Validators.min(1)],
    }),
    lodgingNote: new FormControl(draft.lodgingNote, { nonNullable: true }),
    breakfastProvided: new FormControl(draft.breakfastProvided, { nonNullable: true }),
    lunchProvided: new FormControl(draft.lunchProvided, { nonNullable: true }),
    dinnerProvided: new FormControl(draft.dinnerProvided, { nonNullable: true }),
    mealAllowanceApplicable: new FormControl(draft.mealAllowanceApplicable, { nonNullable: true }),
    workTimeScope: new FormControl(draft.workTimeScope, { validators: [Validators.required] }),
    workTimeNote: new FormControl(draft.workTimeNote, {
      nonNullable: true,
      validators: [requiredTrimmedValidator()],
    }),
    travelNote: new FormControl(draft.travelNote, { nonNullable: true }),
  });

  syncStaffingRealizationTravelTermsForm(form);
  return form;
}

export function mapStaffingTravelTermsToDraft(
  terms: AdminStaffingTravelTerms | null,
): StaffingRealizationTravelTermsDraft {
  return {
    transportMode: terms?.transportMode ?? null,
    transportNote: terms?.transportNote ?? '',
    reimbursementMode: terms?.reimbursementMode ?? null,
    mileageRatePlnPerKm: terms?.mileageRatePlnPerKm ?? null,
    reimbursementNote: terms?.reimbursementNote ?? '',
    lodgingProvided: terms?.lodgingProvided ?? false,
    lodgingNights: terms?.lodgingProvided ? terms.lodgingNights : null,
    lodgingNote: terms?.lodgingNote ?? '',
    breakfastProvided: terms?.breakfastProvided ?? false,
    lunchProvided: terms?.lunchProvided ?? false,
    dinnerProvided: terms?.dinnerProvided ?? false,
    mealAllowanceApplicable: terms?.mealAllowanceApplicable ?? false,
    workTimeScope: terms?.workTimeScope ?? null,
    workTimeNote: terms?.workTimeNote ?? '',
    travelNote: terms?.travelNote ?? '',
  };
}

export function syncStaffingRealizationTravelTermsForm(
  form: StaffingRealizationTravelTermsForm,
): void {
  setControlEnabled(
    form.controls.mileageRatePlnPerKm,
    form.controls.reimbursementMode.value === 'mileage',
  );
  setControlEnabled(form.controls.lodgingNights, form.controls.lodgingProvided.value);
  if (!form.controls.lodgingProvided.value) {
    form.controls.lodgingNights.setValue(null, { emitEvent: false });
  }
  setControlEnabled(form.controls.workTimeNote, form.controls.workTimeScope.value === 'custom');
  form.updateValueAndValidity({ emitEvent: false });
}

export function populateStaffingRealizationTravelTermsForm(
  form: StaffingRealizationTravelTermsForm,
  draft: StaffingRealizationTravelTermsDraft,
): void {
  form.reset(draft, { emitEvent: false });
  syncStaffingRealizationTravelTermsForm(form);
  form.markAsPristine();
  form.markAsUntouched();
}

export function mapStaffingRealizationTravelTermsFormToPayload(
  form: StaffingRealizationTravelTermsForm,
): SaveAdminStaffingTravelTermsPayload {
  const value = form.getRawValue();

  if (value.workTimeScope === null) {
    throw new Error('[STAFFING_TRAVEL_TERMS] Cannot map terms without a work-time scope.');
  }

  return {
    ...value,
    workTimeScope: value.workTimeScope,
    transportNote: normalizeText(value.transportNote),
    mileageRatePlnPerKm: value.reimbursementMode === 'mileage'
      ? value.mileageRatePlnPerKm : null,
    reimbursementNote: normalizeText(value.reimbursementNote),
    lodgingNights: value.lodgingProvided ? value.lodgingNights : null,
    lodgingNote: normalizeText(value.lodgingNote),
    workTimeNote: value.workTimeScope === 'custom' ? normalizeText(value.workTimeNote) : null,
    travelNote: normalizeText(value.travelNote),
  };
}
