import { assertPolicyDocument, mapEventPolicyDocument, samePolicyDocument } from '../../../../../core/factories/event-policy-form.factory';
import type { AdminEventPolicyDraft, AdminEventPolicyPreview, PolicyDocument } from '../../../../../core/interfaces/i-admin-event-policy';
import type { IEventCoreDetail } from '../../../../../core/interfaces/i-event-admin';
import { assertEdgeContract, readEdgeUuid } from '../../../../../core/utils/edge-contract';

export interface GlobalPolicyCommand {
  coreId: string;
  baseline: AdminEventPolicyDraft;
  document: PolicyDocument;
  confirmedRevision: number | null;
}

export type GlobalPolicyIssue = 'conflict' | 'baselineChanged';
export class EventGlobalPolicyError extends Error {
  constructor(readonly issue: GlobalPolicyIssue) { super(`[GLOBAL_POLICY] ${issue}`); }
}

export function assertPolicyRead(core: IEventCoreDetail, read: AdminEventPolicyDraft): void {
  assertEdgeContract(read.coreId === core.id && read.canonicalBaseline.coreId === core.id &&
    read.canonicalBaseline.coreKey === core.key && read.appliedToPublic === false &&
    read.canonicalBaseline.editions.some(row => row.editionId === read.canonicalBaseline.mainEditionId && row.isMain) &&
    /^[0-9a-f]{32}$/.test(read.baselineFingerprint) && typeof read.baselineChanged === 'boolean' &&
    (read.hasDraft === true ? Number.isInteger(read.revision) && read.revision > 0 && read.document !== null
      : read.hasDraft === false && read.revision === 0 && read.document === null && read.baselineChanged === false),
  'policyDraft', 'the authoritative draft revision, current baseline fingerprint and explicit draft branch');
  const document = mapEventPolicyDocument(read);
  let editionIds = read.canonicalBaseline.editions.map(row => row.editionId);
  if (read.hasDraft && read.baselineChanged) {
    assertEdgeContract(Array.isArray(document.cityOverrides), 'policyDraft.document.cityOverrides', 'an array of historical Edition overrides');
    editionIds = document.cityOverrides.map(row => readEdgeUuid(row.editionId, 'policyDraft.document.cityOverrides.editionId'));
  }
  assertPolicyDocument(document, editionIds);
}

export function assertPolicyPreview(preview: AdminEventPolicyPreview, command: GlobalPolicyCommand): void {
  assertEdgeContract(preview.coreId === command.coreId && preview.requiresEfs050OptionalCapacityAmendment === false &&
    preview.appliedToPublic === false && preview.appliedToParticipantRegistration === false &&
    Array.isArray(preview.fieldErrors) && Array.isArray(preview.blockers) &&
    ((preview.valid === true && preview.status === 'draft_ready' && !preview.fieldErrors.length && !preview.blockers.length) ||
      (preview.valid === false && (preview.status === 'invalid' || preview.status === 'blocked'))),
  'policyPreview', 'an explicit draft preview without publication or participant registration');
  if ('normalizedDocument' in preview) {
    assertEdgeContract(preview.mainEditionId === command.baseline.canonicalBaseline.mainEditionId,
      'policyPreview', 'the same main Edition as the edit baseline');
    assertPolicyDocument(preview.normalizedDocument, command.baseline.canonicalBaseline.editions.map(row => row.editionId));
    if (preview.baselineFingerprint !== command.baseline.baselineFingerprint ||
      !samePolicyDocument(preview.normalizedDocument, command.document)) throw new EventGlobalPolicyError('conflict');
  } else {
    assertEdgeContract(preview.status === 'invalid' && preview.participantSignupOpened === false,
      'policyPreview', 'the short normalization failure');
  }
}

export function samePolicyBaseline(left: AdminEventPolicyDraft, right: AdminEventPolicyDraft): boolean {
  return !right.baselineChanged && left.revision === right.revision && left.hasDraft === right.hasDraft &&
    left.baselineFingerprint === right.baselineFingerprint && samePolicyDocument(mapEventPolicyDocument(left), mapEventPolicyDocument(right));
}

export function matchesPolicySave(read: AdminEventPolicyDraft, command: GlobalPolicyCommand): boolean {
  return read.hasDraft && !read.baselineChanged && read.revision === command.baseline.revision + 1 &&
    (command.confirmedRevision === null || read.revision === command.confirmedRevision) &&
    read.baselineFingerprint === command.baseline.baselineFingerprint && samePolicyDocument(read.document, command.document);
}
