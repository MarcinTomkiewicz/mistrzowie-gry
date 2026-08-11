import {
  createCommonActionsI18n,
  createCommonFormI18n,
  createCommonStatusI18n,
  createCommonTableI18n,
  createCommonValuesI18n,
} from '../../../core/translations/common.i18n';
import { createScopedSectionsI18n } from '../../../core/translations/scoped.i18n';
import type * as Copy from '../../../core/types/i18n/admin-commercial-pages';

export function createAdminCommercialPagesI18n() {
  const translations = createScopedSectionsI18n<{
    listPage: Copy.AdminCommercialPagesListPageTranslations;
    listTable: Copy.AdminCommercialPagesListTableTranslations;
    listToast: Copy.AdminCommercialPagesListToastTranslations;
    editorPage: Copy.AdminCommercialPagesEditorPageTranslations;
    editorToast: Copy.AdminCommercialPagesEditorToastTranslations;
    previewPage: Copy.AdminCommercialPagesPreviewPageTranslations;
    publication: Copy.AdminCommercialPagesPublicationTranslations;
    publicationMetadata: Copy.AdminCommercialPagesPublicationMetadataTranslations;
    publicationToast: Copy.AdminCommercialPagesPublicationToastTranslations;
    identity: Copy.AdminCommercialPagesIdentityTranslations;
    metadata: Copy.AdminCommercialPagesMetadataTranslations;
    seo: Copy.AdminCommercialPagesSeoTranslations;
    products: Copy.AdminCommercialPagesProductsTranslations;
    product: Copy.AdminCommercialPagesProductTranslations;
    sections: Copy.AdminCommercialPagesSectionsTranslations;
    section: Copy.AdminCommercialPagesSectionTranslations;
    richContent: Copy.AdminCommercialPagesRichContentTranslations;
    buttons: Copy.AdminCommercialPagesButtonsTranslations;
    cards: Copy.AdminCommercialPagesCardsTranslations;
    productCollection: Copy.AdminCommercialPagesProductCollectionTranslations;
    table: Copy.AdminCommercialPagesTableTranslations;
    faq: Copy.AdminCommercialPagesFaqTranslations;
    price: Copy.AdminCommercialPagesPriceTranslations;
    editorActions: Copy.AdminCommercialPagesEditorActionsTranslations;
    validation: Copy.AdminCommercialPagesValidationTranslations;
    draftStatus: Copy.AdminCommercialPagesDraftStatusTranslations;
    kind: Copy.AdminCommercialPagesKindTranslations;
    taxDisplayMode: Copy.AdminCommercialPagesTaxDisplayModeTranslations;
    blockType: Copy.AdminCommercialPagesBlockTypeTranslations;
    sectionSurface: Copy.AdminCommercialPagesSectionSurfaceTranslations;
    textAlign: Copy.AdminCommercialPagesTextAlignTranslations;
    buttonLayout: Copy.AdminCommercialPagesButtonLayoutTranslations;
    cardOrientation: Copy.AdminCommercialPagesCardOrientationTranslations;
    collectionPresentation: Copy.AdminCommercialPagesCollectionPresentationTranslations;
    productFieldKey: Copy.AdminCommercialPagesProductFieldKeyTranslations;
    iconKey: Copy.AdminCommercialPagesIconKeyTranslations;
    durationMode: Copy.AdminCommercialPagesDurationModeTranslations;
    participantsMode: Copy.AdminCommercialPagesParticipantsModeTranslations;
    actionAppearance: Copy.AdminCommercialPagesActionAppearanceTranslations;
    priceType: Copy.AdminCommercialPagesPriceTypeTranslations;
    billingUnit: Copy.AdminCommercialPagesBillingUnitTranslations;
    percentageBasis: Copy.AdminCommercialPagesPercentageBasisTranslations;
    actualCostBasis: Copy.AdminCommercialPagesActualCostBasisTranslations;
  }>('adminCommercialPages', {
    listPage: 'list.page', listTable: 'list.table', listToast: 'list.toast',
    editorPage: 'editor.page', editorToast: 'editor.toast',
    previewPage: 'preview.page', publication: 'publication.panel',
    publicationMetadata: 'publication.metadata', publicationToast: 'publication.toast',
    identity: 'editor.identity', metadata: 'editor.metadata', seo: 'editor.seo',
    products: 'editor.products', product: 'editor.product',
    sections: 'editor.sections', section: 'editor.section',
    richContent: 'editor.richContent', buttons: 'editor.buttons',
    cards: 'editor.cards', productCollection: 'editor.productCollection',
    table: 'editor.table', faq: 'editor.faq', price: 'editor.price',
    editorActions: 'editor.actions', validation: 'editor.validation',
    draftStatus: 'draftStatus', kind: 'kind', taxDisplayMode: 'taxDisplayMode',
    blockType: 'blockType', sectionSurface: 'sectionSurface',
    textAlign: 'textAlign', buttonLayout: 'buttonLayout',
    cardOrientation: 'cardOrientation',
    collectionPresentation: 'collectionPresentation',
    productFieldKey: 'productFieldKey', iconKey: 'iconKey',
    durationMode: 'durationMode', participantsMode: 'participantsMode',
    actionAppearance: 'actionAppearance', priceType: 'priceType',
    billingUnit: 'billingUnit', percentageBasis: 'percentageBasis',
    actualCostBasis: 'actualCostBasis',
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
