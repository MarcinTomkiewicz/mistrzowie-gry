export type StaffingRealizationType = 'stationary' | 'travel';

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
