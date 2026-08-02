import {
  ICoworkerDocumentDefinition,
  ICoworkerDocumentPortalSubmission,
  ICoworkerDocumentVersion,
} from '../interfaces/i-coworker-document';
import { CoworkerDocumentRequirementStatus } from '../types/coworker-document';

export function canDownloadCoworkerDocumentVersion(
  version: ICoworkerDocumentVersion,
): boolean {
  return version.status === 'ready' || version.status === 'superseded';
}

export function canCoworkerUploadDocumentDefinition(
  definition: ICoworkerDocumentDefinition,
): boolean {
  return definition.isActive &&
    (definition.originPolicy === 'coworker_upload' ||
      definition.originPolicy === 'mixed');
}

export function getCoworkerDocumentCapability(
  definition: ICoworkerDocumentDefinition,
  document: ICoworkerDocumentPortalSubmission | null,
  requirementStatus: CoworkerDocumentRequirementStatus,
) {
  const requirementAllowsUpload = requirementStatus === 'pending' ||
    requirementStatus === 'needs_correction';
  const requirementAllowsWithdraw = requirementStatus === 'submitted';
  const definitionAllowsUpload =
    canCoworkerUploadDocumentDefinition(definition);
  const hasActiveUpload = document?.currentVersion?.status === 'reserved' ||
    document?.currentVersion?.status === 'uploaded';
  const signatureAllowsSubmit =
    !definition.signaturePolicy.signatureRequired ||
    document?.currentVersion?.signatureDeclarationType !== 'unsigned';

  return {
    canAddDocument: requirementAllowsUpload &&
      definitionAllowsUpload &&
      document === null,
    canAddVersion: requirementAllowsUpload &&
      definitionAllowsUpload &&
      document !== null &&
      !hasActiveUpload &&
      (document.status === 'draft' ||
        document.status === 'rejected' ||
        document.status === 'withdrawn'),
    canSubmit: requirementAllowsUpload &&
      document !== null &&
      document.status === 'draft' &&
      document.currentVersion?.status === 'ready' &&
      signatureAllowsSubmit,
    canWithdraw: requirementAllowsWithdraw &&
      document !== null &&
      document.status === 'submitted',
  } as const;
}
