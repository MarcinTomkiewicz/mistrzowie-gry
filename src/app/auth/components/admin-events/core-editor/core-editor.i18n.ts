import {
  createCommonActionsI18n,
  createCommonFormI18n,
  createCommonStatusI18n,
} from '../../../../core/translations/common.i18n';
import { createScopedSectionsI18n } from '../../../../core/translations/scoped.i18n';
import {
  CoreRpcErrorsCopy,
  EditionTableCopy,
  EditionsCopy,
  EditorFieldsCopy,
  EditorActionsCopy,
  EditorPageCopy,
  EditorToastCopy,
  EditorValidationCopy,
  StatusCopy,
} from '../../../../core/types/i18n/admin-events';

export function createEventCoreEditorI18n() {
  const {
    page,
    fields,
    validation,
    editions,
    editionTable,
    actions,
    toast,
    status,
    rpcErrors,
  } = createScopedSectionsI18n<{
    page: EditorPageCopy;
    fields: EditorFieldsCopy;
    validation: EditorValidationCopy;
    editions: EditionsCopy;
    editionTable: EditionTableCopy;
    actions: EditorActionsCopy;
    toast: EditorToastCopy;
    status: StatusCopy;
    rpcErrors: CoreRpcErrorsCopy;
  }>('adminEvents', {
    page: 'editor.page',
    fields: 'editor.fields',
    validation: 'editor.validation',
    editions: 'editor.editions',
    editionTable: 'editor.editionTable',
    actions: 'editor.actions',
    toast: 'editor.toast',
    status: 'status',
    rpcErrors: 'rpcErrors',
  });

  return {
    page,
    fields,
    validation,
    editions,
    editionTable,
    actions,
    toast,
    status,
    rpcErrors,
    commonActions: createCommonActionsI18n(),
    commonForm: createCommonFormI18n(),
    commonStatus: createCommonStatusI18n(),
  };
}
