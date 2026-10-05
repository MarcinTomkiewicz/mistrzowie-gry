import type { MyStaffingRealizationHub } from '../interfaces/my-staffing-realization';

export const DEFAULT_STAFFING_STATIONARY_CITY = 'Poznań';

export const GM_STAFFING_HUB_ROUTE = '/auth/gm/staffing';

export const STAFFING_WITHDRAWAL_NOTICE_HOURS = 72;

export const STAFFING_REALIZATION_HUB_SECTIONS = [
  'available',
  'proposals',
  'myApplications',
  'confirmed',
] as const satisfies readonly (keyof MyStaffingRealizationHub)[];
