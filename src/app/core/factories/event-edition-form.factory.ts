import {
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';

import { DEFAULT_TIMEZONE } from '../configs/time.config';
import { ParticipantSignupKind } from '../enums/event';
import {
  IAdminEventDetail,
  IEventSavePayload,
} from '../interfaces/i-event-admin';
import { EventEditionFormGroup } from '../types/event-admin-form';
import { normalizeText } from '../utils/normalize-text';
import { formatTimeLabel } from '../utils/time-format';
import {
  eventTimeRangeValidator,
  storagePathValidator,
} from '../validators/event-admin.validator';
import {
  integerValidator,
  slugSourceValidator,
  timeFormatValidator,
} from '../validators/form-value.validator';
import { requiredTrimmedValidator } from '../validators/required-trimmed.validator';
import { createEventScheduleForm, mapEventScheduleFormToPayload, populateEventScheduleForm } from './event-schedule-form.factory';

const CITY_SLUG_SOURCE_VALIDATOR = slugSourceValidator();

export function createEventEditionForm(
  eventCoreId: string,
): EventEditionFormGroup {
  return new FormGroup(
    {
      eventCoreId: new FormControl(eventCoreId, {
        nonNullable: true,
        validators: [Validators.required],
      }),
      slug: new FormControl('', {
        nonNullable: true,
        validators: [
          Validators.required,
          requiredTrimmedValidator(),
          Validators.pattern(/^[a-z0-9-]+$/),
        ],
      }),
      city: new FormControl('', {
        nonNullable: true,
        validators: [
          Validators.required,
          requiredTrimmedValidator(),
          CITY_SLUG_SOURCE_VALIDATOR,
        ],
      }),
      venueName: new FormControl('', { nonNullable: true }),
      venueAddress: new FormControl('', { nonNullable: true }),
      priceAmount: new FormControl<number | null>(null, {
        validators: [Validators.min(0)],
      }),
      priceCurrency: new FormControl('PLN', {
        nonNullable: true,
        validators: [Validators.required, requiredTrimmedValidator()],
      }),
      priceLabel: new FormControl('', { nonNullable: true }),
      coverImagePath: new FormControl('', {
        nonNullable: true,
        validators: [storagePathValidator()],
      }),
      facebookLink: new FormControl('', { nonNullable: true }),
      isActive: new FormControl(false, { nonNullable: true }),
      isDefaultPublic: new FormControl(false, { nonNullable: true }),
      isForBeginners: new FormControl(false, { nonNullable: true }),
      timezone: new FormControl(DEFAULT_TIMEZONE, {
        nonNullable: true,
        validators: [Validators.required, requiredTrimmedValidator()],
      }),
      startTime: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, requiredTrimmedValidator(), timeFormatValidator()],
      }),
      endTime: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, requiredTrimmedValidator(), timeFormatValidator()],
      }),
      participantSignupKind: new FormControl<ParticipantSignupKind>(
        ParticipantSignupKind.ProgramItem,
        { nonNullable: true, validators: [Validators.required] },
      ),
      signupRequired: new FormControl(false, { nonNullable: true }),
      defaultSlotCapacity: new FormControl(1, {
        nonNullable: true,
        validators: [
          Validators.required,
          integerValidator(),
          Validators.min(1),
          Validators.max(12),
        ],
      }),
      defaultParticipantCapacity: new FormControl<number | null>(null, {
        validators: [integerValidator(), Validators.min(1)],
      }),
      schedule: createEventScheduleForm(),
    },
    { validators: [eventTimeRangeValidator] },
  );
}

export function populateEventEditionForm(
  form: EventEditionFormGroup,
  eventCoreId: string,
  detail: IAdminEventDetail | null,
): void {
  if (detail) {
    form.controls.city.removeValidators(CITY_SLUG_SOURCE_VALIDATOR);
  } else {
    form.controls.city.addValidators(CITY_SLUG_SOURCE_VALIDATOR);
  }

  form.patchValue(
    {
      eventCoreId,
      slug: detail?.slug ?? '',
      city: detail?.city ?? '',
      venueName: detail?.venueName ?? '',
      venueAddress: detail?.venueAddress ?? '',
      priceAmount: detail?.priceAmount ?? null,
      priceCurrency: detail?.priceCurrency ?? 'PLN',
      priceLabel: detail?.priceLabel ?? '',
      coverImagePath: detail?.coverImagePath ?? '',
      facebookLink: detail?.facebookLink ?? '',
      isActive: detail?.isActive ?? false,
      isDefaultPublic: detail?.isDefaultPublic ?? false,
      isForBeginners: detail?.isForBeginners ?? false,
      timezone: detail?.timezone ?? DEFAULT_TIMEZONE,
      startTime: formatTimeLabel(detail?.startTime),
      endTime: formatTimeLabel(detail?.endTime),
      participantSignupKind:
        detail?.participantSignupKind ?? ParticipantSignupKind.ProgramItem,
      signupRequired: detail?.signupRequired ?? false,
      defaultSlotCapacity: detail?.defaultSlotCapacity ?? 1,
      defaultParticipantCapacity:
        detail?.defaultParticipantCapacity ?? null,
    },
    { emitEvent: false },
  );

  populateEventScheduleForm(form.controls.schedule, detail?.schedule ?? null);
  form.updateValueAndValidity({ emitEvent: false });
  form.markAsPristine();
  form.markAsUntouched();
}

export function mapEventEditionFormToPayload(
  form: EventEditionFormGroup,
  detail: IAdminEventDetail | null,
): IEventSavePayload {
  const value = form.getRawValue();

  return {
    id: detail?.id ?? null,
    eventCoreId: value.eventCoreId,
    slug: detail?.slug ?? value.slug,
    city: detail?.city ?? value.city.trim(),
    venueName: normalizeText(value.venueName),
    venueAddress: normalizeText(value.venueAddress),
    priceAmount: value.priceAmount,
    priceCurrency: value.priceCurrency.trim(),
    priceLabel: normalizeText(value.priceLabel),
    coverImagePath: normalizeText(value.coverImagePath),
    facebookLink: normalizeText(value.facebookLink),
    isActive: value.isActive,
    isDefaultPublic: value.isDefaultPublic,
    displayOrder: detail?.displayOrder ?? 0,
    isForBeginners: value.isForBeginners,
    timezone: value.timezone.trim(),
    startTime: value.startTime,
    endTime: value.endTime,
    participantSignupKind: value.participantSignupKind,
    signupRequired: value.signupRequired,
    defaultSlotCapacity: value.defaultSlotCapacity,
    defaultParticipantCapacity: value.defaultParticipantCapacity,
    schedule: mapEventScheduleFormToPayload(form.controls.schedule),
  };
}
