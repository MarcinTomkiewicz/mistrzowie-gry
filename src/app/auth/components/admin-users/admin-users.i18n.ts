import {
  createCommonActionsI18n,
  createCommonFormI18n,
  createCommonStatusI18n,
} from '../../../core/translations/common.i18n';
import { createScopedSectionsI18n } from '../../../core/translations/scoped.i18n';
import {
  AdminUsersActionsTranslations,
  AdminUsersDialogTranslations,
  AdminUsersFiltersTranslations,
  AdminUsersPageTranslations,
  AdminUsersRoleLabelTranslations,
  AdminUsersTableTranslations,
  AdminUsersToastTranslations,
} from '../../../core/types/i18n/admin-users';

export function createAdminUsersI18n() {
  const { page, filters, table, dialog, actions, toast, roleLabels } =
    createScopedSectionsI18n<{
      page: AdminUsersPageTranslations;
      filters: AdminUsersFiltersTranslations;
      table: AdminUsersTableTranslations;
      dialog: AdminUsersDialogTranslations;
      actions: AdminUsersActionsTranslations;
      toast: AdminUsersToastTranslations;
      roleLabels: AdminUsersRoleLabelTranslations;
    }>('adminUsers', {
      page: 'page',
      filters: 'filters',
      table: 'table',
      dialog: 'dialog',
      actions: 'actions',
      toast: 'toast',
      roleLabels: 'roleLabels',
    });

  return {
    page,
    filters,
    table,
    dialog,
    actions,
    toast,
    roleLabels,
    commonActions: createCommonActionsI18n(),
    commonForm: createCommonFormI18n(),
    commonStatus: createCommonStatusI18n(),
  };
}
