import {
  FormArray,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';

import { ParticipantSignupKind } from '../enums/event';
import {
  IAdminEventDetail,
  IEventSavePayload,
} from '../interfaces/i-event-admin';
import {
  IEventRecurringSchedule,
  IEventSingleSchedule,
} from '../interfaces/i-event-schedule';
import {
  EventEditionFormGroup,
  EventScheduleFormGroup,
} from '../types/event-admin-form';
import {
  EventMonthlyNth,
  EventRecurrenceKind,
  EventScheduleKind,
} from '../types/event';
import { normalizeText } from '../utils/normalize-text';
import { formatTimeLabel } from '../utils/time';
import {
  eventScheduleValidator,
  eventTimeRangeValidator,
  isoDateValidator,
  storagePathValidator,
} from '../validators/event-admin.validator';
import { integerValidator } from '../validators/form-value.validator';
import { requiredTrimmedValidator } from '../validators/required-trimmed.validator';

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
        validators: [Validators.required, requiredTrimmedValidator()],
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
      displayOrder: new FormControl(0, {
        nonNullable: true,
        validators: [
          Validators.required,
          integerValidator(),
          Validators.min(0),
        ],
      }),
      isForBeginners: new FormControl(false, { nonNullable: true }),
      timezone: new FormControl('Europe/Warsaw', {
        nonNullable: true,
        validators: [Validators.required, requiredTrimmedValidator()],
      }),
      startTime: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, requiredTrimmedValidator()],
      }),
      endTime: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, requiredTrimmedValidator()],
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

export function createEventScheduleForm(): EventScheduleFormGroup {
  return new FormGroup(
    {
      kind: new FormControl<EventScheduleKind>('single', {
        nonNullable: true,
      }),
      date: new FormControl('', { nonNullable: true }),
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
    },
    { validators: [eventScheduleValidator] },
  );
}

export function createEventExdateControl(
  value = '',
): FormControl<string> {
  return new FormControl(value, {
    nonNullable: true,
    validators: [Validators.required, isoDateValidator()],
  });
}

export function populateEventEditionForm(
  form: EventEditionFormGroup,
  eventCoreId: string,
  detail: IAdminEventDetail | null,
): void {
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
      displayOrder: detail?.displayOrder ?? 0,
      isForBeginners: detail?.isForBeginners ?? false,
      timezone: detail?.timezone ?? 'Europe/Warsaw',
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
  id: string | null,
): IEventSavePayload {
  const value = form.getRawValue();

  return {
    id,
    eventCoreId: value.eventCoreId,
    slug: value.slug.trim(),
    city: value.city.trim(),
    venueName: normalizeText(value.venueName),
    venueAddress: normalizeText(value.venueAddress),
    priceAmount: value.priceAmount,
    priceCurrency: value.priceCurrency.trim(),
    priceLabel: normalizeText(value.priceLabel),
    coverImagePath: normalizeText(value.coverImagePath),
    facebookLink: normalizeText(value.facebookLink),
    isActive: value.isActive,
    isDefaultPublic: value.isDefaultPublic,
    displayOrder: value.displayOrder,
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

function populateEventScheduleForm(
  form: EventScheduleFormGroup,
  schedule: IEventSingleSchedule | IEventRecurringSchedule | null,
): void {
  const recurring = schedule?.kind === 'recurring' ? schedule : null;

  form.patchValue(
    {
      kind: schedule?.kind ?? 'single',
      date: schedule?.kind === 'single' ? schedule.date : '',
      recurrenceKind: recurring?.recurrenceKind ?? 'WEEKLY',
      interval: recurring?.interval ?? 1,
      byweekday: recurring?.byweekday ?? [],
      monthlyNth: recurring?.monthlyNth ?? null,
      monthlyWeekday: recurring?.monthlyWeekday ?? null,
      dayOfMonth: recurring?.dayOfMonth ?? null,
      startDate: recurring?.startDate ?? '',
      endDate: recurring?.endDate ?? '',
    },
    { emitEvent: false },
  );

  form.controls.exdates.clear({ emitEvent: false });
  for (const exdate of recurring?.exdates ?? []) {
    form.controls.exdates.push(createEventExdateControl(exdate), {
      emitEvent: false,
    });
  }
  form.updateValueAndValidity({ emitEvent: false });
}

function mapEventScheduleFormToPayload(
  form: EventScheduleFormGroup,
): IEventSingleSchedule | IEventRecurringSchedule {
  const value = form.getRawValue();

  if (value.kind === 'single') {
    return {
      kind: 'single',
      date: value.date,
    };
  }

  const base = {
    kind: 'recurring' as const,
    recurrenceKind: value.recurrenceKind,
    interval: value.interval,
    startDate: value.startDate,
    endDate: value.endDate,
    exdates: [...value.exdates],
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
