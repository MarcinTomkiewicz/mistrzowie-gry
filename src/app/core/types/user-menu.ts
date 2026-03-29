export type UserMenuItemId =
  | 'edit-profile'
  | 'event-signup'

export type UserMenuSectionId =
  | 'account';

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