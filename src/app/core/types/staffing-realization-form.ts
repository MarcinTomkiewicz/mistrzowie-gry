import { FormArray, FormControl, FormGroup } from '@angular/forms';

import { StaffingRealizationType } from './staffing-realization';

export type StaffingRealizationCoreForm = FormGroup<{
  name: FormControl<string>;
  description: FormControl<string>;
  operationalNotes: FormControl<string>;
  city: FormControl<string>;
  venueName: FormControl<string>;
  venueAddress: FormControl<string>;
  timezone: FormControl<string>;
  type: FormControl<StaffingRealizationType>;
  eventId: FormControl<string | null>;
}>;

export type StaffingRealizationInitialDaysForm = FormGroup<{
  dateRange: FormControl<(Date | null)[] | null>;
  requiredGmCount: FormControl<number>;
}>;

export type StaffingRealizationDayForm = FormGroup<{
  id: FormControl<string | null>;
  date: FormControl<Date | null>;
  requiredGmCount: FormControl<number>;
}>;

export type StaffingRealizationDaysForm = FormGroup<{
  days: FormArray<StaffingRealizationDayForm>;
}>;
