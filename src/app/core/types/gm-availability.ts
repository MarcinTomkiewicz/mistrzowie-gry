export const GM_AVAILABILITY_MIN_DURATION_HOURS = 4;
export const GM_AVAILABILITY_MAX_DURATION_HOURS = 24;
export const GM_AVAILABILITY_TOTAL_HOURS = 24;
export const GM_AVAILABILITY_DEFAULT_START_HOUR = 12;

export type GmAvailabilityMutationError =
  | 'invalid_duration'
  | 'overlap'
  | 'no_space';
