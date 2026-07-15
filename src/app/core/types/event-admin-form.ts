import { FormArray, FormControl, FormGroup } from '@angular/forms';

import {
  EventOccurrenceStatus,
  ParticipantSignupKind,
} from '../enums/event';
import {
  EventMonthlyNth,
  EventRecurrenceKind,
  EventScheduleKind,
} from './event';

export type EventScheduleFormGroup = FormGroup<{
  kind: FormControl<EventScheduleKind>;
  date: FormControl<string>;
  recurrenceKind: FormControl<EventRecurrenceKind>;
  interval: FormControl<number>;
  byweekday: FormControl<number[]>;
  monthlyNth: FormControl<EventMonthlyNth | null>;
  monthlyWeekday: FormControl<number | null>;
  dayOfMonth: FormControl<number | null>;
  startDate: FormControl<string>;
  endDate: FormControl<string>;
  exdates: FormArray<FormControl<string>>;
}>;

export type EventEditionFormGroup = FormGroup<{
  eventCoreId: FormControl<string>;
  slug: FormControl<string>;
  city: FormControl<string>;
  venueName: FormControl<string>;
  venueAddress: FormControl<string>;
  priceAmount: FormControl<number | null>;
  priceCurrency: FormControl<string>;
  priceLabel: FormControl<string>;
  coverImagePath: FormControl<string>;
  facebookLink: FormControl<string>;
  isActive: FormControl<boolean>;
  isDefaultPublic: FormControl<boolean>;
  displayOrder: FormControl<number>;
  isForBeginners: FormControl<boolean>;
  timezone: FormControl<string>;
  startTime: FormControl<string>;
  endTime: FormControl<string>;
  participantSignupKind: FormControl<ParticipantSignupKind>;
  signupRequired: FormControl<boolean>;
  defaultSlotCapacity: FormControl<number>;
  defaultParticipantCapacity: FormControl<number | null>;
  schedule: EventScheduleFormGroup;
}>;

export type EventOccurrenceFormGroup = FormGroup<{
  status: FormControl<EventOccurrenceStatus>;
  slotCapacity: FormControl<number>;
  participantCapacity: FormControl<number | null>;
  participantSignupKind: FormControl<ParticipantSignupKind>;
  hostSignupOpensAt: FormControl<Date | null>;
  hostSignupClosesAt: FormControl<Date | null>;
  participantSignupOpensAt: FormControl<Date | null>;
  participantSignupClosesAt: FormControl<Date | null>;
}>;
