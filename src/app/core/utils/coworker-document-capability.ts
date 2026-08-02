import {
  ICoworkerDocumentDefinition,
  ICoworkerDocumentPortalSource,
  ICoworkerDocumentPortalSubmission,
  ICoworkerDocumentVersion,
} from '../interfaces/i-coworker-document';
import { CoworkerDocumentRequirementStatus } from '../types/coworker-document';

type CoworkerPortalDocument =
  | ICoworkerDocumentPortalSource
  | ICoworkerDocumentPortalSubmission;

export function canDownloadCoworkerDocumentVersion(
  version: ICoworkerDocumentVersion,
): boolean {
  return version.status === 'ready' || version.status === 'superseded';
}

export function getCoworkerDocumentCapability(
  definition: ICoworkerDocumentDefinition | null,
  documents: readonly CoworkerPortalDocument[],
  document: CoworkerPortalDocument | null,
  requirementStatus: CoworkerDocumentRequirementStatus | null,
) {
  const requirementAllowsUpload = requirementStatus === null ||
    requirementStatus === 'pending' ||
    requirementStatus === 'needs_correction';
  const requirementAllowsWithdraw = requirementStatus === null ||
    requirementStatus === 'submitted';
  const definitionAllowsUpload = definition !== null &&
    definition.isActive &&
    (definition.originPolicy === 'coworker_upload' ||
      definition.originPolicy === 'mixed');
  const hasActiveUpload = document?.currentVersion?.status === 'reserved' ||
    document?.currentVersion?.status === 'uploaded';
  const hasSubmission = documents.some(
    (candidate) => candidate.origin === 'coworker_upload',
  );
  const isSubmission = document?.origin === 'coworker_upload';
  const signatureAllowsSubmit =
    definition?.signaturePolicy.signatureRequired !== true ||
    document?.currentVersion?.signatureDeclarationType !== 'unsigned';

  return {
    canAddDocument: requirementAllowsUpload &&
      definitionAllowsUpload &&
      document === null &&
      !hasSubmission,
    canAddVersion: requirementAllowsUpload &&
      definitionAllowsUpload &&
      !hasActiveUpload &&
      isSubmission &&
      (document.status === 'draft' ||
        document.status === 'rejected' ||
        document.status === 'withdrawn'),
    canSubmit: requirementAllowsUpload &&
      isSubmission &&
      document.status === 'draft' &&
      document.currentVersion?.status === 'ready' &&
      signatureAllowsSubmit,
    canWithdraw: requirementAllowsWithdraw &&
      isSubmission &&
      document.status === 'submitted',
  } as const;
}
