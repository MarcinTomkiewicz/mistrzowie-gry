import { AppRole } from '../types/app-role';
import { HourOffsetDay } from '../types/hour-offset';
import { WorkLogMonthOffset, WorkLogRangeDraft } from '../types/work-log';

export interface IWorkLogOverviewUser {
  id: string;
  appRole: AppRole;
  firstName: string | null;
  nickname: string | null;
  useNickname: boolean | null;
  createdAt: string | null;
}

export interface IUserWorkLogRangeRecord {
  id: string;
  workLogId: string;
  startsAt: string;
  endsAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface IUserWorkLogRecord {
  id: string;
  userId: string;
  workDate: string;
  isChaoticThursday: boolean;
  comment: string | null;
  createdAt: string;
  updatedAt: string;
  userWorkLogRanges: readonly IUserWorkLogRangeRecord[];
}

export interface IWorkLogOverviewData {
  users: IWorkLogOverviewUser[];
  records: IUserWorkLogRecord[];
}

export interface IUserWorkLogDay extends HourOffsetDay<WorkLogRangeDraft> {
  id?: string;
  isChaoticThursday: boolean;
  comment?: string | null;
}

export interface IUserWorkLogMonthData {
  days: readonly IUserWorkLogDay[];
  adjacentDays: readonly IUserWorkLogDay[];
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
  totalHours: number;
}

export interface IUserWorkLogOverviewVm {
  user: IWorkLogOverviewUser;
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
