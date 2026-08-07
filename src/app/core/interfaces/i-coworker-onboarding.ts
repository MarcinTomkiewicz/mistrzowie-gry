import type {
  CoworkerDocumentAssignmentStatus,
  CoworkerDocumentLifecycleStatus,
  CoworkerDocumentRequiredAction,
  CoworkerDocumentSource,
  CoworkerOnboardingLifecycleStatus,
} from '../types/coworker-onboarding';

export interface ICoworkerOnboardingRow {
  readonly onboarding_id: string;
  readonly user_id: string;
  readonly status: CoworkerOnboardingLifecycleStatus;
  readonly started_at: string;
  readonly started_by: string;
  readonly completed_at: string | null;
  readonly completed_by: string | null;
  readonly cancelled_at: string | null;
  readonly cancelled_by: string | null;
  readonly created_at: string;
  readonly updated_at: string;
}

export interface ICoworkerPrivateDocumentRow {
  readonly assignment_id: string;
  readonly document_id: string;
  readonly onboarding_id: string;
  readonly source_version_id: string;
  readonly title: string;
  readonly document_status: CoworkerDocumentLifecycleStatus;
  readonly required_action: CoworkerDocumentRequiredAction;
  readonly assignment_status: CoworkerDocumentAssignmentStatus;
  readonly version_number: number;
  readonly storage_path: string;
  readonly original_filename: string;
  readonly mime_type: string;
  readonly size_bytes: number;
  readonly source: CoworkerDocumentSource;
  readonly signed_storage_path: string | null;
  readonly signed_original_filename: string | null;
  readonly signed_mime_type: string | null;
  readonly signed_size_bytes: number | null;
  readonly signed_declared_at: string | null;
  readonly signed_submitted_at: string | null;
  readonly reviewed_at: string | null;
  readonly rejection_reason: string | null;
  readonly created_at: string;
  readonly updated_at: string;
}

export interface ICoworkerSharedDocumentRow {
  readonly assignment_id: string;
  readonly document_id: string;
  readonly onboarding_id: string | null;
  readonly source_version_id: string;
  readonly title: string;
  readonly document_status: CoworkerDocumentLifecycleStatus;
  readonly required_action: CoworkerDocumentRequiredAction;
  readonly assignment_status: CoworkerDocumentAssignmentStatus;
  readonly version_number: number;
  readonly storage_path: string;
  readonly original_filename: string;
  readonly mime_type: string;
  readonly size_bytes: number;
  readonly source: CoworkerDocumentSource;
  readonly acknowledged_at: string | null;
  readonly created_at: string;
  readonly updated_at: string;
}

export interface IRegisterCoworkerSignedSubmissionResult {
  readonly assignment_id: string;
  readonly document_id: string;
  readonly status: CoworkerDocumentAssignmentStatus;
  readonly signed_storage_path: string;
  readonly replaced_signed_storage_path: string | null;
  readonly signed_submitted_at: string;
  readonly updated_at: string;
}

export interface IAcknowledgeCoworkerDocumentsResult {
  readonly requested_count: number;
  readonly acknowledged_now_count: number;
  readonly already_acknowledged_count: number;
  readonly acknowledged_at: string;
}
