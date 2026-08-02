import { AppRole } from '../types/app-role';
import {
  AdminCoworkerDownloadPurpose,
  ReviewDecision,
} from '../types/admin-coworker-document';
import {
  CoworkerDocumentOrigin,
  CoworkerDocumentRequirementStatus,
  CoworkerDocumentStatus,
  SignatureVerificationMethod,
  SignatureVerificationStatus,
  VerifiedSignatureType,
} from '../types/coworker-document';
import {
  ICoworkerDocumentDefinition,
  ICoworkerDocumentVersion,
  ICoworkerOnboardingCase,
  ICoworkerSignaturePolicy,
  ICoworkerVersionDownload,
} from './i-coworker-document';

export interface IAdminCoworkerReviewQueueItem {
  readonly userId: string;
  readonly displayName: string;
  readonly email: string;
  readonly documentId: string;
  readonly documentTitle: string | null;
  readonly documentDefinitionId: string;
  readonly documentDefinitionCode: string;
  readonly documentDefinitionTitle: string;
  readonly status: 'submitted' | 'under_review';
  readonly submittedVersionId: string;
  readonly submittedAt: string;
  readonly reviewStartedAt: string | null;
  readonly revision: number;
  readonly updatedAt: string;
}

export interface IAdminCoworkerDocumentsDashboard {
  readonly catalog: {
    readonly signaturePolicies: readonly ICoworkerSignaturePolicy[];
    readonly documentDefinitions: readonly ICoworkerDocumentDefinition[];
  };
  readonly reviewQueue: readonly IAdminCoworkerReviewQueueItem[];
}

export interface IAdminCoworkerOnboardingResult {
  readonly created: boolean;
  readonly case: ICoworkerOnboardingCase;
}

export interface IAdminCoworkerSeedResult {
  readonly userId: string;
  readonly onboardingCaseId: string;
  readonly insertedCount: number;
}

export interface IAdminCoworkerRequirementResult {
  readonly id: string;
  readonly userId: string;
  readonly onboardingCaseId: string | null;
  readonly documentDefinitionId: string;
  readonly status: CoworkerDocumentRequirementStatus;
  readonly required: boolean;
  readonly dueAt: string | null;
  readonly fulfilledByDocumentId: string | null;
  readonly fulfilledAt: string | null;
  readonly waivedAt: string | null;
  readonly waiverReason: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface IAdminCoworkerReviewDetailUser {
  readonly userId: string;
  readonly email: string;
  readonly firstName: string | null;
  readonly appRole: AppRole;
}

export interface IAdminCoworkerReviewRequirement {
  readonly id: string;
  readonly onboardingCaseId: string | null;
  readonly status: CoworkerDocumentRequirementStatus;
  readonly required: boolean;
  readonly dueAt: string | null;
  readonly fulfilledByDocumentId: string | null;
  readonly fulfilledAt: string | null;
  readonly waivedAt: string | null;
  readonly waiverReason: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface IAdminCoworkerReviewDocument {
  readonly id: string;
  readonly userId: string;
  readonly onboardingCaseId: string | null;
  readonly requirementId: string | null;
  readonly documentDefinitionId: string;
  readonly title: string | null;
  readonly origin: CoworkerDocumentOrigin;
  readonly status: CoworkerDocumentStatus;
  readonly currentVersionId: string | null;
  readonly submittedVersionId: string | null;
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

export interface IAdminSignatureVerificationHistoryItem {
  readonly id: string;
  readonly documentVersionId: string;
  readonly verificationMethod: SignatureVerificationMethod;
  readonly verificationStatus: SignatureVerificationStatus;
  readonly signatureType: VerifiedSignatureType;
  readonly actorUserId: string | null;
  readonly providerName: string | null;
  readonly providerReference: string | null;
  readonly reason: string | null;
  readonly details: Readonly<Record<string, unknown>>;
  readonly createdAt: string;
}

export interface IAdminCoworkerDocumentReviewHistoryItem {
  readonly id: string;
  readonly documentVersionId: string;
  readonly decision: ReviewDecision;
  readonly signatureVerificationId: string | null;
  readonly rejectionReason: string | null;
  readonly note: string | null;
  readonly reviewedBy: string;
  readonly reviewedAt: string;
  readonly createdAt: string;
}

export interface IAdminCoworkerDocumentReviewDetail {
  readonly user: IAdminCoworkerReviewDetailUser;
  readonly documentDefinition: ICoworkerDocumentDefinition;
  readonly requirement: IAdminCoworkerReviewRequirement | null;
  readonly document: IAdminCoworkerReviewDocument;
  readonly submittedVersion: ICoworkerDocumentVersion | null;
  readonly currentVersion: ICoworkerDocumentVersion | null;
  readonly versions: readonly ICoworkerDocumentVersion[];
  readonly signatureVerifications:
    readonly IAdminSignatureVerificationHistoryItem[];
  readonly reviews: readonly IAdminCoworkerDocumentReviewHistoryItem[];
}

export interface IAdminSignatureVerification {
  readonly id: string;
  readonly documentId: string;
  readonly documentVersionId: string;
  readonly verificationMethod: SignatureVerificationMethod;
  readonly verificationStatus: Exclude<SignatureVerificationStatus, 'pending'>;
  readonly signatureType: VerifiedSignatureType;
  readonly actorUserId: string | null;
  readonly providerName: string | null;
  readonly providerReference: string | null;
  readonly reason: string | null;
  readonly details: Readonly<Record<string, unknown>>;
  readonly createdAt: string;
}

export interface IAdminCoworkerVersionDownload extends ICoworkerVersionDownload {
  readonly download: ICoworkerVersionDownload['download'] & {
    readonly purpose: AdminCoworkerDownloadPurpose;
  };
}
