import type { IAdminCoworkerOnboardingDocument } from '../../../core/interfaces/i-admin-coworker-onboarding';

export function getDocumentVersionId(document: IAdminCoworkerOnboardingDocument): string | null {
  return document.source_version_id ?? document.current_version_id;
}

export function isCurrentDocumentVersion(document: IAdminCoworkerOnboardingDocument): boolean {
  return document.current_version_id !== null &&
    getDocumentVersionId(document) === document.current_version_id;
}
