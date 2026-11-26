import type { ConfigurationIssue, ContractFieldKind, ContractFieldRules } from '../../../core/types/contract-template-configuration';
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
    statuses: { staged: string };
    activation: { title: string; message: string };
    deletion: { confirm: string; confirmActive: string; cleanupFailed: string; unknown: string };
    empty: string;
    loadFailed: string;
    uploaded: string;
    activated: string;
    deleted: string;
    uploadFailed: string;
    deleteFailed: string;
    fileFailed: string;
    uploadUncertain: string;
  }>(ADMIN_CONTRACT_TEMPLATES_SCOPE, 'catalog');

  const i18n = {
    copy,
    preparation: createScopedObjectI18n<{
      title: string;
      noActiveTemplate: string;
      loadFailed: string;
      generating: string;
      missingData: string;
      generationFailed: string;
      previewFailed: string;
      generate: string;
      invalidConfiguration: string;
      fieldErrors: Record<Exclude<FieldErrorCode, 'invalid-value'>, string>;
    }>(ADMIN_CONTRACT_TEMPLATES_SCOPE, 'preparation'),
    editor: createScopedObjectI18n<{
      addFamily: string;
      filterFamily: string;
      emptyFamily: string;
      familyUncertain: string;
      familyCreated: string;
      familyFailed: string;
      configure: string;
      configuration: string;
      readFailed: string;
      reconciliation: string;
      revisionConflict: string;
      geometryMismatch: string;
      databaseVersion: string;
      keepDraft: string;
      copySource: string;
      copyDraft: string;
      copyWarning: string;
      discardDraft: string;
      sourceUnavailable: string;
      fields: string;
      field: string;
      addField: string;
      optionLabel: string;
      addOption: string;
      kind: string;
      required: string;
      visibleWhen: string;
      equals: string;
      invalidOrder: string;
      placements: string;
      layout: string;
      checkboxOption: string;
      page: string;
      fontSize: string;
      minFontSize: string;
      invalidDraft: string;
      previewValues: string;
      previewConfirmation: string;
      pan: string;
      draw: string;
      resize: string;
      kinds: Record<Exclude<ContractFieldKind, 'date' | 'email'>, string>;
      rules: Record<keyof ContractFieldRules, string>;
      issues: Record<ConfigurationIssue['code'], string>;
    }>(ADMIN_CONTRACT_TEMPLATES_SCOPE, 'editor'),
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

  return {
    ...i18n,
    fieldKindLabel: (kind: ContractFieldKind) => kind === 'date' || kind === 'email'
      ? i18n.labels()[kind] : i18n.editor().kinds[kind],
  };
}
