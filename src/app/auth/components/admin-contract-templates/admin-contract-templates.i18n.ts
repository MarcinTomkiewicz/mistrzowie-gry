import type { ContractTemplateFamily } from '../../../core/configs/admin-contract-templates.config';
import {
  createCommonActionsI18n,
  createCommonEntityStatusesI18n,
  createCommonErrorsI18n,
  createCommonFormI18n,
  createCommonLabelsI18n,
  createCommonPdfUploadI18n,
  createCommonStatusI18n,
  createCommonTableI18n,
} from '../../../core/translations/common.i18n';
import { createScopedObjectI18n } from '../../../core/translations/scoped.i18n';

export const ADMIN_CONTRACT_TEMPLATES_SCOPE = 'adminContractTemplates';

export function createAdminContractTemplatesI18n() {
  return {
    copy: createScopedObjectI18n<{
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
    }>(ADMIN_CONTRACT_TEMPLATES_SCOPE, 'catalog'),
    ...createCommonPdfUploadI18n(),
    actions: createCommonActionsI18n(),
    entityStatuses: createCommonEntityStatusesI18n(),
    errors: createCommonErrorsI18n(),
    form: createCommonFormI18n(),
    labels: createCommonLabelsI18n(),
    status: createCommonStatusI18n(),
    table: createCommonTableI18n(),
  };
}
