import {
  AutomaticVerificationMode,
  CoworkerDocumentMultiplicity,
  CoworkerDocumentOrigin,
  CoworkerDocumentOriginPolicy,
  CoworkerDocumentRequirementStatus,
  CoworkerDocumentStatus,
  CoworkerDocumentVersionStatus,
  CoworkerOnboardingStatus,
  MalwareScanStatus,
  SignatureDeclarationType,
  SignatureVerificationMethod,
  SignatureVerificationStatus,
  VerifiedSignatureType,
} from '../types/coworker-document';

export interface ICoworkerDocumentAccess {
  readonly enabled: boolean;
  readonly grantedAt: string | null;
  readonly grantedViaRole: boolean;
}

export interface ICoworkerSignaturePolicy {
  readonly id: string;
  readonly code: string;
  readonly name: string;
  readonly description: string | null;
  readonly signatureRequired: boolean;
  readonly allowedDeclarationTypes: readonly SignatureDeclarationType[];
  readonly manualReviewRequired: boolean;
  readonly automaticVerificationMode: AutomaticVerificationMode;
  readonly isActive: boolean;
}

export interface ICoworkerDocumentDefinitionBase {
  readonly id: string;
  readonly code: string;
  readonly title: string;
  readonly description: string | null;
  readonly category: string;
  readonly originPolicy: CoworkerDocumentOriginPolicy;
  readonly multiplicity: CoworkerDocumentMultiplicity;
  readonly isRequiredByDefault: boolean;
  readonly allowedMimeTypes: readonly string[];
  readonly allowedExtensions: readonly string[];
  readonly maxSizeBytes: number;
  readonly retentionDays: number | null;
  readonly isActive: boolean;
  readonly activeFrom: string | null;
  readonly activeUntil: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface ICoworkerDocumentDefinition
  extends ICoworkerDocumentDefinitionBase {
  readonly signaturePolicy: ICoworkerSignaturePolicy;
}

export interface ICoworkerDocumentSignatureVerification {
  readonly id: string;
  readonly verificationMethod: SignatureVerificationMethod;
  readonly verificationStatus: SignatureVerificationStatus;
  readonly signatureType: VerifiedSignatureType;
  readonly reason: string | null;
  readonly createdAt: string;
}

export interface ICoworkerDocumentVersion {
  readonly id: string;
  readonly documentId: string;
  readonly versionNumber: number;
  readonly status: CoworkerDocumentVersionStatus;
  readonly originalFilename: string;
  readonly fileExtension: string;
  readonly declaredMimeType: string;
  readonly detectedMimeType: string | null;
  readonly expectedSizeBytes: number;
  readonly sizeBytes: number | null;
  readonly signatureDeclarationType: SignatureDeclarationType;
  readonly signatureDeclaredAt: string | null;
  readonly malwareScanStatus: MalwareScanStatus;
  readonly uploadedAt: string | null;
  readonly finalizedAt: string | null;
  readonly supersededAt: string | null;
  readonly retentionUntil: string | null;
  readonly legalHold: boolean;
  readonly latestSignatureVerification:
    | ICoworkerDocumentSignatureVerification
    | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface ICoworkerDocument {
  readonly id: string;
  readonly userId: string;
  readonly onboardingCaseId: string | null;
  readonly requirementId: string | null;
  readonly documentDefinitionId: string;
  readonly title: string | null;
  readonly origin: CoworkerDocumentOrigin;
  readonly status: CoworkerDocumentStatus;
  readonly currentVersionId: string | null;
  readonly currentVersion: ICoworkerDocumentVersion | null;
  readonly submittedVersionId: string | null;
  readonly submittedVersion: ICoworkerDocumentVersion | null;
  readonly versions: readonly ICoworkerDocumentVersion[];
  readonly submittedAt: string | null;
  readonly reviewStartedAt: string | null;
  readonly acceptedAt: string | null;
  readonly rejectedAt: string | null;
  readonly rejectionReason: string | null;
  readonly withdrawnAt: string | null;
  readonly archivedAt: string | null;
  readonly revision: number;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface ICoworkerOnboardingCase {
  readonly id: string;
  readonly userId: string;
  readonly status: CoworkerOnboardingStatus;
  readonly openedAt: string;
  readonly submittedAt: string | null;
  readonly reviewStartedAt: string | null;
  readonly needsCorrectionAt: string | null;
  readonly approvedAt: string | null;
  readonly suspendedAt: string | null;
  readonly closedAt: string | null;
  readonly revision: number;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface ICoworkerDocumentPortalSource {
  readonly id: string;
  readonly origin: 'system_generated' | 'admin_upload';
  readonly title: string | null;
  readonly status: CoworkerDocumentStatus;
  readonly currentVersion: ICoworkerDocumentVersion | null;
  readonly historyCount: number;
}

export interface ICoworkerDocumentPortalSubmission {
  readonly id: string;
  readonly origin: 'coworker_upload';
  readonly title: string | null;
  readonly status: CoworkerDocumentStatus;
  readonly currentVersion: ICoworkerDocumentVersion | null;
  readonly submittedVersionId: string | null;
  readonly historyCount: number;
}

export interface ICoworkerDocumentRequirement {
  readonly id: string;
  readonly onboardingCaseId: string | null;
  readonly status: CoworkerDocumentRequirementStatus;
  readonly required: boolean;
  readonly dueAt: string | null;
  readonly fulfilledByDocumentId: string | null;
  readonly fulfilledAt: string | null;
  readonly waivedAt: string | null;
  readonly waiverReason: string | null;
  readonly documentDefinition: ICoworkerDocumentDefinition;
  readonly sourceDocument: ICoworkerDocumentPortalSource | null;
  readonly submissionDocument: ICoworkerDocumentPortalSubmission | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface ICoworkerNotification {
  readonly id: string;
  readonly eventCode: string;
  readonly severity: string;
  readonly entityType: string;
  readonly entityId: string | null;
  readonly payload: Readonly<Record<string, unknown>>;
  readonly readAt: string | null;
  readonly createdAt: string;
}

export interface ICoworkerDocumentPortalResponse {
  readonly userId: string;
  readonly access: ICoworkerDocumentAccess;
  readonly activeOnboardingCase: ICoworkerOnboardingCase | null;
  readonly requirements: readonly ICoworkerDocumentRequirement[];
  readonly documentCatalog: readonly ICoworkerDocumentDefinition[];
  readonly notifications: readonly ICoworkerNotification[];
  readonly unreadNotificationCount: number;
  readonly viewer: {
    readonly actorUserId: string;
    readonly isAdmin: boolean;
  };
}

export interface ICoworkerVersionDownload {
  readonly download: {
    readonly documentId: string;
    readonly documentVersionId: string;
    readonly signedUrl: string;
    readonly expiresInSeconds: number;
    readonly originalFilename: string;
    readonly mimeType: string;
    readonly sizeBytes: number;
  };
}
