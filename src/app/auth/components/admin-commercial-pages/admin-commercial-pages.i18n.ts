import {
  createCommonActionsI18n,
  createCommonFormI18n,
  createCommonStatusI18n,
  createCommonTableI18n,
  createCommonValuesI18n,
} from '../../../core/translations/common.i18n';
import { createScopedSectionsI18n } from '../../../core/translations/scoped.i18n';
import type {
  AdminCommercialPagesActionAppearanceTranslations,
  AdminCommercialPagesActionTranslations,
  AdminCommercialPagesActualCostBasisTranslations,
  AdminCommercialPagesBillingUnitTranslations,
  AdminCommercialPagesCapacityTranslations,
  AdminCommercialPagesDraftStatusTranslations,
  AdminCommercialPagesDurationModeTranslations,
  AdminCommercialPagesEditorActionsTranslations,
  AdminCommercialPagesEditorPageTranslations,
  AdminCommercialPagesEditorToastTranslations,
  AdminCommercialPagesIdentityTranslations,
  AdminCommercialPagesItemsTranslations,
  AdminCommercialPagesKindTranslations,
  AdminCommercialPagesListPageTranslations,
  AdminCommercialPagesListTableTranslations,
  AdminCommercialPagesListToastTranslations,
  AdminCommercialPagesMetadataTranslations,
  AdminCommercialPagesPercentageBasisTranslations,
  AdminCommercialPagesPriceTranslations,
  AdminCommercialPagesPriceTypeTranslations,
  AdminCommercialPagesScheduleTranslations,
  AdminCommercialPagesSectionBaseTranslations,
  AdminCommercialPagesSectionsTranslations,
  AdminCommercialPagesSectionTypeTranslations,
  AdminCommercialPagesSeoTranslations,
  AdminCommercialPagesSharedSourceTranslations,
  AdminCommercialPagesTaxDisplayModeTranslations,
  AdminCommercialPagesValidationTranslations,
} from '../../../core/types/i18n/admin-commercial-pages';

export function createAdminCommercialPagesI18n() {
  const translations = createScopedSectionsI18n<{
    listPage: AdminCommercialPagesListPageTranslations;
    listTable: AdminCommercialPagesListTableTranslations;
    listToast: AdminCommercialPagesListToastTranslations;
    editorPage: AdminCommercialPagesEditorPageTranslations;
    editorToast: AdminCommercialPagesEditorToastTranslations;
    identity: AdminCommercialPagesIdentityTranslations;
    metadata: AdminCommercialPagesMetadataTranslations;
    seo: AdminCommercialPagesSeoTranslations;
    sections: AdminCommercialPagesSectionsTranslations;
    sectionBase: AdminCommercialPagesSectionBaseTranslations;
    items: AdminCommercialPagesItemsTranslations;
    action: AdminCommercialPagesActionTranslations;
    price: AdminCommercialPagesPriceTranslations;
    capacity: AdminCommercialPagesCapacityTranslations;
    schedule: AdminCommercialPagesScheduleTranslations;
    editorActions: AdminCommercialPagesEditorActionsTranslations;
    validation: AdminCommercialPagesValidationTranslations;
    draftStatus: AdminCommercialPagesDraftStatusTranslations;
    kind: AdminCommercialPagesKindTranslations;
    taxDisplayMode: AdminCommercialPagesTaxDisplayModeTranslations;
    sectionType: AdminCommercialPagesSectionTypeTranslations;
    sharedSource: AdminCommercialPagesSharedSourceTranslations;
    actionAppearance: AdminCommercialPagesActionAppearanceTranslations;
    priceType: AdminCommercialPagesPriceTypeTranslations;
    billingUnit: AdminCommercialPagesBillingUnitTranslations;
    percentageBasis: AdminCommercialPagesPercentageBasisTranslations;
    actualCostBasis: AdminCommercialPagesActualCostBasisTranslations;
    durationMode: AdminCommercialPagesDurationModeTranslations;
  }>('adminCommercialPages', {
    listPage: 'list.page',
    listTable: 'list.table',
    listToast: 'list.toast',
    editorPage: 'editor.page',
    editorToast: 'editor.toast',
    identity: 'editor.identity',
    metadata: 'editor.metadata',
    seo: 'editor.seo',
    sections: 'editor.sections',
    sectionBase: 'editor.sectionBase',
    items: 'editor.items',
    action: 'editor.action',
    price: 'editor.price',
    capacity: 'editor.capacity',
    schedule: 'editor.schedule',
    editorActions: 'editor.actions',
    validation: 'editor.validation',
    draftStatus: 'draftStatus',
    kind: 'kind',
    taxDisplayMode: 'taxDisplayMode',
    sectionType: 'sectionType',
    sharedSource: 'sharedSource',
    actionAppearance: 'actionAppearance',
    priceType: 'priceType',
    billingUnit: 'billingUnit',
    percentageBasis: 'percentageBasis',
    actualCostBasis: 'actualCostBasis',
    durationMode: 'durationMode',
  });

  return {
    ...translations,
    commonActions: createCommonActionsI18n(),
    commonForm: createCommonFormI18n(),
    commonStatus: createCommonStatusI18n(),
    commonTable: createCommonTableI18n(),
    commonValues: createCommonValuesI18n(),
  };
}
