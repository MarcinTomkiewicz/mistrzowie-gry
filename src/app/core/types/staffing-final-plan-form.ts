import type { FormArray, FormControl, FormGroup } from '@angular/forms';

import type { StaffingFinalPlanSaveItem, StaffingFinalSessionOverride } from '../interfaces/admin-staffing-final-plan';

export type StaffingFinalSessionOverrideForm = FormGroup<{
  [K in keyof StaffingFinalSessionOverride]-?: FormControl<NonNullable<StaffingFinalSessionOverride[K]> | null>;
}>;

export type StaffingFinalPlanItemForm = FormGroup<{
  id: FormControl<NonNullable<StaffingFinalPlanSaveItem['id']> | null>;
  slotId: FormControl<StaffingFinalPlanSaveItem['slotId']>;
  candidateId: FormControl<StaffingFinalPlanSaveItem['candidateId'] | null>;
  sourceKind: FormControl<StaffingFinalPlanSaveItem['sourceKind']>;
  sessionId: FormControl<StaffingFinalPlanSaveItem['sessionId'] | null>;
  position: FormControl<StaffingFinalPlanSaveItem['position']>;
  sessionOverride: StaffingFinalSessionOverrideForm;
}>;

export type StaffingFinalPlanForm = FormGroup<{ items: FormArray<StaffingFinalPlanItemForm> }>;
export type StaffingFinalPlanItemDraft = ReturnType<StaffingFinalPlanItemForm['getRawValue']>;
