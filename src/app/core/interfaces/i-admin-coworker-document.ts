import { AppRole } from '../types/app-role';
import {
  CoworkerPortalDocumentStatus,
  CoworkerDocumentRequirementStatus,
} from '../types/coworker-document';
import {
  AdminCoworkerDownloadPurpose,
  AdminCoworkerReviewDecision,
} from '../types/admin-coworker-document';
import {
  ICoworkerActiveOnboardingCase,
  ICoworkerDocumentDefinition,
  ICoworkerDocumentDefinitionBase,
  ICoworkerDocument,
  ICoworkerDocumentSignatureVerification,
  ICoworkerSignaturePolicy,
  ICoworkerVersionDownload,
} from './i-coworker-document';

export interface IAdminCoworkerDocumentDefinition
  extends ICoworkerDocumentDefinitionBase {
  readonly signaturePolicyCode: string;
}

export interface IAdminCoworkerCatalogEntry {
  readonly userId: string;
  readonly displayName: string;
  readonly email: string;
  readonly appRole: AppRole;
  readonly accessEnabled: boolean;
}

export interface IAdminCoworkerReviewQueueItem {
  readonly userId: string;
  readonly displayName: string;
  readonly email: string;
  readonly documentId: string;
  readonly documentTitle: string | null;
  readonly documentDefinitionId: string;
  readonly documentDefinitionCode: string;
  readonly documentDefinitionTitle: string;
  readonly status: CoworkerPortalDocumentStatus;
  readonly currentVersionId: string;
  readonly submittedAt: string;
  readonly reviewStartedAt: string | null;
  readonly revision: number;
  readonly updatedAt: string;
}

export interface IAdminCoworkerDocumentsDashboard {
  readonly catalog: {
    readonly signaturePolicies: readonly ICoworkerSignaturePolicy[];
    readonly documentDefinitions: readonly IAdminCoworkerDocumentDefinition[];
    readonly coworkers: readonly IAdminCoworkerCatalogEntry[];
  };
  readonly reviewQueue: readonly IAdminCoworkerReviewQueueItem[];
}

export interface IAdminCoworkerOnboardingResult {
  readonly created: boolean;
  readonly case: ICoworkerActiveOnboardingCase;
}

export interface IAdminCoworkerSeedResult {
  readonly userId: string;
  readonly onboardingCaseId: string;
  readonly insertedCount: number;
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

export interface IAdminSignatureVerificationHistoryItem
  extends ICoworkerDocumentSignatureVerification {
  readonly documentVersionId: string;
  readonly actorUserId: string | null;
  readonly providerName: string | null;
  readonly providerReference: string | null;
  readonly details: Readonly<Record<string, unknown>>;
}

export interface IAdminCoworkerDocumentReviewHistoryItem {
  readonly id: string;
  readonly documentVersionId: string;
  readonly decision: AdminCoworkerReviewDecision;
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
  readonly document: ICoworkerDocument;
  readonly signatureVerifications:
    readonly IAdminSignatureVerificationHistoryItem[];
  readonly reviews: readonly IAdminCoworkerDocumentReviewHistoryItem[];
}

export interface IAdminCoworkerVersionDownload
  extends ICoworkerVersionDownload {
  readonly download: ICoworkerVersionDownload['download'] & {
    readonly purpose: AdminCoworkerDownloadPurpose;
  };
}
