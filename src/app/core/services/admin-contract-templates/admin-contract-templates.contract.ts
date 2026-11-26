import { CONTRACT_TEMPLATE_PDF_PATH_PREFIX } from '../../configs/admin-contract-templates.config';
import {
  CONTRACT_FAMILY_KEY,
  type ContractTemplateConfiguration,
  isContractConfiguration,
  isContractLabel,
} from '../../types/contract-template-configuration';
import type { EdgeReader, EdgeReaderResult } from '../../types/edge-contract';
import {
  assertEdgeContract,
  createEdgeArrayReader,
  createEdgeLiteralReader,
  readEdgeBoolean,
  readEdgeNonBlankString,
  readEdgeNullableTimestamp,
  readEdgePositiveInteger,
  readEdgeTimestamp,
  readEdgeUuid,
} from '../../utils/edge-contract';
import { parsePrivatePdfUrl } from '../../utils/private-pdf';
import { createStrictEdgeObjectReader } from '../../utils/strict-edge-contract';

const templateIdentity = {
  template_id: readEdgeUuid,
  family: readFamily,
};
const readStatus = createEdgeLiteralReader(['staged', 'active', 'retired']);

const readTemplate = createStrictEdgeObjectReader({
  ...templateIdentity,
  status: readStatus,
  original_filename: readEdgeNonBlankString,
  pdf_sha256: readSha,
  size_bytes: readEdgePositiveInteger,
  created_at: readEdgeTimestamp,
  approved_at: readEdgeNullableTimestamp,
  can_delete: readEdgeBoolean,
});

export type ContractTemplate = EdgeReaderResult<typeof readTemplate>;
export type ContractTemplateUpload = {
  family: string;
  file: File;
};

const readFamilyRow = createStrictEdgeObjectReader({
  family: readFamily,
  label: (value: unknown, path: string): string => {
    assertEdgeContract(isContractLabel(value), path, 'a valid contract label');
    return value;
  },
  created_at: readEdgeTimestamp,
});
const readConfigurationRow = createStrictEdgeObjectReader({
  ...templateIdentity,
  status: readStatus,
  pdf_sha256: readSha,
  configuration_revision: (value: unknown, path: string): number => {
    assertEdgeContract(typeof value === 'number' && Number.isSafeInteger(value) && value >= 0,
      path, 'a non-negative safe revision');
    return value;
  },
  configuration: (value: unknown, path: string): ContractTemplateConfiguration | null => {
    assertEdgeContract(value === null || isContractConfiguration(value), path, 'a canonical configuration or null');
    return value;
  },
  configuration_updated_at: readEdgeNullableTimestamp,
});

export type ContractFamily = EdgeReaderResult<typeof readFamilyRow>;
export type ContractConfiguration = EdgeReaderResult<typeof readConfigurationRow>;
export const readFamilies = readDocumentData(createEdgeArrayReader(readFamilyRow));
export const readCreatedFamily = readDocumentData(readFamilyRow);
export const readConfiguration = readDocumentData((value, path) => {
  const row = readConfigurationRow(value, path);
  assertEdgeContract(row.configuration === null
    ? row.configuration_revision === 0 && row.configuration_updated_at === null
    : row.configuration_revision > 0 && row.configuration_updated_at !== null,
    path, 'consistent configuration and revision');
  return row;
});

export const readTemplates = readDocumentData(createEdgeArrayReader(readTemplate));
export const readStagedTemplate = readDocumentData(createStrictEdgeObjectReader({
  ...templateIdentity,
  status: createEdgeLiteralReader(['staged']),
}));
export const readActiveTemplate = readDocumentData(createStrictEdgeObjectReader({
  ...templateIdentity,
  status: createEdgeLiteralReader(['active']),
}));
export const readDeletedTemplate = readDocumentData(createStrictEdgeObjectReader({
  template_id: readEdgeUuid,
}));
export const readTemplateDownload = readDocumentData(createStrictEdgeObjectReader({
  url: readSignedTemplateUrl,
  filename: readEdgeNonBlankString,
}));

function readDocumentData<TResult>(readData: EdgeReader<TResult>): EdgeReader<TResult> {
  const readResponse = createStrictEdgeObjectReader({
    ok: createEdgeLiteralReader([true]),
    data: readData,
  });
  return (value, path) => readResponse(value, path).data;
}

function readSignedTemplateUrl(value: unknown, path: string): string {
  const url = parsePrivatePdfUrl(
    readEdgeNonBlankString(value, path),
    CONTRACT_TEMPLATE_PDF_PATH_PREFIX,
  );
  assertEdgeContract(url !== null, path, 'a signed template URL');
  return url.href;
}

function readFamily(value: unknown, path: string): string {
  assertEdgeContract(typeof value === 'string' && CONTRACT_FAMILY_KEY.test(value), path, 'a contract family key');
  return value;
}

function readSha(value: unknown, path: string): string {
  assertEdgeContract(typeof value === 'string' && /^[a-f0-9]{64}$/.test(value), path, 'a lowercase SHA-256 digest');
  return value;
}
