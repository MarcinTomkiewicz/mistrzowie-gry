import {
  type ContractTemplateFamily,
  CONTRACT_TEMPLATE_FAMILIES,
  CONTRACT_TEMPLATE_PDF_PATH_PREFIX,
} from '../../configs/admin-contract-templates.config';
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
  family: createEdgeLiteralReader(CONTRACT_TEMPLATE_FAMILIES),
};

const readTemplate = createStrictEdgeObjectReader({
  ...templateIdentity,
  status: createEdgeLiteralReader(['staged', 'active', 'retired']),
  original_filename: readEdgeNonBlankString,
  pdf_sha256: (value: unknown, path: string) => {
    const hash = readEdgeNonBlankString(value, path);
    assertEdgeContract(/^[a-f0-9]{64}$/.test(hash), path, 'a lowercase SHA-256 digest');
    return hash;
  },
  size_bytes: readEdgePositiveInteger,
  created_at: readEdgeTimestamp,
  approved_at: readEdgeNullableTimestamp,
  can_delete: readEdgeBoolean,
});

export type ContractTemplate = EdgeReaderResult<typeof readTemplate>;
export type ContractTemplateUpload = {
  family: ContractTemplateFamily;
  file: File;
};

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
