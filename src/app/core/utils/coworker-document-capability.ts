import {
  ICoworkerDocumentDefinition,
  ICoworkerPortalDocument,
} from '../interfaces/i-coworker-document';
import { CoworkerPortalRequirementStatus } from '../types/coworker-document';

export function getCoworkerDocumentCapability(
  definition: ICoworkerDocumentDefinition | null,
  documents: readonly ICoworkerPortalDocument[],
  document: ICoworkerPortalDocument | null,
  requirementStatus: CoworkerPortalRequirementStatus | null,
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
  const hasActiveUpload = document?.versions.some(
    (version) => version.status === 'reserved' || version.status === 'uploaded',
  ) ?? false;

  return {
    canAddDocument: requirementAllowsUpload &&
      definitionAllowsUpload &&
      document === null &&
      (definition.multiplicity === 'multiple' || documents.length === 0),
    canAddVersion: requirementAllowsUpload &&
      definitionAllowsUpload &&
      !hasActiveUpload &&
      document !== null &&
      (document.status === 'draft' ||
        document.status === 'rejected' ||
        document.status === 'withdrawn'),
    canSubmit: requirementAllowsUpload &&
      document?.status === 'draft' &&
      document.currentVersion?.status === 'ready',
    canWithdraw: requirementAllowsWithdraw &&
      document?.status === 'submitted',
  } as const;
}
