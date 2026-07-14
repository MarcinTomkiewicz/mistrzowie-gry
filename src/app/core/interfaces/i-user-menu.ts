import type {
  UserMenuItemId,
  UserMenuSectionId,
} from '../types/user-menu';

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
