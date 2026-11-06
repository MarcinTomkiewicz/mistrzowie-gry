import { computed, inject } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';

import {
  createCommonActionsI18n,
  createCommonErrorsI18n,
  createCommonEntityStatusesI18n,
  createCommonLabelsI18n,
  createCommonNavI18n,
  createCommonStatusI18n,
  createCommonTableI18n,
  createCommonValuesI18n,
} from '../../../../core/translations/common.i18n';
import { createScopedObjectI18n, createScopedSectionsI18n } from '../../../../core/translations/scoped.i18n';
import type { EventCoreDispositionAction } from '../../../../core/interfaces/i-event-admin';
import type {
  CoreRpcErrorsCopy,
  CoreTableCopy,
  ListActionsCopy,
  ListPageCopy,
  ListToastCopy,
  EventCoreDispositionCopy,
} from '../../../../core/types/i18n/admin-events';

export function createEventCoreListI18n() {
  const transloco = inject(TranslocoService);
  const { page, table, actions, toast, rpcErrors } =
    createScopedSectionsI18n<{
      page: ListPageCopy;
      table: CoreTableCopy;
      actions: ListActionsCopy;
      toast: ListToastCopy;
      rpcErrors: CoreRpcErrorsCopy;
    }>('adminEvents', {
      page: 'list.page',
      table: 'list.table',
      actions: 'list.actions',
      toast: 'list.toast',
      rpcErrors: 'rpcErrors',
    });

  const disposition = createScopedObjectI18n<EventCoreDispositionCopy>('adminEvents', 'list.disposition');
  const commonActions = createCommonActionsI18n();
  return {
    disposition,
    dispositionActions: computed<Record<EventCoreDispositionAction, string>>(() => ({
      delete: commonActions().delete, archive: commonActions().archive, blocked: disposition().unavailable,
    })),
    page,
    table,
    actions,
    toast,
    rpcErrors,
    moreLocations: (count: number): string => transloco.translate<string>(
      'adminEvents.list.table.moreLocations',
      { count },
    ),
    commonActions,
    commonErrors: createCommonErrorsI18n(),
    commonEntityStatuses: createCommonEntityStatusesI18n(),
    commonLabels: createCommonLabelsI18n(),
    commonNav: createCommonNavI18n(),
    commonStatus: createCommonStatusI18n(),
    commonTable: createCommonTableI18n(),
    commonValues: createCommonValuesI18n(),
  };
}
