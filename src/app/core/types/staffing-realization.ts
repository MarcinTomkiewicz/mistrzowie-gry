export type StaffingRealizationType = 'stationary' | 'travel';

export type StaffingStationaryScopePolicy = 'whole_realization' | 'selected_days';
export type StaffingSessionSelectionMode = 'gm_selects' | 'realization_assigns';

export type StaffingParticipationEndReason = 'gm_withdrawal' | 'admin_removal';

export type StaffingAvailabilityStatus =
  | 'available'
  | 'partial'
  | 'conflict'
  | 'no_declared_availability'
  | 'no_schedule';

export type StaffingSlotAvailabilityStatus = Exclude<StaffingAvailabilityStatus, 'no_schedule'>;

export type StaffingRealizationStatus =
  | 'draft'
  | 'open'
  | 'closed'
  | 'completed'
  | 'archived';

export type StaffingTransportMode =
  | 'organizer_provided'
  | 'self_arranged'
  | 'mixed';

export type StaffingReimbursementMode =
  | 'none'
  | 'actual_cost'
  | 'mileage'
  | 'custom';

export type StaffingWorkTimeScope =
  | 'on_site_only'
  | 'including_travel'
  | 'custom';
