import {
  createCommonActionsI18n,
  createCommonErrorsI18n,
  createCommonLabelsI18n,
  createCommonNavI18n,
  createCommonStatusI18n,
  createCommonTableI18n,
  createCommonValuesI18n,
} from '../../../../core/translations/common.i18n';
import { createScopedSectionsI18n } from '../../../../core/translations/scoped.i18n';
import {
  CoreRpcErrorsCopy,
  CoreTableCopy,
  ListActionsCopy,
  ListPageCopy,
  ListToastCopy,
  StatusCopy,
} from '../../../../core/types/i18n/admin-events';

export function createEventCoreListI18n() {
  const { page, table, actions, toast, status, rpcErrors } =
    createScopedSectionsI18n<{
      page: ListPageCopy;
      table: CoreTableCopy;
      actions: ListActionsCopy;
      toast: ListToastCopy;
      status: StatusCopy;
      rpcErrors: CoreRpcErrorsCopy;
    }>('adminEvents', {
      page: 'list.page',
      table: 'list.table',
      actions: 'list.actions',
      toast: 'list.toast',
      status: 'status',
      rpcErrors: 'rpcErrors',
    });

  return {
    page,
    table,
    actions,
    toast,
    status,
    rpcErrors,
    commonActions: createCommonActionsI18n(),
    commonErrors: createCommonErrorsI18n(),
    commonLabels: createCommonLabelsI18n(),
    commonNav: createCommonNavI18n(),
    commonStatus: createCommonStatusI18n(),
    commonTable: createCommonTableI18n(),
    commonValues: createCommonValuesI18n(),
  };
}
