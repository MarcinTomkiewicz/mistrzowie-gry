export type UserMenuItemId =
  | 'edit-profile'
  | 'session-reservation'
  | 'event-signup'
  | 'coworker-profile'
  | 'my-work-log'
  | 'gm-availability-overview'
  | 'work-log-overview'
  | 'admin-content'
  | 'admin-users';

export type UserMenuSectionId =
  | 'account'
  | 'gm-zone'
  | 'administration';

export interface IUserMenuItem {
  id: UserMenuItemId;
  label: string;
  path?: string;
  action?: 'logout';
}

export interface IUserMenuSection {
  id: UserMenuSectionId;
  title: string;
  items: IUserMenuItem[];
}

export interface BuildUserMenuArgs {
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
  adminUsersLabel: string;
  canSeeGmZone: boolean;
  canSeeAdministration: boolean;
  canSeeAdminContent: boolean;
}
