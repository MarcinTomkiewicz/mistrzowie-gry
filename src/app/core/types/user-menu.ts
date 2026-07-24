export type UserMenuItemId =
  | 'edit-profile'
  | 'session-reservation'
  | 'coworker-records'
  | 'event-signup'
  | 'my-work-log'
  | 'gm-availability-overview'
  | 'work-log-overview'
  | 'admin-content'
  | 'admin-events'
  | 'admin-coworker-private-documents'
  | 'admin-coworker-operational-documents'
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
  adminEventsLabel: string;
  adminCoworkerPrivateDocumentsLabel: string;
  adminCoworkerOperationalDocumentsLabel: string;
  adminUsersLabel: string;
  canSeeCoworker: boolean;
  canSeeGmZone: boolean;
  canSeeAdministration: boolean;
  canSeeAdminOnlyItems: boolean;
};
