export type UserMenuItemId =
  | 'edit-profile'
  | 'session-reservation'
  | 'coworker-records'
  | 'event-signup'
  | 'my-work-log'
  | 'gm-availability-overview'
  | 'work-log-overview'
  | 'admin-content'
  | 'admin-offers'
  | 'admin-events'
  | 'admin-coworker-records'
  | 'admin-users';

export type UserMenuSectionId =
  | 'account'
  | 'coworker'
  | 'gm-zone'
  | 'administration';

export type BuildUserMenuArgs = {
  accountTitle: string;
  coworkerTitle: string;
  gmZoneTitle: string;
  administrationTitle: string;
  editProfileLabel: string;
  sessionReservationLabel: string;
  coworkerRecordsLabel: string;
  eventSignupLabel: string;
  myWorkLogLabel: string;
  gmAvailabilityOverviewLabel: string;
  workLogOverviewLabel: string;
  adminContentLabel: string;
  adminOffersLabel: string;
  adminEventsLabel: string;
  adminCoworkerRecordsLabel: string;
  adminUsersLabel: string;
  canSeeCoworker: boolean;
  canSeeGmZone: boolean;
  canSeeAdministration: boolean;
  canSeeAdminOnlyItems: boolean;
};
