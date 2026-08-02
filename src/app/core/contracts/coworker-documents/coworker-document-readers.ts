import {
  ICoworkerDocument,
  ICoworkerDocumentDefinition,
  ICoworkerDocumentSignatureVerification,
  ICoworkerDocumentVersion,
  ICoworkerOnboardingCase,
  ICoworkerSignaturePolicy,
} from '../../interfaces/i-coworker-document';
import {
  COWORKER_ACTIVE_ONBOARDING_STATUSES,
  COWORKER_AUTOMATIC_VERIFICATION_MODES,
  COWORKER_DOCUMENT_MULTIPLICITIES,
  COWORKER_DOCUMENT_ORIGINS,
  COWORKER_DOCUMENT_ORIGIN_POLICIES,
  COWORKER_DOCUMENT_STATUSES,
  COWORKER_DOCUMENT_VERSION_STATUSES,
  COWORKER_MALWARE_SCAN_STATUSES,
  COWORKER_NOTIFICATION_ENTITY_TYPES,
  COWORKER_NOTIFICATION_SEVERITIES,
  COWORKER_SIGNATURE_DECLARATION_TYPES,
  COWORKER_SIGNATURE_VERIFICATION_METHODS,
  COWORKER_SIGNATURE_VERIFICATION_STATUSES,
  COWORKER_VERIFIED_SIGNATURE_TYPES,
} from '../../types/coworker-document';
import { EdgeReader } from '../../types/edge-contract';
import {
  assertEdgeContract,
  createEdgeArrayReader,
  createEdgeLiteralReader,
  createEdgeNullableReader,
  readEdgeBoolean,
  readEdgeInteger,
  readEdgeNonBlankString,
  readEdgeNonNegativeInteger,
  readEdgeNullableString,
  readEdgeNullableTimestamp,
  readEdgePositiveInteger,
  readEdgeObject,
  readEdgeString,
  readEdgeTimestamp,
  readEdgeUuid,
} from '../../utils/edge-contract';
import { createStrictEdgeObjectReader } from '../../utils/strict-edge-contract';

const nullableUuidReader = createEdgeNullableReader(readEdgeUuid);

export const coworkerSignaturePolicyReader:
  EdgeReader<ICoworkerSignaturePolicy> = createStrictEdgeObjectReader({
    id: readEdgeUuid,
    code: readEdgeString,
    name: readEdgeString,
    description: readEdgeNullableString,
    signatureRequired: readEdgeBoolean,
    allowedDeclarationTypes: createEdgeArrayReader(
      createEdgeLiteralReader(COWORKER_SIGNATURE_DECLARATION_TYPES),
    ),
    manualReviewRequired: readEdgeBoolean,
    automaticVerificationMode: createEdgeLiteralReader(
      COWORKER_AUTOMATIC_VERIFICATION_MODES,
    ),
    isActive: readEdgeBoolean,
  });

export const coworkerDocumentDefinitionReader:
  EdgeReader<ICoworkerDocumentDefinition> = createStrictEdgeObjectReader({
    id: readEdgeUuid,
    code: readEdgeString,
    title: readEdgeString,
    description: readEdgeNullableString,
    category: readEdgeString,
    originPolicy: createEdgeLiteralReader(COWORKER_DOCUMENT_ORIGIN_POLICIES),
    multiplicity: createEdgeLiteralReader(COWORKER_DOCUMENT_MULTIPLICITIES),
    isRequiredByDefault: readEdgeBoolean,
    allowedMimeTypes: createEdgeArrayReader(readEdgeString),
    allowedExtensions: createEdgeArrayReader(readEdgeString),
    maxSizeBytes: readEdgePositiveInteger,
    retentionDays: createEdgeNullableReader(readEdgeNonNegativeInteger),
    isActive: readEdgeBoolean,
    activeFrom: readEdgeNullableTimestamp,
    activeUntil: readEdgeNullableTimestamp,
    signaturePolicy: coworkerSignaturePolicyReader,
    createdAt: readEdgeTimestamp,
    updatedAt: readEdgeTimestamp,
  });

export const coworkerDocumentSignatureVerificationReader:
  EdgeReader<ICoworkerDocumentSignatureVerification> =
  createStrictEdgeObjectReader({
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

const documentVersionShapeReader:
  EdgeReader<ICoworkerDocumentVersion> = createStrictEdgeObjectReader({
    id: readEdgeUuid,
    documentId: readEdgeUuid,
    versionNumber: readEdgePositiveInteger,
    status: createEdgeLiteralReader(COWORKER_DOCUMENT_VERSION_STATUSES),
    originalFilename: readEdgeString,
    fileExtension: readEdgeString,
    declaredMimeType: readEdgeString,
    detectedMimeType: readEdgeNullableString,
    expectedSizeBytes: readEdgePositiveInteger,
    sizeBytes: createEdgeNullableReader(readEdgePositiveInteger),
    signatureDeclarationType: createEdgeLiteralReader(
      COWORKER_SIGNATURE_DECLARATION_TYPES,
    ),
    signatureDeclaredAt: readEdgeNullableTimestamp,
    malwareScanStatus: createEdgeLiteralReader(COWORKER_MALWARE_SCAN_STATUSES),
    uploadedAt: readEdgeNullableTimestamp,
    finalizedAt: readEdgeNullableTimestamp,
    supersededAt: readEdgeNullableTimestamp,
    retentionUntil: readEdgeNullableTimestamp,
    legalHold: readEdgeBoolean,
    latestSignatureVerification: createEdgeNullableReader(
      coworkerDocumentSignatureVerificationReader,
    ),
    createdAt: readEdgeTimestamp,
    updatedAt: readEdgeTimestamp,
  });

export function createCoworkerDocumentVersionReader(
  documentId: string,
): EdgeReader<ICoworkerDocumentVersion> {
  return (value, path) => {
    const version = documentVersionShapeReader(value, path);
    assertEdgeContract(
      version.documentId === documentId,
      `${path}.documentId`,
      `the owning document id ${documentId}`,
    );
    return version;
  };
}

const statusesRequiringSubmittedVersion = new Set([
  'submitted',
  'under_review',
  'accepted',
  'rejected',
]);

export const coworkerDocumentReader: EdgeReader<ICoworkerDocument> =
  (value, path) => {
    const source = readEdgeObject(value, path);
    const id = readEdgeUuid(source['id'], `${path}.id`);
    const versionReader = createCoworkerDocumentVersionReader(id);
    const document = createStrictEdgeObjectReader({
      id: readEdgeUuid,
      userId: readEdgeUuid,
      onboardingCaseId: nullableUuidReader,
      requirementId: nullableUuidReader,
      documentDefinitionId: readEdgeUuid,
      title: readEdgeNullableString,
      origin: createEdgeLiteralReader(COWORKER_DOCUMENT_ORIGINS),
      status: createEdgeLiteralReader(COWORKER_DOCUMENT_STATUSES),
      currentVersionId: nullableUuidReader,
      currentVersion: createEdgeNullableReader(versionReader),
      submittedVersionId: nullableUuidReader,
      submittedVersion: createEdgeNullableReader(versionReader),
      versions: createEdgeArrayReader(versionReader),
      submittedAt: readEdgeNullableTimestamp,
      reviewStartedAt: readEdgeNullableTimestamp,
      acceptedAt: readEdgeNullableTimestamp,
      rejectedAt: readEdgeNullableTimestamp,
      rejectionReason: readEdgeNullableString,
      withdrawnAt: readEdgeNullableTimestamp,
      archivedAt: readEdgeNullableTimestamp,
      revision: readEdgePositiveInteger,
      createdAt: readEdgeTimestamp,
      updatedAt: readEdgeTimestamp,
    })(value, path);
    const versionIds = document.versions.map((version) => version.id);

    assertDocumentVersions(document, versionIds, path);
    return document;
  };

function assertDocumentVersions(
  document: ICoworkerDocument,
  versionIds: readonly string[],
  path: string,
): void {
  assertEdgeContract(
    (document.currentVersionId === null) === (document.currentVersion === null) &&
      (document.currentVersion === null ||
        document.currentVersion.id === document.currentVersionId) &&
      (document.submittedVersionId === null) ===
        (document.submittedVersion === null) &&
      (document.submittedVersion === null ||
        document.submittedVersion.id === document.submittedVersionId) &&
      (document.currentVersionId === null ||
        versionIds.includes(document.currentVersionId)) &&
      (document.submittedVersionId === null ||
        versionIds.includes(document.submittedVersionId)) &&
      (!statusesRequiringSubmittedVersion.has(document.status) ||
        document.submittedVersion !== null) &&
      new Set(versionIds).size === versionIds.length &&
      new Set(document.versions.map((version) => version.versionNumber)).size ===
        document.versions.length,
    path,
    'consistent, unique current and submitted document versions',
  );
}

export const coworkerOnboardingCaseReader:
  EdgeReader<ICoworkerOnboardingCase> = createStrictEdgeObjectReader({
    id: readEdgeUuid,
    userId: readEdgeUuid,
    status: createEdgeLiteralReader(COWORKER_ACTIVE_ONBOARDING_STATUSES),
    openedAt: readEdgeTimestamp,
    submittedAt: readEdgeNullableTimestamp,
    reviewStartedAt: readEdgeNullableTimestamp,
    needsCorrectionAt: readEdgeNullableTimestamp,
    approvedAt: readEdgeNullableTimestamp,
    suspendedAt: readEdgeNullableTimestamp,
    closedAt: readEdgeNullableTimestamp,
    revision: readEdgeInteger,
    createdAt: readEdgeTimestamp,
    updatedAt: readEdgeTimestamp,
  });

export const documentVersionDownloadFieldReaders = {
  documentId: readEdgeUuid,
  documentVersionId: readEdgeUuid,
  signedUrl: readEdgeNonBlankString,
  expiresInSeconds: readEdgePositiveInteger,
  originalFilename: readEdgeString,
  mimeType: readEdgeString,
  sizeBytes: readEdgePositiveInteger,
} as const;

export const documentVersionDownloadReader = createStrictEdgeObjectReader(
  documentVersionDownloadFieldReaders,
);

export const coworkerNotificationFieldReaders = {
  id: readEdgeUuid,
  eventCode: readEdgeString,
  severity: createEdgeLiteralReader(COWORKER_NOTIFICATION_SEVERITIES),
  entityType: createEdgeLiteralReader(COWORKER_NOTIFICATION_ENTITY_TYPES),
  entityId: nullableUuidReader,
  payload: readEdgeObject,
  readAt: readEdgeNullableTimestamp,
  createdAt: readEdgeTimestamp,
} as const;

export const notificationReader = createStrictEdgeObjectReader({
  id: readEdgeUuid,
  eventCode: readEdgeString,
  severity: readEdgeString,
  entityType: readEdgeString,
  entityId: createEdgeNullableReader(readEdgeString),
  payload: readEdgeObject,
  readAt: readEdgeNullableTimestamp,
  createdAt: readEdgeTimestamp,
});
