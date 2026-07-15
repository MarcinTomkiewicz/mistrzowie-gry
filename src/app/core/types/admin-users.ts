import { IGmProfile } from '../interfaces/i-gm-profile';
import { IUser } from '../interfaces/i-user';
import { AppRole } from './app-role';

export type AdminUsersSortField = 'createdAt' | 'updatedAt';
export type AdminUsersSortOrder = 'asc' | 'desc';
export type AdminUsersRoleFilter = AppRole | 'all';
export type AdminUsersProfileFilter = 'all' | 'with' | 'without';
export type AdminUsersPublicFilter = 'all' | 'public' | 'not_public';
export type AdminUserProfileStatusKey = 'isPublic' | 'isArchived';
export type AdminUsersFilterSelectControlName =
  | 'role'
  | 'profile'
  | 'public'
  | 'sortBy'
  | 'sortOrder';
export type AdminUserDialogTextControlName =
  | 'firstName'
  | 'nickname'
  | 'phoneNumber'
  | 'city';
export type AdminUserDialogToggleControlName = 'useNickname' | 'isTestUser';

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
