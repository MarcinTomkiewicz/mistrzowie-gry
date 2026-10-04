import { FormArray, FormControl, FormGroup } from '@angular/forms';

import {
  StaffingRealizationCoreDraft,
  StaffingRealizationSlotDraft,
  StaffingRealizationTravelTermsDraft,
} from './staffing-realization-editor-draft';

export type StaffingRealizationCoreForm = FormGroup<{
  [K in keyof StaffingRealizationCoreDraft]: FormControl<StaffingRealizationCoreDraft[K]>;
}>;

export type StaffingRealizationInitialDaysForm = FormGroup<{
  dateRange: FormControl<(Date | null)[] | null>;
  requiredGmCount: FormControl<number>;
}>;

export type StaffingRealizationDayForm = FormGroup<{
  id: FormControl<string | null>;
  date: FormControl<Date | null>;
  requiredGmCount: FormControl<number>;
  slots: FormArray<StaffingRealizationSlotForm>;
}>;

export type StaffingRealizationSlotForm = FormGroup<{
  [K in keyof StaffingRealizationSlotDraft]: FormControl<StaffingRealizationSlotDraft[K]>;
}>;

export type StaffingRealizationDaysForm = FormGroup<{
  days: FormArray<StaffingRealizationDayForm>;
}>;

export type StaffingRealizationTravelTermsForm = FormGroup<{
  [K in keyof StaffingRealizationTravelTermsDraft]: FormControl<StaffingRealizationTravelTermsDraft[K]>;
}>;
