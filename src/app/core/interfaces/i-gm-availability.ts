import { IUniversalCalendarDay } from './i-universal-calendar';
import { ISelectOption } from './i-select-option';
import { HourOffsetDay, HourOffsetRange } from '../types/hour-offset';

export interface IGmAvailabilitySlotRecord {
  id?: string;
  gmProfileId: string;
  startsAt: string;
  endsAt: string;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface IGmAvailabilityRange extends HourOffsetRange {}

export interface IGmAvailabilityDay
  extends HourOffsetDay<IGmAvailabilityRange> {}

export interface IGmAvailabilityHourOption extends ISelectOption<number> {}

export interface IGmAvailabilityEditorError {
  title: string;
  body: string;
}

export interface IGmAvailabilityCalendarDay extends IUniversalCalendarDay {}
