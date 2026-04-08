export type UserMenuItemId =
  | 'edit-profile'
  | 'event-signup'
  | 'gm-availability-overview';

export type UserMenuSectionId =
  | 'account'
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
