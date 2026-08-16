import { HourOffsetDay, HourOffsetRangeValue } from '../types/hour-offset';

export interface IGmAvailabilitySlotRecord {
  id?: string;
  gmProfileId: string;
  startsAt: string;
  endsAt: string;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface IGmAvailabilityRange extends HourOffsetRangeValue {}

export interface IGmAvailabilityDay
  extends HourOffsetDay<IGmAvailabilityRange> {}

export interface IGmAvailabilityWindowData {
  editableRecords: readonly IGmAvailabilitySlotRecord[];
  adjacentRecords: readonly IGmAvailabilitySlotRecord[];
}
