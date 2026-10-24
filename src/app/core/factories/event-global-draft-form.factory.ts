import { AbstractControl, FormArray, FormControl, FormGroup, ValidationErrors, Validators } from '@angular/forms';

import { DEFAULT_TIMEZONE } from '../configs/time.config';
import { MAX_GLOBAL_EVENT_DATES } from '../configs/events.config';
import { ParticipantSignupKind } from '../enums/event';
import type { AddAdminGlobalEventCityPayload, CreateAdminGlobalEventPayload, EventCurrency, EventGlobalSchedule, EventPriceBasis } from '../interfaces/i-admin-global-event';
import type { IEventSchedule } from '../interfaces/i-event-schedule';
import { isValidIsoDate, parseIsoDate, toIsoDate } from '../utils/date';
import { getEventDateRangeLength } from '../utils/event-schedule';
import { normalizeText } from '../utils/normalize-text';
import { timestampToTimeZoneDate } from '../utils/time-zone';
import { integerValidator, slugSourceValidator } from '../validators/form-value.validator';
import { requiredTrimmedValidator } from '../validators/required-trimmed.validator';
import { createEventScheduleForm, mapEventScheduleFormToPayload } from './event-schedule-form.factory';
import { type EventDateTimeBlocksForm, eventDraftDatedBlocksValidator, mapEventDateTimeBlocks } from './event-dated-time-block-form.factory';
import { createEventGlobalTimeBlocksForm, mapEventGlobalTimeBlocks } from './event-global-time-block-form.factory';

const requiredText = [Validators.required, requiredTrimmedValidator()];
const positiveInteger = [integerValidator(), Validators.min(1), Validators.max(2147483647)];

export function createEventGlobalCityControls() {
  return {
    city: new FormControl('', { nonNullable: true, validators: [...requiredText, Validators.maxLength(120), slugSourceValidator()] }),
    venueName: new FormControl('', { nonNullable: true, validators: [Validators.maxLength(140)] }),
    venueAddress: new FormControl('', { nonNullable: true, validators: [Validators.maxLength(240)] }),
    timezone: new FormControl(DEFAULT_TIMEZONE, { nonNullable: true, validators: [...requiredText, timezoneValidator] }),
    facebookLink: new FormControl('', { nonNullable: true, validators: [Validators.maxLength(500),
      Validators.pattern(/^https:\/\/(?:www\.)?(?:facebook\.com|fb\.com|fb\.me)\/[^\s/?#]+[^\s]*$/)] }),
  };
}

export type EventGlobalCityControls = ReturnType<typeof createEventGlobalCityControls>;

export function mapEventGlobalCity(controls: EventGlobalCityControls): AddAdminGlobalEventCityPayload {
  return {
    city: controls.city.value.trim(), venueName: normalizeText(controls.venueName.value),
    venueAddress: normalizeText(controls.venueAddress.value), timezone: controls.timezone.value,
    facebookLink: normalizeText(controls.facebookLink.value),
  };
}

export function createEventGlobalDraftForm() {
  const form = new FormGroup({
    name: new FormControl('', { nonNullable: true, validators: [...requiredText, Validators.maxLength(140), slugSourceValidator()] }),
    shortDescription: new FormControl('', { nonNullable: true, validators: Validators.maxLength(500) }),
    longDescription: new FormControl('', { nonNullable: true, validators: Validators.maxLength(12000) }),
    ...createEventGlobalCityControls(),
    schedule: createEventScheduleForm(),
    timeBlocks: createEventGlobalTimeBlocksForm(),
    dateTimeBlocks: new FormArray<EventDateTimeBlocksForm>([]),
    mainCityDateTimeBlocks: new FormArray<EventDateTimeBlocksForm>([]),
    priceAmount: new FormControl<number | null>(null, { validators: [Validators.min(0), Validators.max(99999999.99), pricePrecisionValidator] }),
    priceCurrency: new FormControl<EventCurrency>('PLN', { nonNullable: true, validators: Validators.required }),
    priceBasis: new FormControl<EventPriceBasis>({ value: 'per_participant', disabled: true }, { nonNullable: true, validators: Validators.required }),
    isForBeginners: new FormControl(false, { nonNullable: true }),
    participantSignupKind: new FormControl(ParticipantSignupKind.ProgramItem, { nonNullable: true, validators: Validators.required }),
    signupRequired: new FormControl(false, { nonNullable: true }),
    sessionCapacityCeiling: new FormControl<number | null>(null, { validators: positiveInteger }),
    wholeEventCapacity: new FormControl<number | null>({ value: null, disabled: true }, { validators: positiveInteger }),
  }, { validators: globalDatesValidator });
  form.addValidators(() => eventDraftDatedBlocksValidator(form.controls.schedule,
    [form.controls.dateTimeBlocks, form.controls.mainCityDateTimeBlocks]));
  return form;
}

export type EventGlobalDraftForm = ReturnType<typeof createEventGlobalDraftForm>;

export function mapEventGlobalDraftToPayload(
  form: EventGlobalDraftForm,
): CreateAdminGlobalEventPayload {
  const value = form.getRawValue();
  return {
    name: value.name.trim(),
    shortDescription: normalizeText(value.shortDescription),
    longDescription: normalizeText(value.longDescription),
    mainCity: mapEventGlobalCity(form.controls),
    schedule: mapGlobalSchedule(mapEventScheduleFormToPayload(form.controls.schedule)),
    timeBlocks: mapEventGlobalTimeBlocks(form.controls.timeBlocks),
    ...(value.dateTimeBlocks.length ? { dateTimeBlocks: mapEventDateTimeBlocks(form.controls.dateTimeBlocks) } : {}),
    ...(value.mainCityDateTimeBlocks.length ? { mainCityDateTimeBlocks: mapEventDateTimeBlocks(form.controls.mainCityDateTimeBlocks) } : {}),
    policy: {
      price: { amount: value.priceAmount ?? 0, currency: value.priceCurrency, basis: value.priceBasis },
      coverImagePath: null, isForBeginners: value.isForBeginners,
      participantSignupKind: value.participantSignupKind, signupRequired: value.signupRequired,
      sessionCapacityCeiling: value.sessionCapacityCeiling,
      wholeEventCapacity: value.participantSignupKind === ParticipantSignupKind.ProgramItem ? null : value.wholeEventCapacity,
    },
  };
}

function timezoneValidator(control: AbstractControl): ValidationErrors | null {
  try {
    new Intl.DateTimeFormat('pl-PL', { timeZone: control.value }).format();
    return null;
  } catch {
    return { timezone: true };
  }
}

function globalDatesValidator(control: AbstractControl): ValidationErrors | null {
  const schedule = control.get('schedule');
  const timezone: unknown = control.get('timezone')?.value;
  if (!schedule || schedule.invalid || typeof timezone !== 'string' || control.get('timezone')?.invalid) return null;
  const kind: unknown = schedule.get('kind')?.value;
  const selection: unknown = kind === 'single' ? [schedule.get('date')?.value]
    : kind === 'exact_dates' ? schedule.get('dates')?.getRawValue()
    : [schedule.get('startDate')?.value, schedule.get('endDate')?.value];
  if (!Array.isArray(selection) || !selection.every(isValidIsoDate)) return { globalDates: true };
  const dates = selection;
  const today = timestampToTimeZoneDate(new Date().toISOString(), timezone);
  const validDates = today && dates.length > 0 && new Set(dates).size <= MAX_GLOBAL_EVENT_DATES && dates.every((date) => {
    const parsed = parseIsoDate(date);
    return parsed && parsed.getFullYear() >= 2000 && parsed.getFullYear() <= 2100 && date >= toIsoDate(today);
  });
  const interval: unknown = schedule.get('interval')?.value;
  const validRecurrence = kind !== 'recurring' || (typeof interval === 'number' && interval <= 52 &&
    (getEventDateRangeLength(dates[0], dates[1]) ?? 0) <= 3661);
  return validDates && validRecurrence
    ? null : { globalDates: true };
}

function mapGlobalSchedule(schedule: IEventSchedule): EventGlobalSchedule {
  if (schedule.kind !== 'recurring') return schedule;
  const { kind, recurrenceKind, interval, startDate, endDate, exdates } = schedule;
  const base = { kind, interval, startDate, endDate, exdates };
  switch (recurrenceKind) {
    case 'WEEKLY':
      if (!schedule.byweekday) throw new Error('[EVENT_GLOBAL_DRAFT] Missing weekdays.');
      return { ...base, recurrenceKind, byweekday: schedule.byweekday };
    case 'MONTHLY_DAY_OF_MONTH':
      if (schedule.dayOfMonth === null) throw new Error('[EVENT_GLOBAL_DRAFT] Missing month day.');
      return { ...base, recurrenceKind, dayOfMonth: schedule.dayOfMonth };
    case 'MONTHLY_NTH_WEEKDAY':
      if (schedule.monthlyNth === null || schedule.monthlyWeekday === null) throw new Error('[EVENT_GLOBAL_DRAFT] Missing monthly weekday.');
      return { ...base, recurrenceKind, monthlyNth: schedule.monthlyNth, monthlyWeekday: schedule.monthlyWeekday };
  }
}

function pricePrecisionValidator(control: AbstractControl): ValidationErrors | null {
  const value: unknown = control.value;
  return value === null || (typeof value === 'number' && Number.isFinite(value) && Math.round(value * 100) / 100 === value)
    ? null : { pricePrecision: true };
}
