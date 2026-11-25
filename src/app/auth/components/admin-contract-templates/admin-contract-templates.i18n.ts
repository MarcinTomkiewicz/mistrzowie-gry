import { computed } from '@angular/core';

import {
  CONTRACT_TEMPLATE_FAMILIES,
  type ContractTemplateFamily,
} from '../../../core/configs/admin-contract-templates.config';
import type { ContractPdfFillResult } from '../../../core/services/contract-pdf-fill/contract-pdf-fill';
import {
  createCommonActionsI18n,
  createCommonEntityStatusesI18n,
  createCommonErrorsI18n,
  createCommonFormI18n,
  createCommonLabelsI18n,
  createCommonNavI18n,
  createCommonPdfUploadI18n,
  createCommonStatusI18n,
  createCommonTableI18n,
} from '../../../core/translations/common.i18n';
import { createScopedObjectI18n } from '../../../core/translations/scoped.i18n';

export const ADMIN_CONTRACT_TEMPLATES_SCOPE = 'adminContractTemplates';

type FieldErrorCode = Extract<ContractPdfFillResult, { status: 'invalid-fields' }>['errors'][number]['code'];

export function createAdminContractTemplatesI18n() {
  const copy = createScopedObjectI18n<{
    title: string;
    addTitle: string;
    family: string;
    families: Record<ContractTemplateFamily, string>;
    statuses: { staged: string };
    activation: { title: string; message: string };
    deletion: { confirm: string; confirmActive: string; cleanupFailed: string; unknown: string };
    empty: string;
    loadFailed: string;
    uploaded: string;
    activated: string;
    deleted: string;
    uploadFailed: string;
    activationFailed: string;
    deleteFailed: string;
    fileFailed: string;
    uploadUncertain: string;
    activationUncertain: string;
  }>(ADMIN_CONTRACT_TEMPLATES_SCOPE, 'catalog');

  return {
    copy,
    familyOptions: computed(() => {
      const labels = copy().families;
      return labels ? CONTRACT_TEMPLATE_FAMILIES.map((value) => ({ value, label: labels[value] })) : [];
    }),
    preparation: createScopedObjectI18n<{
      title: string;
      noActiveTemplate: string;
      fieldMapMissing: string;
      loadFailed: string;
      formUnavailable: string;
      generating: string;
      missingData: string;
      generationFailed: string;
      fieldErrors: Record<Exclude<FieldErrorCode, 'invalid-value'>, string>;
    }>(ADMIN_CONTRACT_TEMPLATES_SCOPE, 'preparation'),
    ...createCommonPdfUploadI18n(),
    actions: createCommonActionsI18n(),
    entityStatuses: createCommonEntityStatusesI18n(),
    errors: createCommonErrorsI18n(),
    form: createCommonFormI18n(),
    labels: createCommonLabelsI18n(),
    nav: createCommonNavI18n(),
    status: createCommonStatusI18n(),
    table: createCommonTableI18n(),
  };
}
