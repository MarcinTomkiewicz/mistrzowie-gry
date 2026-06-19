import { IGmProfile } from '../interfaces/i-gm-profile';
import { IUser } from '../interfaces/i-user';
import { AppRole } from './app-role';

export type AdminUsersSortField = 'createdAt' | 'updatedAt';
export type AdminUsersSortOrder = 'asc' | 'desc';
export type AdminUsersRoleFilter = AppRole | 'all';
export type AdminUsersProfileFilter = 'all' | 'with' | 'without';
export type AdminUsersPublicFilter = 'all' | 'public' | 'not_public';
export type AdminUserProfileStatusKey = 'isPublic' | 'isArchived';

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

export type IAdminUserUpdatePayload = Pick<
  IUser,
  | 'appRole'
  | 'firstName'
  | 'nickname'
  | 'useNickname'
  | 'phoneNumber'
  | 'city'
  | 'isTestUser'
>;

export type IAdminGmProfileCreatePayload = Pick<
  IGmProfile,
  'id' | 'isPublic' | 'isArchived'
>;

export type IAdminGmProfileStatusPatch = Partial<
  Pick<IGmProfile, 'isPublic' | 'isArchived'>
>;
