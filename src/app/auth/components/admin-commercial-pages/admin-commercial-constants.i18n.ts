import {
  createCommonActionsI18n,
  createCommonFormI18n,
  createCommonLabelsI18n,
  createCommonNavI18n,
  createCommonStatusI18n,
  createCommonTableI18n,
  createCommonValuesI18n,
} from '../../../core/translations/common.i18n';
import { createScopedSectionsI18n } from '../../../core/translations/scoped.i18n';
import type {
  AdminCommercialConstantsActionTranslations,
  AdminCommercialConstantsConfirmationTranslations,
  AdminCommercialConstantsDurationUnitTranslations,
  AdminCommercialConstantsEditorTranslations,
  AdminCommercialConstantsPageTranslations,
  AdminCommercialConstantsStatusTranslations,
  AdminCommercialConstantsTableTranslations,
  AdminCommercialConstantsToastTranslations,
  AdminCommercialConstantsValidationTranslations,
  AdminCommercialConstantsValueTypeTranslations,
} from '../../../core/types/i18n/admin-commercial-constants';

export function createAdminCommercialConstantsI18n() {
  const translations = createScopedSectionsI18n<{
    page: AdminCommercialConstantsPageTranslations;
    table: AdminCommercialConstantsTableTranslations;
    editor: AdminCommercialConstantsEditorTranslations;
    actions: AdminCommercialConstantsActionTranslations;
    status: AdminCommercialConstantsStatusTranslations;
    toast: AdminCommercialConstantsToastTranslations;
    confirmation: AdminCommercialConstantsConfirmationTranslations;
    validation: AdminCommercialConstantsValidationTranslations;
    valueType: AdminCommercialConstantsValueTypeTranslations;
    durationUnit: AdminCommercialConstantsDurationUnitTranslations;
  }>('adminCommercialPages', {
    page: 'constants.page',
    table: 'constants.table',
    editor: 'constants.editor',
    actions: 'constants.actions',
    status: 'constants.status',
    toast: 'constants.toast',
    confirmation: 'constants.confirmation',
    validation: 'constants.validation',
    valueType: 'constants.valueType',
    durationUnit: 'constants.durationUnit',
  });

  return {
    ...translations,
    commonActions: createCommonActionsI18n(),
    commonForm: createCommonFormI18n(),
    commonLabels: createCommonLabelsI18n(),
    commonNav: createCommonNavI18n(),
    commonStatus: createCommonStatusI18n(),
    commonTable: createCommonTableI18n(),
    commonValues: createCommonValuesI18n(),
  };
}
