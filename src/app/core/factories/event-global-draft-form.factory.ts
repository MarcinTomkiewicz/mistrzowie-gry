import { AbstractControl, FormArray, FormControl, FormGroup, ValidationErrors, Validators } from '@angular/forms';

import { DEFAULT_TIMEZONE } from '../configs/time.config';
import { ParticipantSignupKind } from '../enums/event';
import type { CreateAdminGlobalEventPayload, EventCurrency, EventPriceBasis } from '../interfaces/i-admin-global-event';
import type { IEventSingleSchedule } from '../interfaces/i-event-schedule';
import { isValidDate, toIsoDate } from '../utils/date';
import { normalizeText } from '../utils/normalize-text';
import { timestampToTimeZoneDate } from '../utils/time-zone';
import { eventTimeRangeValidator } from '../validators/event-admin.validator';
import { integerValidator, slugSourceValidator, timeFormatValidator, validDateValidator } from '../validators/form-value.validator';
import { requiredTrimmedValidator } from '../validators/required-trimmed.validator';

const requiredText = [Validators.required, requiredTrimmedValidator()];
const positiveInteger = [integerValidator(), Validators.min(1), Validators.max(2147483647)];

export function createEventGlobalTimeBlockForm() {
  return new FormGroup({
    label: new FormControl('', { nonNullable: true, validators: [...requiredText, Validators.maxLength(140)] }),
    startTime: new FormControl('', { nonNullable: true, validators: [...requiredText, timeFormatValidator()] }),
    endTime: new FormControl('', { nonNullable: true, validators: [...requiredText, timeFormatValidator()] }),
    requiredGmCount: new FormControl(1, { nonNullable: true, validators: [Validators.required, ...positiveInteger] }),
  }, { validators: eventTimeRangeValidator });
}

export function createEventGlobalDraftForm() {
  return new FormGroup({
    name: new FormControl('', { nonNullable: true, validators: [...requiredText, Validators.maxLength(140), slugSourceValidator()] }),
    shortDescription: new FormControl('', { nonNullable: true, validators: Validators.maxLength(500) }),
    longDescription: new FormControl('', { nonNullable: true, validators: Validators.maxLength(12000) }),
    city: new FormControl('', { nonNullable: true, validators: [...requiredText, Validators.maxLength(120), slugSourceValidator()] }),
    venueName: new FormControl('', { nonNullable: true, validators: [Validators.maxLength(140)] }),
    venueAddress: new FormControl('', { nonNullable: true, validators: [Validators.maxLength(240)] }),
    timezone: new FormControl(DEFAULT_TIMEZONE, { nonNullable: true, validators: [...requiredText, timezoneValidator] }),
    facebookLink: new FormControl('', { nonNullable: true, validators: [Validators.maxLength(500),
      Validators.pattern(/^https:\/\/(?:www\.)?(?:facebook\.com|fb\.com|fb\.me)\/[^\s/?#]+[^\s]*$/)] }),
    date: new FormControl<Date | null>(null, { validators: [Validators.required, validDateValidator()] }),
    timeBlocks: new FormArray([createEventGlobalTimeBlockForm()], { validators: Validators.required }),
    priceAmount: new FormControl<number | null>(null, { validators: [Validators.min(0), Validators.max(99999999.99), pricePrecisionValidator] }),
    priceCurrency: new FormControl<EventCurrency>('PLN', { nonNullable: true, validators: Validators.required }),
    priceBasis: new FormControl<EventPriceBasis>({ value: 'per_participant', disabled: true }, { nonNullable: true, validators: Validators.required }),
    isForBeginners: new FormControl(false, { nonNullable: true }),
    participantSignupKind: new FormControl(ParticipantSignupKind.ProgramItem, { nonNullable: true, validators: Validators.required }),
    signupRequired: new FormControl(false, { nonNullable: true }),
    sessionCapacityCeiling: new FormControl<number | null>(null, { validators: positiveInteger }),
    wholeEventCapacity: new FormControl<number | null>({ value: null, disabled: true }, { validators: positiveInteger }),
  }, { validators: globalDateValidator });
}

export type EventGlobalDraftForm = ReturnType<typeof createEventGlobalDraftForm>;

export function mapEventGlobalDraftToPayload(
  form: EventGlobalDraftForm,
): CreateAdminGlobalEventPayload & { schedule: IEventSingleSchedule } {
  const value = form.getRawValue();
  if (!isValidDate(value.date)) throw new Error('[EVENT_GLOBAL_DRAFT] Invalid global date.');
  return {
    name: value.name.trim(),
    shortDescription: normalizeText(value.shortDescription),
    longDescription: normalizeText(value.longDescription),
    mainCity: {
      city: value.city.trim(), venueName: normalizeText(value.venueName),
      venueAddress: normalizeText(value.venueAddress), timezone: value.timezone,
      facebookLink: normalizeText(value.facebookLink),
    },
    schedule: { kind: 'single', date: toIsoDate(value.date) },
    timeBlocks: value.timeBlocks.map((block, index) => ({
      ...block, label: block.label.trim(), position: index + 1, startDayOffset: 0, endDayOffset: 0,
    })),
    policy: {
      price: { amount: value.priceAmount, currency: value.priceCurrency, basis: value.priceAmount === null ? null : value.priceBasis },
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

function globalDateValidator(control: AbstractControl): ValidationErrors | null {
  const date: unknown = control.get('date')?.value;
  const timezone: unknown = control.get('timezone')?.value;
  if (!isValidDate(date) || typeof timezone !== 'string' || control.get('timezone')?.invalid) return null;
  const today = timestampToTimeZoneDate(new Date().toISOString(), timezone);
  return today && date.getFullYear() >= 2000 && date.getFullYear() <= 2100 && toIsoDate(date) >= toIsoDate(today)
    ? null : { globalDate: true };
}

function pricePrecisionValidator(control: AbstractControl): ValidationErrors | null {
  const value: unknown = control.value;
  return value === null || (typeof value === 'number' && Number.isFinite(value) && Math.round(value * 100) / 100 === value)
    ? null : { pricePrecision: true };
}
