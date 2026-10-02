import { FormControl, FormGroup, Validators } from '@angular/forms';

import { DEFAULT_TIMEZONE } from '../configs/time.config';
import {
  AdminStaffingRealizationCore,
  CreateAdminStaffingRealizationDayInput,
  CreateAdminStaffingRealizationRequest,
  UpdateAdminStaffingRealizationCorePayload,
} from '../interfaces/admin-staffing-realization';
import { StaffingRealizationCoreForm } from '../types/staffing-realization-form';
import { StaffingRealizationCoreDraft } from '../types/staffing-realization-editor-draft';
import { StaffingRealizationType } from '../types/staffing-realization';
import { normalizeText } from '../utils/normalize-text';
import { requiredTrimmedValidator } from '../validators/required-trimmed.validator';

export function createStaffingRealizationCoreForm(): StaffingRealizationCoreForm {
  return new FormGroup({
    name: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, requiredTrimmedValidator()],
    }),
    description: new FormControl('', { nonNullable: true }),
    operationalNotes: new FormControl('', { nonNullable: true }),
    city: new FormControl('', { nonNullable: true }),
    venueName: new FormControl('', { nonNullable: true }),
    venueAddress: new FormControl('', { nonNullable: true }),
    timezone: new FormControl(DEFAULT_TIMEZONE, {
      nonNullable: true,
      validators: [Validators.required, requiredTrimmedValidator()],
    }),
    type: new FormControl<StaffingRealizationType>('stationary', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    eventId: new FormControl<string | null>(null),
  });
}

export function mapStaffingRealizationCoreToDraft(
  realization: AdminStaffingRealizationCore,
): StaffingRealizationCoreDraft {
  return {
    name: realization.name,
    description: realization.description ?? '',
    operationalNotes: realization.operationalNotes ?? '',
    city: realization.city ?? '',
    venueName: realization.venueName ?? '',
    venueAddress: realization.venueAddress ?? '',
    timezone: realization.timezone,
    type: realization.type,
    eventId: realization.eventId,
  };
}

export function populateStaffingRealizationCoreForm(
  form: StaffingRealizationCoreForm,
  draft: StaffingRealizationCoreDraft,
): void {
  form.reset(draft, { emitEvent: false });
  form.markAsPristine();
  form.markAsUntouched();
}

export function mapStaffingRealizationCoreFormToCreatePayload(
  form: StaffingRealizationCoreForm,
  days: CreateAdminStaffingRealizationDayInput[],
): CreateAdminStaffingRealizationRequest {
  return {
    ...mapEditableCoreFields(form),
    coordinatorUserId: null,
    days,
  };
}

export function mapStaffingRealizationCoreFormToUpdatePayload(
  form: StaffingRealizationCoreForm,
  realization: AdminStaffingRealizationCore,
): UpdateAdminStaffingRealizationCorePayload {
  return {
    ...mapEditableCoreFields(form),
    coordinatorUserId: realization.coordinatorUserId,
  };
}

function mapEditableCoreFields(
  form: StaffingRealizationCoreForm,
): Omit<UpdateAdminStaffingRealizationCorePayload, 'coordinatorUserId'> {
  const value = form.getRawValue();

  return {
    name: value.name.trim(),
    description: normalizeText(value.description),
    operationalNotes: normalizeText(value.operationalNotes),
    city: normalizeText(value.city),
    venueName: normalizeText(value.venueName),
    venueAddress: normalizeText(value.venueAddress),
    timezone: value.timezone.trim(),
    type: value.type,
    eventId: value.eventId,
  };
}
