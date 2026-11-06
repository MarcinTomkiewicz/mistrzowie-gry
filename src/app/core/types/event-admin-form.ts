import { FormArray, FormControl, FormGroup } from '@angular/forms';

import {
  EventMonthlyNth,
  EventRecurrenceKind,
  EventScheduleMode,
} from './event';

export type EventScheduleFormGroup = FormGroup<{
  kind: FormControl<EventScheduleMode>;
  date: FormControl<string>;
  dates: FormArray<FormControl<string>>;
  recurrenceKind: FormControl<EventRecurrenceKind>;
  interval: FormControl<number>;
  byweekday: FormControl<number[]>;
  monthlyNth: FormControl<EventMonthlyNth | null>;
  monthlyWeekday: FormControl<number | null>;
  dayOfMonth: FormControl<number | null>;
  startDate: FormControl<string>;
  endDate: FormControl<string>;
  exdates: FormArray<FormControl<string>>;
  exclusionRules: FormArray<EventScheduleExclusionRuleFormGroup>;
}>;

export type EventScheduleExclusionRuleFormGroup = FormGroup<{
  monthlyNth: FormControl<EventMonthlyNth>;
  monthlyWeekday: FormControl<number>;
}>;
