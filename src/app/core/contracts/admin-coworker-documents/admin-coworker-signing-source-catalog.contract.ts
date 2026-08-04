import {
  IAdminCoworkerSigningSourceCatalogItem,
  IAdminCoworkerSigningSourceDetail,
} from '../../interfaces/i-admin-coworker-signing-source';
import { ADMIN_COWORKER_SIGNING_SOURCE_ACTION } from '../../types/admin-coworker-signing-source';
import { EdgeReader } from '../../types/edge-contract';
import {
  assertEdgeContract,
  createEdgeArrayReader,
  createEdgeLiteralReader,
} from '../../utils/edge-contract';
import { createStrictEdgeObjectReader } from '../../utils/strict-edge-contract';
import {
  createSigningSourceValueReader,
  signingSourceCatalogItemReader,
} from './admin-coworker-signing-source-readers';

export const signingSourceCatalogResponseReader:
  EdgeReader<readonly IAdminCoworkerSigningSourceCatalogItem[]> =
  (value, path) => {
    const response = createStrictEdgeObjectReader({
      ok: createEdgeLiteralReader([true] as const),
      action: createEdgeLiteralReader([
        ADMIN_COWORKER_SIGNING_SOURCE_ACTION.getCatalog,
      ] as const),
      sources: createEdgeArrayReader(signingSourceCatalogItemReader),
    })(value, path);
    const identities = response.sources.map((source) =>
      `${source.sourceType}:${source.sourceCode}:${source.onboardingCaseId ?? ''}`
    );

    assertEdgeContract(
      new Set(response.sources.map((source) => source.id)).size ===
        response.sources.length &&
        new Set(identities).size === identities.length,
      `${path}.sources`,
      'unique source ids and source identities',
    );
    return response.sources;
  };

export function createSigningSourceDetailReader(
  sourceId: string,
): EdgeReader<IAdminCoworkerSigningSourceDetail> {
  return (value, path) => {
    const response = createStrictEdgeObjectReader({
      ok: createEdgeLiteralReader([true] as const),
      action: createEdgeLiteralReader([
        ADMIN_COWORKER_SIGNING_SOURCE_ACTION.getDetail,
      ] as const),
      source: createSigningSourceValueReader(sourceId),
    })(value, path);
    return response.source;
  };
}
