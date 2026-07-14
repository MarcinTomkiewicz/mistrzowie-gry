export type UserMenuItemId =
  | 'edit-profile'
  | 'session-reservation'
  | 'event-signup'
  | 'coworker-profile'
  | 'my-work-log'
  | 'gm-availability-overview'
  | 'work-log-overview'
  | 'admin-content'
  | 'admin-events'
  | 'admin-users';

export type UserMenuSectionId =
  | 'account'
  | 'gm-zone'
  | 'administration';

export type BuildUserMenuArgs = {
  accountTitle: string;
  gmZoneTitle: string;
  administrationTitle: string;
  editProfileLabel: string;
  sessionReservationLabel: string;
  eventSignupLabel: string;
  coworkerProfileLabel: string;
  myWorkLogLabel: string;
  gmAvailabilityOverviewLabel: string;
  workLogOverviewLabel: string;
  adminContentLabel: string;
  adminEventsLabel: string;
  adminUsersLabel: string;
  canSeeGmZone: boolean;
  canSeeAdministration: boolean;
  canSeeAdminOnlyItems: boolean;
};
