import {
  ICoworkerDocumentPortalResponse,
  ICoworkerDocumentPortalSource,
  ICoworkerDocumentPortalSubmission,
  ICoworkerDocumentRequirement,
  ICoworkerVersionDownload,
} from '../../interfaces/i-coworker-document';
import {
  COWORKER_DOCUMENT_ACTION,
  COWORKER_DOCUMENT_REQUIREMENT_STATUSES,
  COWORKER_DOCUMENT_STATUSES,
} from '../../types/coworker-document';
import { EdgeReader } from '../../types/edge-contract';
import {
  assertEdgeContract,
  createEdgeArrayReader,
  createEdgeLiteralReader,
  createEdgeNullableReader,
  readEdgeBoolean,
  readEdgeNonNegativeInteger,
  readEdgeNullableString,
  readEdgeNullableTimestamp,
  readEdgeObject,
  readEdgeTimestamp,
  readEdgeUuid,
} from '../../utils/edge-contract';
import { createStrictEdgeObjectReader } from '../../utils/strict-edge-contract';
import {
  coworkerDocumentDefinitionReader,
  coworkerOnboardingCaseReader,
  createCoworkerDocumentVersionReader,
  documentVersionDownloadReader,
  notificationReader,
} from './coworker-document-readers';

const nullableUuidReader = createEdgeNullableReader(readEdgeUuid);
const statusesRequiringSubmittedVersion = new Set([
  'submitted',
  'under_review',
  'accepted',
  'rejected',
]);

export const coworkerDocumentPortalSourceReader:
  EdgeReader<ICoworkerDocumentPortalSource> = (value, path) => {
    const source = readEdgeObject(value, path);
    const documentId = readEdgeUuid(source['id'], `${path}.id`);
    return createStrictEdgeObjectReader({
      id: readEdgeUuid,
      origin: createEdgeLiteralReader(
        ['system_generated', 'admin_upload'] as const,
      ),
      title: readEdgeNullableString,
      status: createEdgeLiteralReader(COWORKER_DOCUMENT_STATUSES),
      currentVersion: createEdgeNullableReader(
        createCoworkerDocumentVersionReader(documentId),
      ),
      historyCount: readEdgeNonNegativeInteger,
    })(source, path);
  };

export const coworkerDocumentPortalSubmissionReader:
  EdgeReader<ICoworkerDocumentPortalSubmission> = (value, path) => {
    const source = readEdgeObject(value, path);
    const documentId = readEdgeUuid(source['id'], `${path}.id`);
    const submission = createStrictEdgeObjectReader({
      id: readEdgeUuid,
      origin: createEdgeLiteralReader(['coworker_upload'] as const),
      title: readEdgeNullableString,
      status: createEdgeLiteralReader(COWORKER_DOCUMENT_STATUSES),
      currentVersion: createEdgeNullableReader(
        createCoworkerDocumentVersionReader(documentId),
      ),
      submittedVersionId: nullableUuidReader,
      historyCount: readEdgeNonNegativeInteger,
    })(source, path);

    assertEdgeContract(
      !statusesRequiringSubmittedVersion.has(submission.status) ||
        submission.submittedVersionId !== null,
      `${path}.submittedVersionId`,
      'a UUID for a submitted or reviewed document',
    );
    return submission;
  };

export const coworkerDocumentRequirementReader:
  EdgeReader<ICoworkerDocumentRequirement> = (value, path) => {
    const requirement = createStrictEdgeObjectReader({
      id: readEdgeUuid,
      onboardingCaseId: nullableUuidReader,
      status: createEdgeLiteralReader(COWORKER_DOCUMENT_REQUIREMENT_STATUSES),
      required: readEdgeBoolean,
      dueAt: readEdgeNullableTimestamp,
      fulfilledByDocumentId: nullableUuidReader,
      fulfilledAt: readEdgeNullableTimestamp,
      waivedAt: readEdgeNullableTimestamp,
      waiverReason: readEdgeNullableString,
      documentDefinition: coworkerDocumentDefinitionReader,
      sourceDocument: createEdgeNullableReader(
        coworkerDocumentPortalSourceReader,
      ),
      submissionDocument: createEdgeNullableReader(
        coworkerDocumentPortalSubmissionReader,
      ),
      createdAt: readEdgeTimestamp,
      updatedAt: readEdgeTimestamp,
    })(value, path);

    assertRequirement(requirement, path);
    return requirement;
  };

const portalReader: EdgeReader<ICoworkerDocumentPortalResponse> =
  createStrictEdgeObjectReader({
    userId: readEdgeUuid,
    access: createStrictEdgeObjectReader({
      enabled: readEdgeBoolean,
      grantedAt: readEdgeNullableTimestamp,
      grantedViaRole: readEdgeBoolean,
    }),
    activeOnboardingCase: createEdgeNullableReader(
      coworkerOnboardingCaseReader,
    ),
    requirements: createEdgeArrayReader(coworkerDocumentRequirementReader),
    documentCatalog: createEdgeArrayReader(coworkerDocumentDefinitionReader),
    notifications: createEdgeArrayReader(notificationReader),
    unreadNotificationCount: readEdgeNonNegativeInteger,
    viewer: createStrictEdgeObjectReader({
      actorUserId: readEdgeUuid,
      isAdmin: readEdgeBoolean,
    }),
  });

export function parseCoworkerDocumentPortalResponse(
  value: unknown,
): ICoworkerDocumentPortalResponse {
  const portal = portalReader(value, 'response');
  assertEdgeContract(
    portal.viewer.actorUserId === portal.userId &&
      (portal.activeOnboardingCase === null ||
        portal.activeOnboardingCase.userId === portal.userId) &&
      isUnique(portal.requirements.map((requirement) => requirement.id)) &&
      isUnique(portal.documentCatalog.map((definition) => definition.id)) &&
      isUnique(portal.documentCatalog.map((definition) => definition.code)) &&
      isUnique(portal.notifications.map((notification) => notification.id)),
    'response',
    'consistent viewer/onboarding identity and unique portal collections',
  );
  return portal;
}

export function createDocumentDownloadResponseReader(
  documentVersionId: string,
): EdgeReader<ICoworkerVersionDownload> {
  return (value, path) => {
    const response = createStrictEdgeObjectReader({
      ok: createEdgeLiteralReader([true] as const),
      action: createEdgeLiteralReader([
        COWORKER_DOCUMENT_ACTION.downloadDocumentVersion,
      ] as const),
      download: documentVersionDownloadReader,
    })(value, path);
    assertEdgeContract(
      response.download.documentVersionId === documentVersionId,
      `${path}.download.documentVersionId`,
      `the requested version id ${documentVersionId}`,
    );
    return { download: response.download };
  };
}

function assertRequirement(
  requirement: ICoworkerDocumentRequirement,
  path: string,
): void {
  const { sourceDocument, submissionDocument } = requirement;
  assertEdgeContract(
    (sourceDocument === null || submissionDocument === null ||
      sourceDocument.id !== submissionDocument.id) &&
      (requirement.fulfilledByDocumentId === null ||
        requirement.fulfilledByDocumentId === submissionDocument?.id) &&
      (requirement.status !== 'fulfilled' ||
        (submissionDocument !== null &&
          requirement.fulfilledByDocumentId !== null &&
          requirement.fulfilledAt !== null)) &&
      (requirement.status !== 'waived' ||
        (requirement.waivedAt !== null && requirement.waiverReason !== null)),
    path,
    'a valid requirement source, submission, fulfillment and waiver state',
  );
}

function isUnique(values: readonly string[]): boolean {
  return new Set(values).size === values.length;
}
