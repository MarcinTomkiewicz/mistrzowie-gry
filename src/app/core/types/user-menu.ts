export type UserMenuItemId =
  | 'edit-profile'
  | 'event-signup'
  | 'my-work-log'
  | 'gm-availability-overview'
  | 'work-log-overview';

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
