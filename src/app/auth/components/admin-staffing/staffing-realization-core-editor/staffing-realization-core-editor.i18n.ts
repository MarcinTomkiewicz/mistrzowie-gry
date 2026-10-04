import {
  createCommonActionsI18n,
  createCommonErrorsI18n,
  createCommonFormI18n,
  createCommonLabelsI18n,
  createCommonStatusI18n,
} from '../../../../core/translations/common.i18n';
import { createScopedSectionsI18n } from '../../../../core/translations/scoped.i18n';
import { createStaffingI18n } from '../../../../core/translations/staffing.i18n';
import { AdminStaffingEditorCopy } from '../../../../core/types/i18n/admin-staffing';

export function createStaffingRealizationCoreEditorI18n() {
  return {
    ...createScopedSectionsI18n<{
      page: AdminStaffingEditorCopy['page'];
      basicSection: AdminStaffingEditorCopy['sections']['basic'];
      initialDaysSection: AdminStaffingEditorCopy['sections']['initialDays'];
      venueSection: AdminStaffingEditorCopy['sections']['venue'];
      eventSection: AdminStaffingEditorCopy['sections']['event'];
      fields: AdminStaffingEditorCopy['fields'];
      validation: AdminStaffingEditorCopy['validation'];
      summary: AdminStaffingEditorCopy['summary'];
      stationaryType: AdminStaffingEditorCopy['types']['stationary'];
      travelType: AdminStaffingEditorCopy['types']['travel'];
      event: AdminStaffingEditorCopy['event'];
      actions: AdminStaffingEditorCopy['actions'];
      toast: AdminStaffingEditorCopy['toast'];
    }>('adminStaffing', {
      page: 'editor.page',
      basicSection: 'editor.sections.basic',
      initialDaysSection: 'editor.sections.initialDays',
      venueSection: 'editor.sections.venue',
      eventSection: 'editor.sections.event',
      fields: 'editor.fields',
      validation: 'editor.validation',
      summary: 'editor.summary',
      stationaryType: 'editor.types.stationary',
      travelType: 'editor.types.travel',
      event: 'editor.event',
      actions: 'editor.actions',
      toast: 'editor.toast',
    }),
    ...createStaffingI18n(),
    commonActions: createCommonActionsI18n(),
    commonErrors: createCommonErrorsI18n(),
    commonForm: createCommonFormI18n(),
    commonLabels: createCommonLabelsI18n(),
    commonStatus: createCommonStatusI18n(),
  };
}
