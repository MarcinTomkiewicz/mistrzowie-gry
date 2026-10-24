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
import type { EventPriceBasis } from '../../../../core/interfaces/i-admin-global-event';
import type { EventDatedBlocksCopy, EventGlobalCityCopy, EventGlobalDraftCopy } from '../../../../core/types/i18n/event-global-draft';
import type {
  CoreRpcErrorsCopy,
  EditionTableCopy,
  EditionsCopy,
  EditorFieldsCopy,
  EditorValidationCopy,
  EditionValidationCopy,
  EditionRpcErrorsCopy,
  OccurrencesCopy,
  EditorActionsCopy,
  EditorPageCopy,
  EditorToastCopy,
  OccurrenceTableCopy,
  ParticipantKindCopy,
} from '../../../../core/types/i18n/admin-events';

export function createEventCoreEditorI18n() {
  const {
    page,
    fields,
    editions,
    editionTable,
    occurrenceTable,
    actions,
    toast,
    rpcErrors,
  } = createScopedSectionsI18n<{
    page: EditorPageCopy;
    fields: EditorFieldsCopy;
    editions: EditionsCopy;
    editionTable: EditionTableCopy;
    occurrenceTable: OccurrenceTableCopy;
    actions: EditorActionsCopy;
    toast: EditorToastCopy;
    rpcErrors: CoreRpcErrorsCopy;
  }>('adminEvents', {
    page: 'editor.page',
    fields: 'editor.fields',
    editions: 'editor.editions',
    editionTable: 'editor.editionTable',
    occurrenceTable: 'editionEditor.occurrenceTable',
    actions: 'editor.actions',
    toast: 'editor.toast',
    rpcErrors: 'rpcErrors',
  });

  const commonPrice = createCommonPriceI18n();
  const commonValues = createCommonValuesI18n();
  const commonEntityStatuses = createCommonEntityStatusesI18n();

  return {
    city: createScopedObjectI18n<EventGlobalCityCopy>('adminEvents', 'editor.city'),
    editionRpcErrors: createScopedObjectI18n<EditionRpcErrorsCopy>('adminEvents', 'editionRpcErrors'),
    datedBlocks: createScopedObjectI18n<EventDatedBlocksCopy>('adminEvents', 'editor.datedBlocks'),
    creation: createScopedObjectI18n<EventGlobalDraftCopy>('adminEvents', 'editor.creation'),
    creationSteps: createScopedObjectI18n<EventGlobalDraftCopy['steps']>('adminEvents', 'editor.creation.steps'),
    coreStatuses: computed(() => {
      const statuses = commonEntityStatuses();
      const fallback = commonValues().notAvailable;
      return {
        active: statuses?.active?.neuter ?? fallback,
        inactive: statuses?.inactive?.neuter ?? fallback,
        draft: statuses?.draft?.neuter ?? fallback,
      };
    }),
    priceBases: computed<Record<EventPriceBasis, string>>(() => {
      const units = commonPrice().presentation.units;
      return {
        per_participant: units.participant,
        per_session: units.session,
        per_group: units.group,
        per_event: units.whole_event,
      };
    }),
    validation: createScopedObjectI18n<EditorValidationCopy>('adminEvents', 'editor.validation'),
    editionValidation: createScopedObjectI18n<EditionValidationCopy>('adminEvents', 'editionEditor.validation'),
    occurrences: createScopedObjectI18n<OccurrencesCopy>('adminEvents', 'editionEditor.occurrences'),
    participantKinds: createScopedObjectI18n<ParticipantKindCopy>('adminEvents', 'editionEditor.participantKinds'),
    page,
    fields,
    editions,
    editionTable,
    occurrenceTable,
    actions,
    toast,
    rpcErrors,
    commonActions: createCommonActionsI18n(),
    commonForm: createCommonFormI18n(),
    commonErrors: createCommonErrorsI18n(),
    commonEntityStatuses,
    commonLabels: createCommonLabelsI18n(),
    commonPrice,
    commonNav: createCommonNavI18n(),
    commonStatus: createCommonStatusI18n(),
    commonTable: createCommonTableI18n(),
    commonValues,
  };
}
