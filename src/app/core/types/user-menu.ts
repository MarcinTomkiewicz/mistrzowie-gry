export type UserMenuItemId =
  | 'edit-profile'
  | 'session-reservation'
  | 'coworker-records'
  | 'gm-profile'
  | 'event-signup'
  | 'my-work-log'
  | 'admin-content'
  | 'admin-staffing'
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
  gmProfileLabel: string;
  eventSignupLabel: string;
  myWorkLogLabel: string;
  adminContentLabel: string;
  adminStaffingLabel: string;
  adminCoworkerRecordsLabel: string;
  adminUsersLabel: string;
  canSeeCoworker: boolean;
  canSeeGmZone: boolean;
  canSeeAdministration: boolean;
  canSeeAdminOnlyItems: boolean;
};
