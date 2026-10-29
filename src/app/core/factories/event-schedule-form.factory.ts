import { FormArray, FormControl, FormGroup, Validators } from '@angular/forms';

import type { IEventSchedule } from '../interfaces/i-event-schedule';
import type { EventGlobalSchedule } from '../interfaces/i-admin-global-event';
import type { EventScheduleExclusionRuleFormGroup, EventScheduleFormGroup } from '../types/event-admin-form';
import type { EventMonthlyNth, EventRecurrenceKind, EventScheduleMode } from '../types/event';
import { buildEventScheduleExdates, excludesEveryEventRecurrenceCandidate, expandEventDateRange, getEventDateRangeLength } from '../utils/event-schedule';
import { eventMonthlyWeekdayRuleValidator, eventScheduleValidator, isoDateValidator } from '../validators/event-admin.validator';
import { integerValidator } from '../validators/form-value.validator';

export function createEventScheduleForm(globalCalendar = false): EventScheduleFormGroup {
  const form: EventScheduleFormGroup = new FormGroup(
    {
      kind: new FormControl<EventScheduleMode>('single', {
        nonNullable: true,
      }),
      date: new FormControl('', { nonNullable: true }),
      dates: new FormArray<FormControl<string>>([]),
      recurrenceKind: new FormControl<EventRecurrenceKind>('WEEKLY', {
        nonNullable: true,
      }),
      interval: new FormControl(1, {
        nonNullable: true,
        validators: [
          Validators.required,
          integerValidator(),
          Validators.min(1),
        ],
      }),
      byweekday: new FormControl<number[]>([], { nonNullable: true }),
      monthlyNth: new FormControl<EventMonthlyNth | null>(null),
      monthlyWeekday: new FormControl<number | null>(null),
      dayOfMonth: new FormControl<number | null>(null),
      startDate: new FormControl('', { nonNullable: true }),
      endDate: new FormControl('', { nonNullable: true }),
      exdates: new FormArray<FormControl<string>>([]),
      exclusionRules: new FormArray<EventScheduleExclusionRuleFormGroup>([]),
    },
    { validators: [control => eventScheduleValidator(control, globalCalendar)] },
  );
  form.addValidators(() => {
    const controls = form.controls;
    if (controls.kind.value !== 'recurring' || controls.exclusionRules.invalid ||
      eventScheduleValidator(form, globalCalendar) || controls.interval.invalid ||
      (getEventDateRangeLength(controls.startDate.value, controls.endDate.value) ?? Infinity) > 3661) return null;
    const schedule = mapEventScheduleFormToPayload(form);
    return schedule.kind === 'recurring' && excludesEveryEventRecurrenceCandidate(schedule)
      ? { allDatesExcluded: true } : null;
  });
  return form;
}

export function createEventScheduleExclusionRule(globalCalendar = false): EventScheduleExclusionRuleFormGroup {
  return new FormGroup({
    monthlyNth: new FormControl<EventMonthlyNth>(1, { nonNullable: true, validators: Validators.required }),
    monthlyWeekday: new FormControl(1, { nonNullable: true, validators: Validators.required }),
  }, { validators: control => eventMonthlyWeekdayRuleValidator(control, globalCalendar) });
}

export function getEventScheduleExdates(form: EventScheduleFormGroup): string[] {
  const value = form.getRawValue();
  return buildEventScheduleExdates(value.startDate, value.endDate, value.exdates, value.exclusionRules);
}

export function createEventExdateControl(
  value = '',
): FormControl<string> {
  return new FormControl(value, {
    nonNullable: true,
    validators: [Validators.required, isoDateValidator()],
  });
}

export function populateEventScheduleForm(
  form: EventScheduleFormGroup,
  schedule: IEventSchedule | EventGlobalSchedule | null,
): void {
  const recurring = schedule?.kind === 'recurring' ? schedule : null;

  form.patchValue(
    {
      kind: schedule?.kind ?? 'single',
      date: schedule?.kind === 'single' ? schedule.date : '',
      recurrenceKind: recurring?.recurrenceKind ?? 'WEEKLY',
      interval: recurring?.interval ?? 1,
      byweekday: recurring?.recurrenceKind === 'WEEKLY' ? recurring.byweekday ?? [] : [],
      monthlyNth: recurring?.recurrenceKind === 'MONTHLY_NTH_WEEKDAY' ? recurring.monthlyNth : null,
      monthlyWeekday: recurring?.recurrenceKind === 'MONTHLY_NTH_WEEKDAY' ? recurring.monthlyWeekday : null,
      dayOfMonth: recurring?.recurrenceKind === 'MONTHLY_DAY_OF_MONTH' ? recurring.dayOfMonth : null,
      startDate: recurring?.startDate ?? '',
      endDate: recurring?.endDate ?? '',
    },
    { emitEvent: false },
  );

  form.controls.dates.clear({ emitEvent: false });
  for (const date of schedule?.kind === 'exact_dates' ? schedule.dates : []) {
    form.controls.dates.push(new FormControl(date, { nonNullable: true }), {
      emitEvent: false,
    });
  }

  form.controls.exdates.clear({ emitEvent: false });
  form.controls.exclusionRules.clear({ emitEvent: false });
  for (const exdate of recurring?.exdates ?? []) {
    form.controls.exdates.push(createEventExdateControl(exdate), {
      emitEvent: false,
    });
  }
  form.updateValueAndValidity({ emitEvent: false });
}

export function mapEventScheduleFormToPayload(
  form: EventScheduleFormGroup,
): IEventSchedule {
  const value = form.getRawValue();

  if (value.kind === 'single') {
    return {
      kind: 'single',
      date: value.date,
    };
  }

  if (value.kind === 'range') {
    return { kind: 'exact_dates', dates: expandEventDateRange(value.startDate, value.endDate) };
  }

  if (value.kind === 'exact_dates') {
    return {
      kind: 'exact_dates',
      dates: [...new Set(value.dates)].sort(),
    };
  }

  const base = {
    kind: 'recurring' as const,
    recurrenceKind: value.recurrenceKind,
    interval: value.interval,
    startDate: value.startDate,
    endDate: value.endDate,
    exdates: getEventScheduleExdates(form),
  };

  switch (value.recurrenceKind) {
    case 'WEEKLY':
      return {
        ...base,
        byweekday: [...value.byweekday],
        monthlyNth: null,
        monthlyWeekday: null,
        dayOfMonth: null,
      };
    case 'MONTHLY_NTH_WEEKDAY':
      return {
        ...base,
        byweekday: null,
        monthlyNth: value.monthlyNth,
        monthlyWeekday: value.monthlyWeekday,
        dayOfMonth: null,
      };
    case 'MONTHLY_DAY_OF_MONTH':
      return {
        ...base,
        byweekday: null,
        monthlyNth: null,
        monthlyWeekday: null,
        dayOfMonth: value.dayOfMonth,
      };
  }
}
