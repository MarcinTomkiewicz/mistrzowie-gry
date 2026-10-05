import { FormControl, FormGroup, Validators } from '@angular/forms';
import { AdminStaffingRecruitmentPolicy, SaveAdminStaffingRecruitmentPolicyPayload } from '../interfaces/admin-staffing-recruitment-policy';
import { StaffingRealizationType } from '../types/staffing-realization';
import { StaffingRecruitmentPolicyDraft, StaffingRecruitmentPolicyForm } from '../types/staffing-recruitment-policy-form';
import { setControlEnabled } from '../utils/form-controls';

export function mapStaffingRecruitmentPolicyToDraft(
  policy: AdminStaffingRecruitmentPolicy | null,
): StaffingRecruitmentPolicyDraft {
  return {
    selfApplicationEnabled: policy?.selfApplicationEnabled ?? false,
    stationaryScopePolicy: policy?.stationaryScopePolicy ?? null,
    sessionSelectionMode: policy?.sessionSelectionMode ?? null,
  };
}

export function createStaffingRecruitmentPolicyForm(): StaffingRecruitmentPolicyForm {
  const draft = mapStaffingRecruitmentPolicyToDraft(null);
  return new FormGroup({
    selfApplicationEnabled: new FormControl(draft.selfApplicationEnabled, { nonNullable: true }),
    stationaryScopePolicy: new FormControl(draft.stationaryScopePolicy, { validators: [Validators.required] }),
    sessionSelectionMode: new FormControl(draft.sessionSelectionMode, { validators: [Validators.required] }),
  });
}

export function syncStaffingRecruitmentPolicyForm(
  form: StaffingRecruitmentPolicyForm,
  type: StaffingRealizationType,
): void {
  const controls = form.controls;
  setControlEnabled(controls.stationaryScopePolicy, type === 'stationary');
  if (type === 'travel') controls.stationaryScopePolicy.setValue(null, { emitEvent: false });
  form.updateValueAndValidity({ emitEvent: false });
}

export function populateStaffingRecruitmentPolicyForm(
  form: StaffingRecruitmentPolicyForm,
  draft: StaffingRecruitmentPolicyDraft,
  type: StaffingRealizationType,
): void {
  form.reset(draft, { emitEvent: false });
  syncStaffingRecruitmentPolicyForm(form, type);
  form.markAsPristine();
  form.markAsUntouched();
}

export function mapStaffingRecruitmentPolicyFormToPayload(
  form: StaffingRecruitmentPolicyForm,
  type: StaffingRealizationType,
): SaveAdminStaffingRecruitmentPolicyPayload {
  syncStaffingRecruitmentPolicyForm(form, type);
  const value = form.getRawValue();
  if (form.invalid || value.sessionSelectionMode === null) {
    throw new Error('[STAFFING_RECRUITMENT_POLICY] Cannot map an invalid policy.');
  }
  return {
    ...value,
    sessionSelectionMode: value.sessionSelectionMode,
    requiredSessionMappingsPerSlot: value.sessionSelectionMode === 'gm_selects' ? 1 : null,
  };
}
