import { computed } from '@angular/core';

import {
  createCommonActionsI18n,
  createCommonFormI18n,
  createCommonErrorsI18n,
  createCommonEntityStatusesI18n,
  createCommonLabelsI18n,
  createCommonPriceI18n,
  createCommonNavI18n,
  createCommonStatusI18n,
  createCommonTableI18n,
  createCommonValuesI18n,
} from '../../../../core/translations/common.i18n';
import { createScopedObjectI18n, createScopedSectionsI18n } from '../../../../core/translations/scoped.i18n';
import type { EventPublicationCopy } from '../../../../core/types/i18n/event-publication';
import {
  EditionCoverCopy,
  EditionFieldsCopy,
  EditionInfoCopy,
  EditionRpcErrorsCopy,
  EditionSectionsCopy,
  EditionValidationCopy,
  EditionEditorPageCopy,
  EditorToastCopy,
  OccurrenceDialogCopy,
  OccurrenceFieldsCopy,
  OccurrenceRpcErrorsCopy,
  OccurrencesCopy,
  OccurrenceSignupStatusCopy,
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
    cover,
    participantKinds,
    toast,
    rpcErrors,
    occurrences,
    occurrenceTable,
    occurrenceDialog,
    occurrenceFields,
    occurrenceValidation,
    occurrenceSignupStatuses,
    occurrenceToast,
    occurrenceRpcErrors,
  } = createScopedSectionsI18n<{
    page: EditionEditorPageCopy;
    sections: EditionSectionsCopy;
    fields: EditionFieldsCopy;
    validation: EditionValidationCopy;
    info: EditionInfoCopy;
    cover: EditionCoverCopy;
    participantKinds: ParticipantKindCopy;
    toast: EditorToastCopy;
    rpcErrors: EditionRpcErrorsCopy;
    occurrences: OccurrencesCopy;
    occurrenceTable: OccurrenceTableCopy;
    occurrenceDialog: OccurrenceDialogCopy;
    occurrenceFields: OccurrenceFieldsCopy;
    occurrenceValidation: OccurrenceValidationCopy;
    occurrenceSignupStatuses: OccurrenceSignupStatusCopy;
    occurrenceToast: OccurrenceToastCopy;
    occurrenceRpcErrors: OccurrenceRpcErrorsCopy;
  }>('adminEvents', {
    page: 'editionEditor.page',
    sections: 'editionEditor.sections',
    fields: 'editionEditor.fields',
    validation: 'editionEditor.validation',
    info: 'editionEditor.info',
    cover: 'editionEditor.cover',
    participantKinds: 'editionEditor.participantKinds',
    toast: 'editionEditor.toast',
    rpcErrors: 'editionRpcErrors',
    occurrences: 'editionEditor.occurrences',
    occurrenceTable: 'editionEditor.occurrenceTable',
    occurrenceDialog: 'occurrenceEditor.dialog',
    occurrenceFields: 'occurrenceEditor.fields',
    occurrenceValidation: 'occurrenceEditor.validation',
    occurrenceSignupStatuses: 'occurrenceEditor.statuses',
    occurrenceToast: 'occurrenceEditor.toast',
    occurrenceRpcErrors: 'occurrenceRpcErrors',
  });

  const commonEntityStatuses = createCommonEntityStatusesI18n();
  const commonValues = createCommonValuesI18n();

  return {
    publication: createScopedObjectI18n<EventPublicationCopy>('adminEvents', 'editionEditor.publication'),
    page,
    sections,
    fields,
    validation,
    info,
    cover,
    participantKinds,
    toast,
    rpcErrors,
    occurrences,
    occurrenceTable,
    occurrenceDialog,
    occurrenceFields,
    occurrenceValidation,
    occurrenceStatuses: computed(() => ({
      ...occurrenceSignupStatuses(),
      planned: commonEntityStatuses().planned.masculine,
      published: commonValues().published,
      archived: commonValues().archived,
    })),
    occurrenceToast,
    occurrenceRpcErrors,
    commonActions: createCommonActionsI18n(),
    commonForm: createCommonFormI18n(),
    commonErrors: createCommonErrorsI18n(),
    commonEntityStatuses,
    commonLabels: createCommonLabelsI18n(),
    commonPrice: createCommonPriceI18n(),
    commonNav: createCommonNavI18n(),
    commonStatus: createCommonStatusI18n(),
    commonTable: createCommonTableI18n(),
    commonValues,
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
    commonForm: createCommonFormI18n(),
    commonLabels: createCommonLabelsI18n(),
    commonValues: createCommonValuesI18n(),
  };
}
