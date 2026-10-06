import type { MyStaffingCandidate } from '../../interfaces/my-staffing-realization';
import type {
  StaffingRealizationStatus,
  StaffingRealizationType,
  StaffingReimbursementMode,
  StaffingTransportMode,
  StaffingWorkTimeScope,
} from '../staffing-realization';

export type StaffingRealizationStatusTranslations = Record<
  StaffingRealizationStatus,
  string
>;

export type StaffingRealizationTypeTranslations = Record<
  StaffingRealizationType,
  string
>;

export type StaffingCandidateStateTranslations = Record<
  MyStaffingCandidate['state'],
  string
>;

export type StaffingLabelsTranslations = {
  requiredGmCount: string;
};

export type StaffingCandidateThreadCopy = {
  title: string;
  empty: string;
  readOnly: string;
  bodyLabel: string;
  send: string;
  loadFailed: string;
  sendSuccess: string;
  sendFailed: string;
};

export type StaffingTransportModeTranslations = Record<StaffingTransportMode, string>;
export type StaffingReimbursementModeTranslations = Record<StaffingReimbursementMode, string>;
export type StaffingWorkTimeScopeTranslations = Record<StaffingWorkTimeScope, string>;
