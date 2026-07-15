import { FormControl, FormGroup, Validators } from '@angular/forms';

import {
  EventOccurrenceStatus,
  ParticipantSignupKind,
} from '../enums/event';
import {
  IAdminOccurrenceListItem,
  IOccurrenceSavePayload,
} from '../interfaces/i-event-admin';
import { EventOccurrenceFormGroup } from '../types/event-admin-form';
import {
  timestampToTimeZoneDate,
  timeZoneDateToTimestamp,
} from '../utils/time';
import {
  dateTimeRangeValidator,
  integerValidator,
  validDateValidator,
} from '../validators/event-admin.validator';

export function createEventOccurrenceForm(
  getTimeZone: () => string,
  getOccurrence: () => IAdminOccurrenceListItem,
): EventOccurrenceFormGroup {
  return new FormGroup(
    {
      status: new FormControl<EventOccurrenceStatus>(
        EventOccurrenceStatus.Planned,
        { nonNullable: true, validators: [Validators.required] },
      ),
      slotCapacity: new FormControl(1, {
        nonNullable: true,
        validators: [
          Validators.required,
          integerValidator(),
          Validators.min(1),
          Validators.max(12),
        ],
      }),
      participantCapacity: new FormControl<number | null>(null, {
        validators: [integerValidator(), Validators.min(1)],
      }),
      participantSignupKind: new FormControl<ParticipantSignupKind>(
        ParticipantSignupKind.ProgramItem,
        { nonNullable: true, validators: [Validators.required] },
      ),
      hostSignupOpensAt: new FormControl<Date | null>(null, {
        validators: [validDateValidator(getTimeZone)],
      }),
      hostSignupClosesAt: new FormControl<Date | null>(null, {
        validators: [validDateValidator(getTimeZone)],
      }),
      participantSignupOpensAt: new FormControl<Date | null>(null, {
        validators: [validDateValidator(getTimeZone)],
      }),
      participantSignupClosesAt: new FormControl<Date | null>(null, {
        validators: [validDateValidator(getTimeZone)],
      }),
    },
    {
      validators: [
        dateTimeRangeValidator(
          'hostSignupOpensAt',
          'hostSignupClosesAt',
          'hostSignupRange',
          (date, boundary) =>
            timeZoneDateToTimestamp(
              date,
              getTimeZone(),
              boundary === 'start'
                ? getOccurrence().hostSignupOpensAt
                : getOccurrence().hostSignupClosesAt,
            ),
        ),
        dateTimeRangeValidator(
          'participantSignupOpensAt',
          'participantSignupClosesAt',
          'participantSignupRange',
          (date, boundary) =>
            timeZoneDateToTimestamp(
              date,
              getTimeZone(),
              boundary === 'start'
                ? getOccurrence().participantSignupOpensAt
                : getOccurrence().participantSignupClosesAt,
            ),
        ),
      ],
    },
  );
}

export function populateEventOccurrenceForm(
  form: EventOccurrenceFormGroup,
  occurrence: IAdminOccurrenceListItem,
  timeZone: string,
): void {
  form.reset(
    {
      status: occurrence.status,
      slotCapacity: occurrence.slotCapacity,
      participantCapacity: occurrence.participantCapacity,
      participantSignupKind: occurrence.participantSignupKind,
      hostSignupOpensAt: timestampToTimeZoneDate(
        occurrence.hostSignupOpensAt,
        timeZone,
      ),
      hostSignupClosesAt: timestampToTimeZoneDate(
        occurrence.hostSignupClosesAt,
        timeZone,
      ),
      participantSignupOpensAt: timestampToTimeZoneDate(
        occurrence.participantSignupOpensAt,
        timeZone,
      ),
      participantSignupClosesAt: timestampToTimeZoneDate(
        occurrence.participantSignupClosesAt,
        timeZone,
      ),
    },
    { emitEvent: false },
  );
  form.updateValueAndValidity({ emitEvent: false });
}

export function mapEventOccurrenceFormToPayload(
  form: EventOccurrenceFormGroup,
  occurrence: IAdminOccurrenceListItem,
  timeZone: string,
): IOccurrenceSavePayload {
  const value = form.getRawValue();

  return {
    id: occurrence.id,
    status: value.status,
    slotCapacity: value.slotCapacity,
    participantCapacity: value.participantCapacity,
    participantSignupKind: value.participantSignupKind,
    hostSignupOpensAt: timeZoneDateToTimestamp(
      value.hostSignupOpensAt,
      timeZone,
      occurrence.hostSignupOpensAt,
    ),
    hostSignupClosesAt: timeZoneDateToTimestamp(
      value.hostSignupClosesAt,
      timeZone,
      occurrence.hostSignupClosesAt,
    ),
    participantSignupOpensAt: timeZoneDateToTimestamp(
      value.participantSignupOpensAt,
      timeZone,
      occurrence.participantSignupOpensAt,
    ),
    participantSignupClosesAt: timeZoneDateToTimestamp(
      value.participantSignupClosesAt,
      timeZone,
      occurrence.participantSignupClosesAt,
    ),
  };
}
