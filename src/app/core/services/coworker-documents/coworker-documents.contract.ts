import {
  ICoworkerAvailableDocumentDefinition,
  ICoworkerDocumentAccess,
  ICoworkerDocumentDefinition,
  ICoworkerDocumentPortalResponse,
  ICoworkerDocumentRequirement,
  ICoworkerDocumentSignatureVerification,
  ICoworkerDocumentVersion,
  ICoworkerVersionDownload,
  ICoworkerNotification,
  ICoworkerPortalDocument,
} from '../../interfaces/i-coworker-document';
import { APP_ROLES } from '../../types/app-role';
import {
  COWORKER_AVAILABLE_ORIGIN_POLICIES,
  COWORKER_DOCUMENT_ACTION,
  COWORKER_DOCUMENT_VERSION_STATUSES,
  COWORKER_MALWARE_SCAN_STATUSES,
  COWORKER_NOTIFICATION_ENTITY_TYPES,
  COWORKER_NOTIFICATION_SEVERITIES,
  COWORKER_PORTAL_DOCUMENT_STATUSES,
  COWORKER_PORTAL_REQUIREMENT_STATUSES,
  COWORKER_SIGNATURE_DECLARATION_TYPES,
  COWORKER_SIGNATURE_VERIFICATION_METHODS,
  COWORKER_SIGNATURE_VERIFICATION_STATUSES,
  COWORKER_VERIFIED_SIGNATURE_TYPES,
} from '../../types/coworker-document';
import { EdgeReader } from '../../types/edge-contract';
import {
  createEdgeArrayReader,
  createEdgeLiteralReader,
  createEdgeNullableReader,
  createEdgeObjectReader,
  readEdgeBoolean,
  readEdgeInteger,
  readEdgeNullableInteger,
  readEdgeNullableString,
  readEdgeNullableTimestamp,
  readEdgeObject,
  readEdgeString,
  readEdgeTimestamp,
  readEdgeUuid,
} from '../../utils/edge-contract';
import {
  coworkerActiveOnboardingCaseReader,
  coworkerDocumentDefinitionFieldReaders,
  coworkerSignaturePolicyReader,
} from './coworker-document-readers';

const nullableUuidReader = createEdgeNullableReader(readEdgeUuid);
const trueReader = createEdgeLiteralReader([true] as const);

const documentDefinitionFields = {
  ...coworkerDocumentDefinitionFieldReaders,
  signaturePolicy: coworkerSignaturePolicyReader,
} as const;

const documentDefinitionReader: EdgeReader<ICoworkerDocumentDefinition> =
  createEdgeObjectReader(documentDefinitionFields);

const availableDocumentDefinitionReader:
  EdgeReader<ICoworkerAvailableDocumentDefinition> = createEdgeObjectReader({
    ...documentDefinitionFields,
    originPolicy: createEdgeLiteralReader(
      COWORKER_AVAILABLE_ORIGIN_POLICIES,
    ),
    isActive: trueReader,
  });

const signatureVerificationReader:
  EdgeReader<ICoworkerDocumentSignatureVerification> = createEdgeObjectReader({
    id: readEdgeUuid,
    verificationMethod: createEdgeLiteralReader(
      COWORKER_SIGNATURE_VERIFICATION_METHODS,
    ),
    verificationStatus: createEdgeLiteralReader(
      COWORKER_SIGNATURE_VERIFICATION_STATUSES,
    ),
    signatureType: createEdgeLiteralReader(COWORKER_VERIFIED_SIGNATURE_TYPES),
    reason: readEdgeNullableString,
    createdAt: readEdgeTimestamp,
  });

const documentVersionReader: EdgeReader<ICoworkerDocumentVersion> =
  createEdgeObjectReader({
    id: readEdgeUuid,
    documentId: readEdgeUuid,
    versionNumber: readEdgeInteger,
    status: createEdgeLiteralReader(COWORKER_DOCUMENT_VERSION_STATUSES),
    originalFilename: readEdgeString,
    fileExtension: readEdgeString,
    declaredMimeType: readEdgeString,
    detectedMimeType: readEdgeNullableString,
    expectedSizeBytes: readEdgeInteger,
    sizeBytes: readEdgeNullableInteger,
    signatureDeclarationType: createEdgeLiteralReader(
      COWORKER_SIGNATURE_DECLARATION_TYPES,
    ),
    signatureDeclaredAt: readEdgeNullableTimestamp,
    malwareScanStatus: createEdgeLiteralReader(
      COWORKER_MALWARE_SCAN_STATUSES,
    ),
    uploadedAt: readEdgeNullableTimestamp,
    finalizedAt: readEdgeNullableTimestamp,
    supersededAt: readEdgeNullableTimestamp,
    retentionUntil: readEdgeNullableTimestamp,
    legalHold: readEdgeBoolean,
    latestSignatureVerification: createEdgeNullableReader(
      signatureVerificationReader,
    ),
    createdAt: readEdgeTimestamp,
    updatedAt: readEdgeTimestamp,
  });

const portalDocumentReader: EdgeReader<ICoworkerPortalDocument> =
  createEdgeObjectReader({
    id: readEdgeUuid,
    userId: readEdgeUuid,
    onboardingCaseId: nullableUuidReader,
    requirementId: nullableUuidReader,
    documentDefinitionId: readEdgeUuid,
    title: readEdgeNullableString,
    status: createEdgeLiteralReader(COWORKER_PORTAL_DOCUMENT_STATUSES),
    currentVersionId: nullableUuidReader,
    currentVersion: createEdgeNullableReader(documentVersionReader),
    versions: createEdgeArrayReader(documentVersionReader),
    submittedAt: readEdgeNullableTimestamp,
    reviewStartedAt: readEdgeNullableTimestamp,
    acceptedAt: readEdgeNullableTimestamp,
    rejectedAt: readEdgeNullableTimestamp,
    rejectionReason: readEdgeNullableString,
    withdrawnAt: readEdgeNullableTimestamp,
    archivedAt: readEdgeNullableTimestamp,
    revision: readEdgeInteger,
    createdAt: readEdgeTimestamp,
    updatedAt: readEdgeTimestamp,
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
    documentDefinition: documentDefinitionReader,
    documents: createEdgeArrayReader(portalDocumentReader),
    createdAt: readEdgeTimestamp,
    updatedAt: readEdgeTimestamp,
  });

const notificationReader: EdgeReader<ICoworkerNotification> =
  createEdgeObjectReader({
    id: readEdgeUuid,
    eventCode: readEdgeString,
    severity: createEdgeLiteralReader(COWORKER_NOTIFICATION_SEVERITIES),
    entityType: createEdgeLiteralReader(COWORKER_NOTIFICATION_ENTITY_TYPES),
    entityId: nullableUuidReader,
    payload: readEdgeObject,
    readAt: readEdgeNullableTimestamp,
    createdAt: readEdgeTimestamp,
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
    unassignedDocuments: createEdgeArrayReader(portalDocumentReader),
    availableDefinitions: createEdgeArrayReader(
      availableDocumentDefinitionReader,
    ),
    notifications: createEdgeArrayReader(notificationReader),
    unreadNotificationCount: readEdgeInteger,
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
      download: createEdgeObjectReader({
        documentId: readEdgeUuid,
        documentVersionId: readEdgeUuid,
        signedUrl: readEdgeString,
        expiresInSeconds: readEdgeInteger,
        originalFilename: readEdgeString,
        mimeType: readEdgeString,
        sizeBytes: readEdgeInteger,
      }),
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
