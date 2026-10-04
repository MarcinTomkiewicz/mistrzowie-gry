import { FormControl, FormGroup } from '@angular/forms';
import { SaveAdminStaffingRecruitmentPolicyPayload } from '../interfaces/admin-staffing-recruitment-policy';
import { StaffingSessionSelectionMode } from './staffing-realization';

export type StaffingRecruitmentPolicyDraft = Omit<
  SaveAdminStaffingRecruitmentPolicyPayload, 'sessionSelectionMode' | 'requiredSessionMappingsPerSlot'
> & { sessionSelectionMode: StaffingSessionSelectionMode | null };

export type StaffingRecruitmentPolicyForm = FormGroup<{
  [K in keyof StaffingRecruitmentPolicyDraft]: FormControl<StaffingRecruitmentPolicyDraft[K]>;
}>;
