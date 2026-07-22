import {
  createCommonActionsI18n,
  createCommonFormI18n,
  createCommonStatusI18n,
  createCommonTableI18n,
  createCommonValuesI18n,
} from '../../../../core/translations/common.i18n';
import { createScopedSectionsI18n } from '../../../../core/translations/scoped.i18n';
import {
  EditionFieldsCopy,
  EditionInfoCopy,
  EditionRpcErrorsCopy,
  EditionSectionsCopy,
  EditionValidationCopy,
  EditorPageCopy,
  EditorToastCopy,
  OccurrenceDialogCopy,
  OccurrenceFieldsCopy,
  OccurrenceRpcErrorsCopy,
  OccurrencesCopy,
  OccurrenceStatusCopy,
  OccurrenceTableCopy,
  OccurrenceToastCopy,
  OccurrenceValidationCopy,
  ParticipantKindCopy,
  ScheduleFieldsCopy,
  ScheduleInfoCopy,
  ScheduleOptionsCopy,
  ScheduleValidationCopy,
} from '../../../../core/types/i18n/admin-events';

export function createEventEditionEditorI18n() {
  const {
    page,
    sections,
    fields,
    validation,
    info,
    participantKinds,
    toast,
    rpcErrors,
    occurrences,
    occurrenceTable,
    occurrenceDialog,
    occurrenceFields,
    occurrenceValidation,
    occurrenceStatuses,
    occurrenceToast,
    occurrenceRpcErrors,
  } = createScopedSectionsI18n<{
    page: EditorPageCopy;
    sections: EditionSectionsCopy;
    fields: EditionFieldsCopy;
    validation: EditionValidationCopy;
    info: EditionInfoCopy;
    participantKinds: ParticipantKindCopy;
    toast: EditorToastCopy;
    rpcErrors: EditionRpcErrorsCopy;
    occurrences: OccurrencesCopy;
    occurrenceTable: OccurrenceTableCopy;
    occurrenceDialog: OccurrenceDialogCopy;
    occurrenceFields: OccurrenceFieldsCopy;
    occurrenceValidation: OccurrenceValidationCopy;
    occurrenceStatuses: OccurrenceStatusCopy;
    occurrenceToast: OccurrenceToastCopy;
    occurrenceRpcErrors: OccurrenceRpcErrorsCopy;
  }>('adminEvents', {
    page: 'editionEditor.page',
    sections: 'editionEditor.sections',
    fields: 'editionEditor.fields',
    validation: 'editionEditor.validation',
    info: 'editionEditor.info',
    participantKinds: 'editionEditor.participantKinds',
    toast: 'editionEditor.toast',
    rpcErrors: 'editionRpcErrors',
    occurrences: 'editionEditor.occurrences',
    occurrenceTable: 'editionEditor.occurrenceTable',
    occurrenceDialog: 'occurrenceEditor.dialog',
    occurrenceFields: 'occurrenceEditor.fields',
    occurrenceValidation: 'occurrenceEditor.validation',
    occurrenceStatuses: 'occurrenceEditor.statuses',
    occurrenceToast: 'occurrenceEditor.toast',
    occurrenceRpcErrors: 'occurrenceRpcErrors',
  });

  return {
    page,
    sections,
    fields,
    validation,
    info,
    participantKinds,
    toast,
    rpcErrors,
    occurrences,
    occurrenceTable,
    occurrenceDialog,
    occurrenceFields,
    occurrenceValidation,
    occurrenceStatuses,
    occurrenceToast,
    occurrenceRpcErrors,
    commonActions: createCommonActionsI18n(),
    commonForm: createCommonFormI18n(),
    commonStatus: createCommonStatusI18n(),
    commonTable: createCommonTableI18n(),
    commonValues: createCommonValuesI18n(),
  };
}

export function createEventScheduleEditorI18n() {
  const { fields, options, validation, info } =
    createScopedSectionsI18n<{
      fields: ScheduleFieldsCopy;
      options: ScheduleOptionsCopy;
      validation: ScheduleValidationCopy;
      info: ScheduleInfoCopy;
    }>('adminEvents', {
      fields: 'scheduleEditor.fields',
      options: 'scheduleEditor.options',
      validation: 'scheduleEditor.validation',
      info: 'scheduleEditor.info',
    });

  return {
    fields,
    options,
    validation,
    info,
    commonActions: createCommonActionsI18n(),
  };
}
