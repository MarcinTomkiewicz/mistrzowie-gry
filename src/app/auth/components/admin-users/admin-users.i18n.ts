import {
  createCommonActionsI18n,
  createCommonAppRolesI18n,
  createCommonFormI18n,
  createCommonErrorsI18n,
  createCommonLabelsI18n,
  createCommonNavI18n,
  createCommonStatusI18n,
  createCommonTableI18n,
  createCommonValuesI18n,
} from '../../../core/translations/common.i18n';
import { createScopedSectionsI18n } from '../../../core/translations/scoped.i18n';
import {
  AdminUsersActionsTranslations,
  AdminUsersDialogTranslations,
  AdminUsersFiltersTranslations,
  AdminUsersPageTranslations,
  AdminUsersTableTranslations,
  AdminUsersToastTranslations,
} from '../../../core/types/i18n/admin-users';

export function createAdminUsersI18n() {
  const { page, filters, table, dialog, actions, toast } =
    createScopedSectionsI18n<{
      page: AdminUsersPageTranslations;
      filters: AdminUsersFiltersTranslations;
      table: AdminUsersTableTranslations;
      dialog: AdminUsersDialogTranslations;
      actions: AdminUsersActionsTranslations;
      toast: AdminUsersToastTranslations;
    }>('adminUsers', {
      page: 'page',
      filters: 'filters',
      table: 'table',
      dialog: 'dialog',
      actions: 'actions',
      toast: 'toast',
    });

  return {
    page,
    filters,
    table,
    dialog,
    actions,
    toast,
    appRoles: createCommonAppRolesI18n(),
    commonErrors: createCommonErrorsI18n(),
    commonLabels: createCommonLabelsI18n(),
    commonNav: createCommonNavI18n(),
    commonActions: createCommonActionsI18n(),
    commonForm: createCommonFormI18n(),
    commonStatus: createCommonStatusI18n(),
    commonTable: createCommonTableI18n(),
    commonValues: createCommonValuesI18n(),
  };
}
