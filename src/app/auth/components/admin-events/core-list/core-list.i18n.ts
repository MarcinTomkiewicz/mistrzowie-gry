import {
  createCommonActionsI18n,
  createCommonStatusI18n,
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
    commonStatus: createCommonStatusI18n(),
  };
}
