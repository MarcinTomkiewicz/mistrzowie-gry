import type { AppRole } from '../types/app-role';
import type {
  CoworkerDocumentAssignmentStatus,
  CoworkerDocumentLifecycleStatus,
  CoworkerDocumentRequiredAction,
  CoworkerDocumentReviewDecision,
  CoworkerDocumentSource,
  CoworkerOnboardingLifecycleStatus,
} from '../types/coworker-onboarding';
import type { ICoworkerOnboardingRow } from './i-coworker-onboarding';

export interface IAdminCoworkerOnboardingCandidate {
  readonly user_id: string;
  readonly email: string;
  readonly first_name: string | null;
  readonly nickname: string | null;
  readonly use_nickname: boolean;
  readonly app_role: AppRole;
}

export interface IAdminCoworkerOnboardingRow
  extends ICoworkerOnboardingRow {
  readonly email: string | null;
  readonly first_name: string | null;
  readonly nickname: string | null;
  readonly use_nickname: boolean;
  readonly private_document_count: number;
  readonly pending_private_action_count: number;
}

export interface IAdminCoworkerOnboardingDocumentRow {
  readonly assignment_id: string | null;
  readonly document_id: string;
  readonly source_version_id: string | null;
  readonly user_id: string;
  readonly title: string;
  readonly document_status: CoworkerDocumentLifecycleStatus;
  readonly default_action: CoworkerDocumentRequiredAction;
  readonly current_version_id: string | null;
  readonly version_number: number | null;
  readonly storage_path: string | null;
  readonly original_filename: string | null;
  readonly mime_type: string | null;
  readonly size_bytes: number | null;
  readonly source: CoworkerDocumentSource | null;
  readonly assignment_status: CoworkerDocumentAssignmentStatus | null;
  readonly signed_storage_path: string | null;
  readonly signed_original_filename: string | null;
  readonly signed_mime_type: string | null;
  readonly signed_size_bytes: number | null;
  readonly signed_declared_at: string | null;
  readonly signed_submitted_at: string | null;
  readonly acknowledged_at: string | null;
  readonly reviewed_at: string | null;
  readonly reviewed_by: string | null;
  readonly rejection_reason: string | null;
  readonly document_created_at: string;
  readonly assignment_created_at: string | null;
  readonly assignment_updated_at: string | null;
}

export interface IAdminSharedDocumentRow {
  readonly document_id: string;
  readonly title: string;
  readonly status: CoworkerDocumentLifecycleStatus;
  readonly assign_after_onboarding: boolean;
  readonly current_version_id: string | null;
  readonly version_number: number | null;
  readonly storage_path: string | null;
  readonly original_filename: string | null;
  readonly mime_type: string | null;
  readonly size_bytes: number | null;
  readonly source: CoworkerDocumentSource | null;
  readonly created_by: string;
  readonly created_at: string;
  readonly updated_at: string;
  readonly assignment_count: number;
  readonly pending_assignment_count: number;
  readonly acknowledged_assignment_count: number;
}

export interface IAdminSharedDocumentAssignmentRow {
  readonly assignment_id: string;
  readonly document_id: string;
  readonly source_version_id: string;
  readonly user_id: string;
  readonly email: string | null;
  readonly first_name: string | null;
  readonly nickname: string | null;
  readonly use_nickname: boolean;
  readonly onboarding_id: string | null;
  readonly required_action: CoworkerDocumentRequiredAction;
  readonly status: CoworkerDocumentAssignmentStatus;
  readonly version_number: number;
  readonly storage_path: string;
  readonly original_filename: string;
  readonly mime_type: string;
  readonly size_bytes: number;
  readonly acknowledged_at: string | null;
  readonly created_at: string;
  readonly updated_at: string;
}

export interface IAdminCoworkerOnboardingDocument
  extends Omit<
    IAdminCoworkerOnboardingDocumentRow,
    'storage_path' | 'signed_storage_path'
  > {}

export interface IAdminSharedDocument
  extends Omit<IAdminSharedDocumentRow, 'storage_path'> {}

export interface IAdminSharedDocumentAssignment
  extends Omit<IAdminSharedDocumentAssignmentRow, 'storage_path'> {}

export interface IAdminCoworkerOnboardingDetail {
  readonly onboarding: IAdminCoworkerOnboardingRow;
  readonly documents: readonly IAdminCoworkerOnboardingDocument[];
}

export interface IAdminPrivateDocumentUpload {
  readonly title: string;
  readonly requires_signed_upload: boolean;
  readonly file: File;
}

export interface IStartCoworkerOnboardingResult {
  readonly onboarding_id: string;
  readonly user_id: string;
  readonly status: CoworkerOnboardingLifecycleStatus;
  readonly started_at: string;
  readonly started_by: string;
  readonly created_at: string;
  readonly updated_at: string;
}

export interface IRegisterQuestionnairePrivateDocumentResult {
  readonly document_id: string;
  readonly version_id: string;
  readonly assignment_id: string;
  readonly replaced_storage_path: string | null;
  readonly document_created: boolean;
  readonly version_created: boolean;
}

export interface IRegisterAdminPrivateDocumentResult {
  readonly document_id: string;
  readonly version_id: string;
  readonly assignment_id: string;
  readonly title: string;
  readonly required_action: CoworkerDocumentRequiredAction;
  readonly assignment_status: CoworkerDocumentAssignmentStatus;
}

export interface IReviewCoworkerSignedSubmissionResult {
  readonly assignment_id: string;
  readonly document_id: string;
  readonly decision: CoworkerDocumentReviewDecision;
  readonly status: CoworkerDocumentAssignmentStatus;
  readonly reviewed_at: string;
  readonly reviewed_by: string;
  readonly rejection_reason: string | null;
  readonly signed_storage_path: string;
  readonly updated_at: string;
}

export interface ICompleteCoworkerOnboardingResult {
  readonly onboarding_id: string;
  readonly user_id: string;
  readonly status: CoworkerOnboardingLifecycleStatus;
  readonly completed_at: string;
  readonly completed_by: string;
  readonly shared_assignments_created: number;
  readonly already_completed: boolean;
}

export interface IRegisterSharedDocumentResult {
  readonly document_id: string;
  readonly version_id: string;
  readonly version_number: number;
  readonly document_created: boolean;
  readonly version_created: boolean;
  readonly assignments_created: number;
  readonly pending_assignments_revoked: number;
}

export interface IArchiveSharedDocumentResult {
  readonly document_id: string;
  readonly status: CoworkerDocumentLifecycleStatus;
  readonly pending_assignments_revoked: number;
  readonly already_archived: boolean;
  readonly updated_at: string;
}

export interface IRemovePrivateDocumentResult {
  readonly document_id: string;
  readonly removed_version_count: number;
  readonly removed_assignment_count: number;
  readonly storage_paths: readonly string[];
}
