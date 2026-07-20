import {
  IAdminCoworkerDocumentDefinition,
  IAdminCoworkerDocumentReviewDetail,
  IAdminCoworkerDocumentsDashboard,
  IAdminCoworkerOnboardingResult,
  IAdminCoworkerSeedResult,
  IAdminCoworkerVersionDownload,
} from '../../interfaces/i-admin-coworker-document';
import { APP_ROLES } from '../../types/app-role';
import {
  ADMIN_COWORKER_DOCUMENT_ACTION,
  ADMIN_COWORKER_DOWNLOAD_PURPOSES,
  ADMIN_COWORKER_REVIEW_DECISIONS,
} from '../../types/admin-coworker-document';
import {
  COWORKER_PORTAL_DOCUMENT_STATUSES,
  COWORKER_DOCUMENT_REQUIREMENT_STATUSES,
} from '../../types/coworker-document';
import { EdgeReader } from '../../types/edge-contract';
import {
  createEdgeArrayReader,
  createEdgeLiteralReader,
  createEdgeNullableReader,
  createEdgeObjectReader,
  readEdgeBoolean,
  readEdgeInteger,
  readEdgeNullableString,
  readEdgeNullableTimestamp,
  readEdgeObject,
  readEdgeString,
  readEdgeTimestamp,
  readEdgeUuid,
} from '../../utils/edge-contract';
import {
  coworkerActiveOnboardingCaseReader,
  coworkerDocumentReader,
  coworkerDocumentDefinitionReader,
  coworkerDocumentDefinitionFieldReaders,
  coworkerPortalDocumentReader,
  coworkerSignaturePolicyReader,
  documentVersionDownloadFieldReaders,
  signatureVerificationFieldReaders,
} from '../coworker-documents/coworker-document-readers';

const trueReader = createEdgeLiteralReader([true] as const);
const nullableUuidReader = createEdgeNullableReader(readEdgeUuid);

const definitionReader: EdgeReader<IAdminCoworkerDocumentDefinition> =
  createEdgeObjectReader({
    ...coworkerDocumentDefinitionFieldReaders,
    signaturePolicyCode: readEdgeString,
  });

const coworkerReader = createEdgeObjectReader({
  userId: readEdgeUuid,
  displayName: readEdgeString,
  email: readEdgeString,
  appRole: createEdgeLiteralReader(APP_ROLES),
  accessEnabled: readEdgeBoolean,
});

const reviewQueueItemReader = createEdgeObjectReader({
  userId: readEdgeUuid,
  displayName: readEdgeString,
  email: readEdgeString,
  documentId: readEdgeUuid,
  documentTitle: readEdgeNullableString,
  documentDefinitionId: readEdgeUuid,
  documentDefinitionCode: readEdgeString,
  documentDefinitionTitle: readEdgeString,
  status: createEdgeLiteralReader(COWORKER_PORTAL_DOCUMENT_STATUSES),
  currentVersionId: readEdgeUuid,
  submittedAt: readEdgeTimestamp,
  reviewStartedAt: readEdgeNullableTimestamp,
  revision: readEdgeInteger,
  updatedAt: readEdgeTimestamp,
});

const dashboardReader: EdgeReader<IAdminCoworkerDocumentsDashboard> =
  createEdgeObjectReader({
    ok: trueReader,
    catalog: createEdgeObjectReader({
      signaturePolicies: createEdgeArrayReader(coworkerSignaturePolicyReader),
      documentDefinitions: createEdgeArrayReader(definitionReader),
      coworkers: createEdgeArrayReader(coworkerReader),
    }),
    reviewQueue: createEdgeArrayReader(reviewQueueItemReader),
  });

const ensureOnboardingResponseReader = createEdgeObjectReader({
  ok: trueReader,
  action: createEdgeLiteralReader([
    ADMIN_COWORKER_DOCUMENT_ACTION.ensureOnboarding,
  ] as const),
  result: createEdgeObjectReader({
    created: readEdgeBoolean,
    case: coworkerActiveOnboardingCaseReader,
  }),
});

export const ensureOnboardingReader: EdgeReader<IAdminCoworkerOnboardingResult> =
  (value, path) => ensureOnboardingResponseReader(value, path).result;

const seedDefaultRequirementsResponseReader = createEdgeObjectReader({
  ok: trueReader,
  action: createEdgeLiteralReader([
    ADMIN_COWORKER_DOCUMENT_ACTION.seedDefaultRequirements,
  ] as const),
  result: createEdgeObjectReader({
    userId: readEdgeUuid,
    onboardingCaseId: readEdgeUuid,
    insertedCount: readEdgeInteger,
  }),
});

export const seedDefaultRequirementsReader: EdgeReader<IAdminCoworkerSeedResult> =
  (value, path) => seedDefaultRequirementsResponseReader(value, path).result;

const reviewDetailReader: EdgeReader<IAdminCoworkerDocumentReviewDetail> =
  createEdgeObjectReader({
    user: createEdgeObjectReader({
      userId: readEdgeUuid,
      email: readEdgeString,
      firstName: readEdgeNullableString,
      appRole: createEdgeLiteralReader(APP_ROLES),
    }),
    documentDefinition: coworkerDocumentDefinitionReader,
    requirement: createEdgeNullableReader(
      createEdgeObjectReader({
        id: readEdgeUuid,
        onboardingCaseId: nullableUuidReader,
        status: createEdgeLiteralReader(COWORKER_DOCUMENT_REQUIREMENT_STATUSES),
        required: readEdgeBoolean,
        dueAt: readEdgeNullableTimestamp,
        fulfilledByDocumentId: nullableUuidReader,
        fulfilledAt: readEdgeNullableTimestamp,
        waivedAt: readEdgeNullableTimestamp,
        waiverReason: readEdgeNullableString,
        createdAt: readEdgeTimestamp,
        updatedAt: readEdgeTimestamp,
      }),
    ),
    document: coworkerDocumentReader,
    signatureVerifications: createEdgeArrayReader(
      createEdgeObjectReader({
        ...signatureVerificationFieldReaders,
        documentVersionId: readEdgeUuid,
        actorUserId: nullableUuidReader,
        providerName: readEdgeNullableString,
        providerReference: readEdgeNullableString,
        details: readEdgeObject,
      }),
    ),
    reviews: createEdgeArrayReader(
      createEdgeObjectReader({
        id: readEdgeUuid,
        documentVersionId: readEdgeUuid,
        decision: createEdgeLiteralReader(ADMIN_COWORKER_REVIEW_DECISIONS),
        signatureVerificationId: nullableUuidReader,
        rejectionReason: readEdgeNullableString,
        note: readEdgeNullableString,
        reviewedBy: readEdgeUuid,
        reviewedAt: readEdgeTimestamp,
        createdAt: readEdgeTimestamp,
      }),
    ),
  });

const reviewDetailResponseReader = createEdgeObjectReader({
  ok: trueReader,
  action: createEdgeLiteralReader([
    ADMIN_COWORKER_DOCUMENT_ACTION.getReviewDetail,
  ] as const),
  detail: reviewDetailReader,
});

export const adminCoworkerReviewDetailReader:
  EdgeReader<IAdminCoworkerDocumentReviewDetail> =
    (value, path) => reviewDetailResponseReader(value, path).detail;

export const adminCoworkerDocumentDownloadReader:
  EdgeReader<IAdminCoworkerVersionDownload> = createEdgeObjectReader({
    ok: trueReader,
    action: createEdgeLiteralReader([
      ADMIN_COWORKER_DOCUMENT_ACTION.downloadDocumentVersion,
    ] as const),
    download: createEdgeObjectReader({
      ...documentVersionDownloadFieldReaders,
      purpose: createEdgeLiteralReader(ADMIN_COWORKER_DOWNLOAD_PURPOSES),
    }),
  });

export function parseAdminCoworkerDocumentsDashboard(
  value: unknown,
): IAdminCoworkerDocumentsDashboard {
  return dashboardReader(value, 'response');
}
