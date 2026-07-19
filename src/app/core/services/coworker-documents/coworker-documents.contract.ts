import {
  ICoworkerActiveOnboardingCase,
  ICoworkerAvailableDocumentDefinition,
  ICoworkerDocumentAccess,
  ICoworkerDocumentDefinition,
  ICoworkerDocumentPortalResponse,
  ICoworkerDocumentRequirement,
  ICoworkerDocumentSignatureVerification,
  ICoworkerDocumentVersion,
  ICoworkerDocumentVersionDownloadResponse,
  ICoworkerNotification,
  ICoworkerPortalDocument,
  ICoworkerSignaturePolicy,
} from '../../interfaces/i-coworker-document';
import { APP_ROLES } from '../../types/app-role';
import {
  COWORKER_ACTIVE_ONBOARDING_STATUSES,
  COWORKER_AVAILABLE_DOCUMENT_ORIGIN_POLICIES,
  COWORKER_DOCUMENT_DOWNLOAD_ACTION,
  COWORKER_DOCUMENT_MULTIPLICITIES,
  COWORKER_DOCUMENT_ORIGIN_POLICIES,
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
  readEdgeObject,
  readEdgeString,
  readEdgeTimestamp,
  readEdgeUuid,
} from '../../utils/edge-contract';

const nullableStringReader = createEdgeNullableReader(readEdgeString);
const nullableIntegerReader = createEdgeNullableReader(readEdgeInteger);
const nullableTimestampReader = createEdgeNullableReader(readEdgeTimestamp);
const nullableUuidReader = createEdgeNullableReader(readEdgeUuid);
const stringArrayReader = createEdgeArrayReader(readEdgeString);
const trueReader = createEdgeLiteralReader([true] as const);

const signaturePolicyReader: EdgeReader<ICoworkerSignaturePolicy> =
  createEdgeObjectReader({
    id: readEdgeUuid,
    code: readEdgeString,
    name: readEdgeString,
    description: nullableStringReader,
    signatureRequired: readEdgeBoolean,
    allowedDeclarationTypes: createEdgeArrayReader(
      createEdgeLiteralReader(COWORKER_SIGNATURE_DECLARATION_TYPES),
    ),
    manualReviewRequired: readEdgeBoolean,
    automaticVerificationMode: readEdgeString,
    isActive: readEdgeBoolean,
  });

const documentDefinitionFields = {
  id: readEdgeUuid,
  code: readEdgeString,
  title: readEdgeString,
  description: nullableStringReader,
  category: readEdgeString,
  originPolicy: createEdgeLiteralReader(COWORKER_DOCUMENT_ORIGIN_POLICIES),
  multiplicity: createEdgeLiteralReader(COWORKER_DOCUMENT_MULTIPLICITIES),
  isRequiredByDefault: readEdgeBoolean,
  allowedMimeTypes: stringArrayReader,
  allowedExtensions: stringArrayReader,
  maxSizeBytes: readEdgeInteger,
  retentionDays: nullableIntegerReader,
  isActive: readEdgeBoolean,
  activeFrom: nullableTimestampReader,
  activeUntil: nullableTimestampReader,
  signaturePolicy: signaturePolicyReader,
  createdAt: readEdgeTimestamp,
  updatedAt: readEdgeTimestamp,
} as const;

const documentDefinitionReader: EdgeReader<ICoworkerDocumentDefinition> =
  createEdgeObjectReader(documentDefinitionFields);

const availableDocumentDefinitionReader:
  EdgeReader<ICoworkerAvailableDocumentDefinition> = createEdgeObjectReader({
    ...documentDefinitionFields,
    originPolicy: createEdgeLiteralReader(
      COWORKER_AVAILABLE_DOCUMENT_ORIGIN_POLICIES,
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
    reason: nullableStringReader,
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
    detectedMimeType: nullableStringReader,
    expectedSizeBytes: readEdgeInteger,
    sizeBytes: nullableIntegerReader,
    signatureDeclarationType: createEdgeLiteralReader(
      COWORKER_SIGNATURE_DECLARATION_TYPES,
    ),
    signatureDeclaredAt: nullableTimestampReader,
    malwareScanStatus: createEdgeLiteralReader(
      COWORKER_MALWARE_SCAN_STATUSES,
    ),
    uploadedAt: nullableTimestampReader,
    finalizedAt: nullableTimestampReader,
    supersededAt: nullableTimestampReader,
    retentionUntil: nullableTimestampReader,
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
    title: nullableStringReader,
    status: createEdgeLiteralReader(COWORKER_PORTAL_DOCUMENT_STATUSES),
    currentVersionId: nullableUuidReader,
    currentVersion: createEdgeNullableReader(documentVersionReader),
    versions: createEdgeArrayReader(documentVersionReader),
    submittedAt: nullableTimestampReader,
    reviewStartedAt: nullableTimestampReader,
    acceptedAt: nullableTimestampReader,
    rejectedAt: nullableTimestampReader,
    rejectionReason: nullableStringReader,
    withdrawnAt: nullableTimestampReader,
    archivedAt: nullableTimestampReader,
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
    dueAt: nullableTimestampReader,
    fulfilledByDocumentId: nullableUuidReader,
    fulfilledAt: nullableTimestampReader,
    waivedAt: nullableTimestampReader,
    waiverReason: nullableStringReader,
    documentDefinition: documentDefinitionReader,
    documents: createEdgeArrayReader(portalDocumentReader),
    createdAt: readEdgeTimestamp,
    updatedAt: readEdgeTimestamp,
  });

const onboardingCaseReader: EdgeReader<ICoworkerActiveOnboardingCase> =
  createEdgeObjectReader({
    id: readEdgeUuid,
    userId: readEdgeUuid,
    status: createEdgeLiteralReader(COWORKER_ACTIVE_ONBOARDING_STATUSES),
    openedAt: readEdgeTimestamp,
    submittedAt: nullableTimestampReader,
    reviewStartedAt: nullableTimestampReader,
    needsCorrectionAt: nullableTimestampReader,
    approvedAt: nullableTimestampReader,
    suspendedAt: nullableTimestampReader,
    closedAt: nullableTimestampReader,
    revision: readEdgeInteger,
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
    readAt: nullableTimestampReader,
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
    activeOnboardingCase: createEdgeNullableReader(onboardingCaseReader),
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
  EdgeReader<ICoworkerDocumentVersionDownloadResponse> =
    createEdgeObjectReader({
      ok: trueReader,
      action: createEdgeLiteralReader([
        COWORKER_DOCUMENT_DOWNLOAD_ACTION,
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

export function parseCoworkerDocumentVersionDownloadResponse(
  value: unknown,
): ICoworkerDocumentVersionDownloadResponse {
  return downloadResponseReader(value, 'response');
}
