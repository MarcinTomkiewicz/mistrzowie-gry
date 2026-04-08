import { APP_ROLES, AppRole } from '../types/app-role';
import { IUser } from '../interfaces/i-user';

const ROLE_ACCESS_LEVEL: Record<AppRole, number> = {
  user: 0,
  gm: 10,
  marketing_manager: 20,
  customer_manager: 20,
  lead_coordinator: 30,
  admin: 100,
};

export function hasRole(
  user: IUser | null | undefined,
  role: AppRole,
): boolean {
  if (!user) return false;
  if (user.appRole === 'admin') return true;
  return user.appRole === role;
}

export function hasMinimumRole(
  user: IUser | null | undefined,
  requiredRole: AppRole,
): boolean {
  if (!user) return false;

  return ROLE_ACCESS_LEVEL[user.appRole] >= ROLE_ACCESS_LEVEL[requiredRole];
}

export function getRolesAtOrAbove(requiredRole: AppRole): AppRole[] {
  return APP_ROLES.filter(
    (role) => ROLE_ACCESS_LEVEL[role] >= ROLE_ACCESS_LEVEL[requiredRole],
  );
}
