import { AppRole } from '../types/app-role';
import { CoworkerPortalDocumentStatus } from '../types/coworker-document';
import {
  ICoworkerActiveOnboardingCase,
  ICoworkerDocumentDefinitionBase,
  ICoworkerSignaturePolicy,
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
