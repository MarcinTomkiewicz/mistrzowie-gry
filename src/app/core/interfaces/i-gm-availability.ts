import { HourOffsetDay, HourOffsetRangeValue } from '../types/hour-offset';

export interface IGmAvailabilitySlotRecord {
  id?: string;
  gmProfileId: string;
  startsAt: string;
  endsAt: string;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface IGmAvailabilityOverviewUser {
  id: string;
  firstName: string | null;
  nickname: string | null;
  useNickname: boolean | null;
}

export interface IGmAvailabilityOverviewRecord
  extends Pick<IGmAvailabilitySlotRecord, 'gmProfileId' | 'startsAt' | 'endsAt'> {
  id: string;
}

export interface IGmAvailabilityOverviewData {
  gmUsers: IGmAvailabilityOverviewUser[];
  records: IGmAvailabilityOverviewRecord[];
}

export interface IGmAvailabilityRange extends HourOffsetRangeValue {}

export interface IGmAvailabilityDay
  extends HourOffsetDay<IGmAvailabilityRange> {}

export interface IGmAvailabilityWindowData {
  editableRecords: readonly IGmAvailabilitySlotRecord[];
  adjacentRecords: readonly IGmAvailabilitySlotRecord[];
}
