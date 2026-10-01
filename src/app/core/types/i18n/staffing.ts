import type {
  StaffingRealizationStatus,
  StaffingRealizationType,
} from '../staffing-realization';

export type StaffingRealizationStatusTranslations = Record<
  StaffingRealizationStatus,
  string
>;

export type StaffingRealizationTypeTranslations = Record<
  StaffingRealizationType,
  string
>;

export type StaffingLabelsTranslations = {
  requiredGmCount: string;
};
