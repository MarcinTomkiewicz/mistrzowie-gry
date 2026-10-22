import {
  createCommonActionsI18n, createCommonErrorsI18n, createCommonLabelsI18n,
  createCommonStatusI18n, createCommonValuesI18n, createCommonEntityStatusesI18n,
  createCommonStatusPhrasesI18n, createCommonTableI18n,
} from '../../../../core/translations/common.i18n';
import { createScopedObjectI18n } from '../../../../core/translations/scoped.i18n';
import type { EditionRpcErrorsCopy } from '../../../../core/types/i18n/admin-events';
import type { EventAdminTimelineCopy } from '../../../../core/types/i18n/event-admin-timeline';

export function createEventAdminTimelineI18n() {
  return {
    copy: createScopedObjectI18n<EventAdminTimelineCopy>('adminEvents', 'timeline'),
    rpcErrors: createScopedObjectI18n<EditionRpcErrorsCopy>('adminEvents', 'editionRpcErrors'),
    actions: createCommonActionsI18n(),
    errors: createCommonErrorsI18n(),
    labels: createCommonLabelsI18n(),
    status: createCommonStatusI18n(),
    values: createCommonValuesI18n(),
    entityStatuses: createCommonEntityStatusesI18n(),
    statusPhrases: createCommonStatusPhrasesI18n(),
    table: createCommonTableI18n(),
  };
}
