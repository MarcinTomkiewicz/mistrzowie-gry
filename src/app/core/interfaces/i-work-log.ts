import { HourOffsetDay } from '../types/hour-offset';
import { WorkLogMonthOffset, WorkLogRangeDraft } from '../types/work-log';
import { IUser } from './i-user';

export interface IUserWorkLogRangeRecord {
  id?: string;
  workLogId: string;
  startsAt: string;
  endsAt: string;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface IUserWorkLogRecord {
  id?: string;
  userId: string;
  workDate: string;
  isChaoticThursday: boolean;
  comment?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  userWorkLogRanges?: readonly IUserWorkLogRangeRecord[];
}

export interface IWorkLogOverviewData {
  users: IUser[];
  records: IUserWorkLogRecord[];
}

export interface IWorkLogEditorError {
  title: string;
  body: string;
}

export interface IUserWorkLogDay extends HourOffsetDay<WorkLogRangeDraft> {
  id?: string;
  isChaoticThursday: boolean;
  comment?: string | null;
}

export interface IUserWorkLogMonthScope {
  monthOffset: WorkLogMonthOffset;
  startDate: string;
  endDate: string;
  days: readonly string[];
  label: string;
  isEditable: boolean;
}

export interface IUserWorkLogRowVm {
  date: string;
  dateLabel: string;
  weekdayLabel: string;
  isChaoticThursdayDay: boolean;
  day: IUserWorkLogDay | null;
  totalHours: number;
}

export interface IUserWorkLogOverviewVm {
  user: IUser;
  days: readonly IUserWorkLogDay[];
  totalHours: number;
}

export interface IUserWorkLogExportRow {
  userId: string;
  firstName: string;
  lastName: string;
  totalHours: number;
  chaoticThursdayDatesLabel: string;
}
