import { IGmProfile } from './i-gm-profile';
import { IUser } from './i-user';
import {
  AdminUsersProfileFilter,
  AdminUsersPublicFilter,
  AdminUsersRoleFilter,
  AdminUsersSortField,
  AdminUsersSortOrder,
} from '../types/admin-users';
import { AppRole } from '../types/app-role';

export interface IAdminUsersFilterValue {
  searchText: string;
  role: AdminUsersRoleFilter;
  profile: AdminUsersProfileFilter;
  public: AdminUsersPublicFilter;
  showArchived: boolean;
  sortBy: AdminUsersSortField;
  sortOrder: AdminUsersSortOrder;
}

export interface IAdminUserRecord extends IUser {
  gmProfiles?: IGmProfile | IGmProfile[] | null;
}

export interface IAdminUserRow {
  user: IUser;
  gmProfile: IGmProfile | null;
}

export interface IAdminUserUpdateFormValue {
  appRole: AppRole;
  firstName: string | null;
  nickname: string | null;
  useNickname: boolean;
  phoneNumber: string | null;
  city: string | null;
  isTestUser: boolean;
}
