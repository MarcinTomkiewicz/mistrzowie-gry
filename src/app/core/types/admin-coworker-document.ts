import { FormArray, FormControl, FormGroup } from '@angular/forms';

import {
  CoworkerDocumentMultiplicity,
  CoworkerDocumentOriginPolicy,
} from './coworker-document';

export const ADMIN_COWORKER_DOCUMENT_ACTION = {
  saveDefinition: 'saveDefinition',
  ensureOnboarding: 'ensureOnboarding',
  seedDefaultRequirements: 'seedDefaultRequirements',
  assignRequirement: 'assignRequirement',
  getReviewDetail: 'getReviewDetail',
  startReview: 'startReview',
  verifySignature: 'verifySignature',
  acceptDocument: 'acceptDocument',
  rejectDocument: 'rejectDocument',
  downloadDocumentVersion: 'downloadDocumentVersion',
} as const;

export const ADMIN_SIGNATURE_VERIFICATION_STATUSES = [
  'confirmed',
  'rejected',
  'indeterminate',
  'unsupported',
] as const;

export const ADMIN_COWORKER_REVIEW_DECISIONS = [
  'accepted',
  'rejected',
] as const;

export const ADMIN_COWORKER_DOWNLOAD_PURPOSES = [
  'admin_review',
  'admin_download',
] as const;

export const ADMIN_COWORKER_DOCUMENT_ERROR_CODE = {
  resourceNotFound: 'DOCUMENT_RESOURCE_NOT_FOUND',
  documentConflict: 'DOCUMENT_CONFLICT',
  concurrentModification: 'CONCURRENT_MODIFICATION',
} as const;

export type AdminCoworkerDocumentAction =
  (typeof ADMIN_COWORKER_DOCUMENT_ACTION)[keyof typeof ADMIN_COWORKER_DOCUMENT_ACTION];

export type AdminSignatureVerificationStatus =
  (typeof ADMIN_SIGNATURE_VERIFICATION_STATUSES)[number];

export type AdminCoworkerReviewDecision =
  (typeof ADMIN_COWORKER_REVIEW_DECISIONS)[number];

export type AdminCoworkerDownloadPurpose =
  (typeof ADMIN_COWORKER_DOWNLOAD_PURPOSES)[number];

export type AdminCoworkerDocumentDefinitionPayload = {
  readonly id: string | null;
  readonly code: string;
  readonly title: string;
  readonly description: string | null;
  readonly category: string;
  readonly originPolicy: CoworkerDocumentOriginPolicy;
  readonly multiplicity: CoworkerDocumentMultiplicity;
  readonly isRequiredByDefault: boolean;
  readonly signaturePolicyCode: string;
  readonly allowedMimeTypes: readonly string[];
  readonly allowedExtensions: readonly string[];
  readonly maxSizeBytes: number;
  readonly retentionDays: number | null;
  readonly isActive: boolean;
  readonly activeFrom: string | null;
  readonly activeUntil: string | null;
};

export type AdminCoworkerRequirementPayload = {
  readonly userId: string;
  readonly onboardingCaseId: string | null;
  readonly documentDefinitionId: string;
  readonly required: boolean;
  readonly dueAt: string | null;
};

export type AdminCoworkerReviewTarget = {
  readonly userId: string;
  readonly documentId: string;
};

export type AdminSignatureVerificationPayload =
  AdminCoworkerReviewTarget & {
    readonly documentVersionId: string;
    readonly verificationStatus: AdminSignatureVerificationStatus;
    readonly reason: string | null;
  };

export type AdminSignatureVerificationInput = Pick<
  AdminSignatureVerificationPayload,
  'verificationStatus' | 'reason'
>;

export type AdminCoworkerAcceptDocumentPayload = AdminCoworkerReviewTarget & {
  readonly note: string | null;
};

export type AdminCoworkerAcceptDocumentInput = Pick<
  AdminCoworkerAcceptDocumentPayload,
  'note'
>;

export type AdminCoworkerRejectDocumentPayload = AdminCoworkerReviewTarget & {
  readonly rejectionReason: string;
  readonly note: string | null;
};

export type AdminCoworkerRejectDocumentInput = Pick<
  AdminCoworkerRejectDocumentPayload,
  'rejectionReason' | 'note'
>;

export type AdminCoworkerDocumentDownloadPayload = {
  readonly userId: string;
  readonly documentVersionId: string;
  readonly purpose: AdminCoworkerDownloadPurpose;
};

export type AdminSignatureVerificationForm = FormGroup<{
  verificationStatus: FormControl<AdminSignatureVerificationStatus | null>;
  reason: FormControl<string>;
}>;

export type AdminCoworkerReviewDecisionForm = FormGroup<{
  rejectionReason: FormControl<string>;
  note: FormControl<string>;
}>;

export type AdminCoworkerDocumentArrayField =
  | 'allowedMimeTypes'
  | 'allowedExtensions';

export type AdminCoworkerDocumentDefinitionForm = FormGroup<{
  code: FormControl<string>;
  title: FormControl<string>;
  description: FormControl<string>;
  category: FormControl<string>;
  originPolicy: FormControl<CoworkerDocumentOriginPolicy>;
  multiplicity: FormControl<CoworkerDocumentMultiplicity>;
  isRequiredByDefault: FormControl<boolean>;
  signaturePolicyCode: FormControl<string>;
  allowedMimeTypes: FormArray<FormControl<string>>;
  allowedExtensions: FormArray<FormControl<string>>;
  maxSizeBytes: FormControl<number>;
  retentionDays: FormControl<number | null>;
  isActive: FormControl<boolean>;
  activeFrom: FormControl<Date | null>;
  activeUntil: FormControl<Date | null>;
}>;

export type AdminCoworkerDocumentActionRequest =
  | {
      readonly action: typeof ADMIN_COWORKER_DOCUMENT_ACTION.saveDefinition;
      readonly definition: AdminCoworkerDocumentDefinitionPayload;
    }
  | {
      readonly action: typeof ADMIN_COWORKER_DOCUMENT_ACTION.ensureOnboarding;
      readonly userId: string;
    }
  | {
      readonly action: typeof ADMIN_COWORKER_DOCUMENT_ACTION.seedDefaultRequirements;
      readonly userId: string;
      readonly onboardingCaseId: string;
    }
  | {
      readonly action: typeof ADMIN_COWORKER_DOCUMENT_ACTION.assignRequirement;
      readonly requirement: AdminCoworkerRequirementPayload;
    }
  | (AdminCoworkerReviewTarget & {
      readonly action: typeof ADMIN_COWORKER_DOCUMENT_ACTION.getReviewDetail;
    })
  | (AdminCoworkerReviewTarget & {
      readonly action: typeof ADMIN_COWORKER_DOCUMENT_ACTION.startReview;
    })
  | (AdminSignatureVerificationPayload & {
      readonly action: typeof ADMIN_COWORKER_DOCUMENT_ACTION.verifySignature;
    })
  | (AdminCoworkerAcceptDocumentPayload & {
      readonly action: typeof ADMIN_COWORKER_DOCUMENT_ACTION.acceptDocument;
    })
  | (AdminCoworkerRejectDocumentPayload & {
      readonly action: typeof ADMIN_COWORKER_DOCUMENT_ACTION.rejectDocument;
    })
  | (AdminCoworkerDocumentDownloadPayload & {
      readonly action: typeof ADMIN_COWORKER_DOCUMENT_ACTION.downloadDocumentVersion;
    });
