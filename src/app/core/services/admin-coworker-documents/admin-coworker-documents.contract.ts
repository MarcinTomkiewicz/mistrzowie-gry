import {
  IAdminCoworkerDocumentDefinition,
  IAdminCoworkerDocumentsDashboard,
  IAdminCoworkerOnboardingResult,
  IAdminCoworkerSeedResult,
} from '../../interfaces/i-admin-coworker-document';
import { APP_ROLES } from '../../types/app-role';
import { ADMIN_COWORKER_DOCUMENT_ACTION } from '../../types/admin-coworker-document';
import { COWORKER_PORTAL_DOCUMENT_STATUSES } from '../../types/coworker-document';
import { EdgeReader } from '../../types/edge-contract';
import {
  createEdgeArrayReader,
  createEdgeLiteralReader,
  createEdgeObjectReader,
  readEdgeBoolean,
  readEdgeInteger,
  readEdgeNullableString,
  readEdgeNullableTimestamp,
  readEdgeString,
  readEdgeTimestamp,
  readEdgeUuid,
} from '../../utils/edge-contract';
import {
  coworkerActiveOnboardingCaseReader,
  coworkerDocumentDefinitionFieldReaders,
  coworkerSignaturePolicyReader,
} from '../coworker-documents/coworker-document-readers';

const trueReader = createEdgeLiteralReader([true] as const);

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

export function parseAdminCoworkerDocumentsDashboard(
  value: unknown,
): IAdminCoworkerDocumentsDashboard {
  return dashboardReader(value, 'response');
}
