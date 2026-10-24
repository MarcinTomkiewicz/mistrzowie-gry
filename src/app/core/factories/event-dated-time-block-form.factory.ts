import { FormArray, FormControl, FormGroup, ValidationErrors, Validators } from '@angular/forms';

import type { EventDateTimeBlocks } from '../interfaces/i-admin-global-event';
import type { EventScheduleFormGroup } from '../types/event-admin-form';
import { isEventScheduleDateCandidate } from '../utils/event-schedule';
import { isoDateValidator } from '../validators/event-admin.validator';
import { mapEventScheduleFormToPayload } from './event-schedule-form.factory';
import { createEventGlobalTimeBlocksForm, mapEventGlobalTimeBlocks } from './event-global-time-block-form.factory';

export function createEventDateTimeBlocksForm(date: string) {
  return new FormGroup({
    date: new FormControl(date, { nonNullable: true, validators: [Validators.required, isoDateValidator()] }),
    timeBlocks: createEventGlobalTimeBlocksForm(),
  });
}

export type EventDateTimeBlocksForm = ReturnType<typeof createEventDateTimeBlocksForm>;
export type EventDateTimeBlocksForms = FormArray<EventDateTimeBlocksForm>;

export function mapEventDateTimeBlocks(forms: EventDateTimeBlocksForms): EventDateTimeBlocks[] {
  return forms.controls.map(form => ({ date: form.controls.date.value, timeBlocks: mapEventGlobalTimeBlocks(form.controls.timeBlocks) }));
}

export function eventDraftDatedBlocksValidator(
  schedule: EventScheduleFormGroup,
  scopes: readonly EventDateTimeBlocksForms[],
): ValidationErrors | null {
  if (schedule.invalid || scopes.every(scope => scope.length === 0)) return null;
  const payload = mapEventScheduleFormToPayload(schedule);
  for (const scope of scopes) {
    const dates = scope.controls.map(row => row.controls.date.value);
    if (new Set(dates).size !== dates.length || dates.some(date => !isEventScheduleDateCandidate(payload, date))) {
      return { datedDates: true };
    }
  }
  return null;
}
