import {
  ICoworkerActiveOnboardingCase,
  ICoworkerDocumentDefinition,
  ICoworkerDocument,
  ICoworkerDocumentSignatureVerification,
  ICoworkerDocumentVersion,
  ICoworkerNotification,
  ICoworkerPortalDocument,
  ICoworkerSignaturePolicy,
} from '../../interfaces/i-coworker-document';
import {
  COWORKER_ACTIVE_ONBOARDING_STATUSES,
  COWORKER_AUTOMATIC_VERIFICATION_MODES,
  COWORKER_DOCUMENT_MULTIPLICITIES,
  COWORKER_DOCUMENT_ORIGIN_POLICIES,
  COWORKER_DOCUMENT_STATUSES,
  COWORKER_DOCUMENT_VERSION_STATUSES,
  COWORKER_MALWARE_SCAN_STATUSES,
  COWORKER_NOTIFICATION_ENTITY_TYPES,
  COWORKER_NOTIFICATION_SEVERITIES,
  COWORKER_PORTAL_DOCUMENT_STATUSES,
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
  readEdgeNonBlankString,
  readEdgeNullableInteger,
  readEdgeNullableString,
  readEdgeNullableTimestamp,
  readEdgeObject,
  readEdgeString,
  readEdgeTimestamp,
  readEdgeUuid,
} from '../../utils/edge-contract';

const nullableUuidReader = createEdgeNullableReader(readEdgeUuid);

export const coworkerSignaturePolicyReader:
  EdgeReader<ICoworkerSignaturePolicy> = createEdgeObjectReader({
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

export const coworkerDocumentDefinitionFieldReaders = {
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
  maxSizeBytes: readEdgeInteger,
  retentionDays: readEdgeNullableInteger,
  isActive: readEdgeBoolean,
  activeFrom: readEdgeNullableTimestamp,
  activeUntil: readEdgeNullableTimestamp,
  createdAt: readEdgeTimestamp,
  updatedAt: readEdgeTimestamp,
} as const;

export const coworkerDocumentDefinitionReader:
  EdgeReader<ICoworkerDocumentDefinition> = createEdgeObjectReader({
    ...coworkerDocumentDefinitionFieldReaders,
    signaturePolicy: coworkerSignaturePolicyReader,
  });

export const signatureVerificationFieldReaders = {
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
} as const;

export const coworkerDocumentSignatureVerificationReader:
  EdgeReader<ICoworkerDocumentSignatureVerification> = createEdgeObjectReader(
    signatureVerificationFieldReaders,
  );

export const documentVersionDownloadFieldReaders = {
  documentId: readEdgeUuid,
  documentVersionId: readEdgeUuid,
  signedUrl: readEdgeNonBlankString,
  expiresInSeconds: readEdgeInteger,
  originalFilename: readEdgeString,
  mimeType: readEdgeString,
  sizeBytes: readEdgeInteger,
} as const;

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

export const coworkerNotificationReader: EdgeReader<ICoworkerNotification> =
  createEdgeObjectReader(coworkerNotificationFieldReaders);

export const coworkerDocumentVersionReader:
  EdgeReader<ICoworkerDocumentVersion> = createEdgeObjectReader({
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
      coworkerDocumentSignatureVerificationReader,
    ),
    createdAt: readEdgeTimestamp,
    updatedAt: readEdgeTimestamp,
  });

const coworkerDocumentFieldReaders = {
  id: readEdgeUuid,
  userId: readEdgeUuid,
  onboardingCaseId: nullableUuidReader,
  requirementId: nullableUuidReader,
  documentDefinitionId: readEdgeUuid,
  title: readEdgeNullableString,
  currentVersionId: nullableUuidReader,
  currentVersion: createEdgeNullableReader(coworkerDocumentVersionReader),
  versions: createEdgeArrayReader(coworkerDocumentVersionReader),
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
} as const;

export const coworkerDocumentReader: EdgeReader<ICoworkerDocument> =
  createEdgeObjectReader({
    ...coworkerDocumentFieldReaders,
    status: createEdgeLiteralReader(COWORKER_DOCUMENT_STATUSES),
  });

export const coworkerPortalDocumentReader: EdgeReader<ICoworkerPortalDocument> =
  createEdgeObjectReader({
    ...coworkerDocumentFieldReaders,
    status: createEdgeLiteralReader(COWORKER_PORTAL_DOCUMENT_STATUSES),
  });

export const coworkerActiveOnboardingCaseReader:
  EdgeReader<ICoworkerActiveOnboardingCase> = createEdgeObjectReader({
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
