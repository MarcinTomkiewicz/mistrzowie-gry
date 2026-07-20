import {
  ICoworkerAvailableDocumentDefinition,
  ICoworkerDocumentAccess,
  ICoworkerDocumentPortalResponse,
  ICoworkerDocumentRequirement,
  ICoworkerVersionDownload,
} from '../../interfaces/i-coworker-document';
import { APP_ROLES } from '../../types/app-role';
import {
  COWORKER_AVAILABLE_ORIGIN_POLICIES,
  COWORKER_DOCUMENT_ACTION,
  COWORKER_PORTAL_REQUIREMENT_STATUSES,
} from '../../types/coworker-document';
import { EdgeReader } from '../../types/edge-contract';
import {
  createEdgeArrayReader,
  createEdgeLiteralReader,
  createEdgeNullableReader,
  createEdgeObjectReader,
  readEdgeBoolean,
  readEdgeNonNegativeInteger,
  readEdgeNullableInteger,
  readEdgeNullableString,
  readEdgeNullableTimestamp,
  readEdgeString,
  readEdgeTimestamp,
  readEdgeUuid,
} from '../../utils/edge-contract';
import {
  coworkerActiveOnboardingCaseReader,
  coworkerDocumentDefinitionReader,
  coworkerDocumentDefinitionFieldReaders,
  coworkerNotificationReader,
  coworkerPortalDocumentReader,
  coworkerSignaturePolicyReader,
  documentVersionDownloadFieldReaders,
} from './coworker-document-readers';

const nullableUuidReader = createEdgeNullableReader(readEdgeUuid);
const trueReader = createEdgeLiteralReader([true] as const);

const documentDefinitionFields = {
  ...coworkerDocumentDefinitionFieldReaders,
  signaturePolicy: coworkerSignaturePolicyReader,
} as const;

const availableDocumentDefinitionReader:
  EdgeReader<ICoworkerAvailableDocumentDefinition> = createEdgeObjectReader({
    ...documentDefinitionFields,
    originPolicy: createEdgeLiteralReader(
      COWORKER_AVAILABLE_ORIGIN_POLICIES,
    ),
    isActive: trueReader,
  });

const requirementReader: EdgeReader<ICoworkerDocumentRequirement> =
  createEdgeObjectReader({
    id: readEdgeUuid,
    onboardingCaseId: nullableUuidReader,
    status: createEdgeLiteralReader(COWORKER_PORTAL_REQUIREMENT_STATUSES),
    required: readEdgeBoolean,
    dueAt: readEdgeNullableTimestamp,
    fulfilledByDocumentId: nullableUuidReader,
    fulfilledAt: readEdgeNullableTimestamp,
    waivedAt: readEdgeNullableTimestamp,
    waiverReason: readEdgeNullableString,
    documentDefinition: coworkerDocumentDefinitionReader,
    documents: createEdgeArrayReader(coworkerPortalDocumentReader),
    createdAt: readEdgeTimestamp,
    updatedAt: readEdgeTimestamp,
  });

const accessReader: EdgeReader<ICoworkerDocumentAccess> =
  createEdgeObjectReader({
    enabled: trueReader,
    grantedAt: readEdgeTimestamp,
    grantedViaRole: createEdgeNullableReader(
      createEdgeLiteralReader(APP_ROLES),
    ),
  });

const portalReader: EdgeReader<ICoworkerDocumentPortalResponse> =
  createEdgeObjectReader({
    userId: readEdgeUuid,
    access: accessReader,
    activeOnboardingCase: createEdgeNullableReader(
      coworkerActiveOnboardingCaseReader,
    ),
    requirements: createEdgeArrayReader(requirementReader),
    unassignedDocuments: createEdgeArrayReader(coworkerPortalDocumentReader),
    availableDefinitions: createEdgeArrayReader(
      availableDocumentDefinitionReader,
    ),
    notifications: createEdgeArrayReader(coworkerNotificationReader),
    unreadNotificationCount: readEdgeNonNegativeInteger,
    viewer: createEdgeObjectReader({
      actorUserId: readEdgeUuid,
      isAdmin: readEdgeBoolean,
    }),
  });

const downloadResponseReader:
  EdgeReader<ICoworkerVersionDownload> =
    createEdgeObjectReader({
      ok: trueReader,
      action: createEdgeLiteralReader([
        COWORKER_DOCUMENT_ACTION.downloadDocumentVersion,
      ] as const),
      download: createEdgeObjectReader(documentVersionDownloadFieldReaders),
    });

export function parseCoworkerDocumentPortalResponse(
  value: unknown,
): ICoworkerDocumentPortalResponse {
  return portalReader(value, 'response');
}

export function parseDocumentDownloadResponse(
  value: unknown,
): ICoworkerVersionDownload {
  return downloadResponseReader(value, 'response');
}
