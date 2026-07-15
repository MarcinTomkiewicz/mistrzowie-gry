import { ISelectOption } from '../interfaces/i-select-option';
import { APP_ROLES, AppRole, AppRoleLabels } from '../types/app-role';

export function getAppRoleLabel(
  role: AppRole,
  labels: AppRoleLabels,
): string {
  return labels[role] || role;
}

export function createAppRoleOptions(
  labels: AppRoleLabels,
  roles: readonly AppRole[] = APP_ROLES,
): ISelectOption<AppRole>[] {
  return roles.map((role) => ({
    value: role,
    label: getAppRoleLabel(role, labels),
  }));
}
