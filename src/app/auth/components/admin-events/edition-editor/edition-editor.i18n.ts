import { computed } from '@angular/core';

import {
  createCommonActionsI18n,
  createCommonFormI18n,
  createCommonEntityStatusesI18n,
  createCommonLabelsI18n,
  createCommonValuesI18n,
} from '../../../../core/translations/common.i18n';
import { createScopedObjectI18n, createScopedSectionsI18n } from '../../../../core/translations/scoped.i18n';
import type { EventPublicationCopy } from '../../../../core/types/i18n/event-publication';
import {
  EditionFieldsCopy,
  OccurrenceSignupStatusCopy,
  ParticipantKindCopy,
  ScheduleFieldsCopy,
  ScheduleInfoCopy,
  ScheduleOptionsCopy,
  ScheduleValidationCopy,
} from '../../../../core/types/i18n/admin-events';

export function createEventEditionEditorI18n() {
  const { fields, participantKinds, occurrenceSignupStatuses } = createScopedSectionsI18n<{
    fields: EditionFieldsCopy;
    participantKinds: ParticipantKindCopy;
    occurrenceSignupStatuses: OccurrenceSignupStatusCopy;
  }>('adminEvents', {
    fields: 'editionEditor.fields',
    participantKinds: 'editionEditor.participantKinds',
    occurrenceSignupStatuses: 'occurrenceEditor.statuses',
  });

  const commonEntityStatuses = createCommonEntityStatusesI18n();
  const commonValues = createCommonValuesI18n();

  return {
    publication: createScopedObjectI18n<EventPublicationCopy>('adminEvents', 'editionEditor.publication'),
    fields,
    participantKinds,
    occurrenceStatuses: computed(() => ({
      ...occurrenceSignupStatuses(),
      planned: commonEntityStatuses().planned.masculine,
      published: commonValues().published,
      archived: commonValues().archived,
    })),
    commonEntityStatuses,
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
