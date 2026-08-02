import {
  IAdminCoworkerDocumentsDashboard,
  IAdminCoworkerOnboardingResult,
  IAdminCoworkerRequirementResult,
  IAdminCoworkerSeedResult,
} from '../../interfaces/i-admin-coworker-document';
import { ICoworkerDocumentDefinition } from '../../interfaces/i-coworker-document';
import {
  ADMIN_COWORKER_DOCUMENT_ACTION,
  AdminCoworkerDocumentDefinitionPayload,
  AdminCoworkerRequirementPayload,
} from '../../types/admin-coworker-document';
import { COWORKER_DOCUMENT_REQUIREMENT_STATUSES } from '../../types/coworker-document';
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
  readEdgePositiveInteger,
  readEdgeString,
  readEdgeTimestamp,
  readEdgeUuid,
} from '../../utils/edge-contract';
import { createStrictEdgeObjectReader } from '../../utils/strict-edge-contract';
import {
  coworkerDocumentDefinitionReader,
  coworkerOnboardingCaseReader,
  coworkerSignaturePolicyReader,
} from '../coworker-documents/coworker-document-readers';

const nullableUuidReader = createEdgeNullableReader(readEdgeUuid);

const reviewQueueItemReader = createStrictEdgeObjectReader({
  userId: readEdgeUuid,
  displayName: readEdgeString,
  email: readEdgeString,
  documentId: readEdgeUuid,
  documentTitle: readEdgeNullableString,
  documentDefinitionId: readEdgeUuid,
  documentDefinitionCode: readEdgeString,
  documentDefinitionTitle: readEdgeString,
  status: createEdgeLiteralReader(['submitted', 'under_review'] as const),
  submittedVersionId: readEdgeUuid,
  submittedAt: readEdgeTimestamp,
  reviewStartedAt: readEdgeNullableTimestamp,
  revision: readEdgePositiveInteger,
  updatedAt: readEdgeTimestamp,
});

const dashboardReader: EdgeReader<IAdminCoworkerDocumentsDashboard> =
  createStrictEdgeObjectReader({
    ok: createEdgeLiteralReader([true] as const),
    catalog: createStrictEdgeObjectReader({
      signaturePolicies: createEdgeArrayReader(coworkerSignaturePolicyReader),
      documentDefinitions: createEdgeArrayReader(
        coworkerDocumentDefinitionReader,
      ),
    }),
    reviewQueue: createEdgeArrayReader(reviewQueueItemReader),
  });

export function parseAdminCoworkerDocumentsDashboard(
  value: unknown,
): IAdminCoworkerDocumentsDashboard {
  const dashboard = dashboardReader(value, 'response');
  assertEdgeContract(
    new Set(dashboard.reviewQueue.map((item) => item.documentId)).size ===
      dashboard.reviewQueue.length,
    'response.reviewQueue',
    'unique document ids',
  );
  return dashboard;
}

export function createSavedDefinitionReader(
  request: AdminCoworkerDocumentDefinitionPayload,
): EdgeReader<ICoworkerDocumentDefinition> {
  return (value, path) => {
    const response = createStrictEdgeObjectReader({
      ok: createEdgeLiteralReader([true] as const),
      action: createEdgeLiteralReader([
        ADMIN_COWORKER_DOCUMENT_ACTION.saveDefinition,
      ] as const),
      definition: coworkerDocumentDefinitionReader,
    })(value, path);
    assertEdgeContract(
      (request.id === null || response.definition.id === request.id) &&
        response.definition.code === request.code &&
        response.definition.title === request.title,
      `${path}.definition`,
      'the saved definition identity',
    );
    return response.definition;
  };
}

export function createEnsureOnboardingReader(
  userId: string,
): EdgeReader<IAdminCoworkerOnboardingResult> {
  return (value, path) => {
    const response = createStrictEdgeObjectReader({
      ok: createEdgeLiteralReader([true] as const),
      action: createEdgeLiteralReader([
        ADMIN_COWORKER_DOCUMENT_ACTION.ensureOnboarding,
      ] as const),
      result: createStrictEdgeObjectReader({
        created: readEdgeBoolean,
        case: coworkerOnboardingCaseReader,
      }),
    })(value, path);
    assertEdgeContract(
      response.result.case.userId === userId,
      `${path}.result.case.userId`,
      `the requested user id ${userId}`,
    );
    return response.result;
  };
}

export function createSeedRequirementsReader(
  userId: string,
  onboardingCaseId: string,
): EdgeReader<IAdminCoworkerSeedResult> {
  return (value, path) => {
    const response = createStrictEdgeObjectReader({
      ok: createEdgeLiteralReader([true] as const),
      action: createEdgeLiteralReader([
        ADMIN_COWORKER_DOCUMENT_ACTION.seedDefaultRequirements,
      ] as const),
      result: createStrictEdgeObjectReader({
        userId: readEdgeUuid,
        onboardingCaseId: readEdgeUuid,
        insertedCount: readEdgeNonNegativeInteger,
      }),
    })(value, path);
    assertEdgeContract(
      response.result.userId === userId &&
        response.result.onboardingCaseId === onboardingCaseId,
      `${path}.result`,
      'the requested user and onboarding case identity',
    );
    return response.result;
  };
}

export function createAssignedRequirementReader(
  request: AdminCoworkerRequirementPayload,
): EdgeReader<IAdminCoworkerRequirementResult> {
  return (value, path) => {
    const response = createStrictEdgeObjectReader({
      ok: createEdgeLiteralReader([true] as const),
      action: createEdgeLiteralReader([
        ADMIN_COWORKER_DOCUMENT_ACTION.assignRequirement,
      ] as const),
      requirement: createStrictEdgeObjectReader({
        id: readEdgeUuid,
        userId: readEdgeUuid,
        onboardingCaseId: nullableUuidReader,
        documentDefinitionId: readEdgeUuid,
        status: createEdgeLiteralReader(
          COWORKER_DOCUMENT_REQUIREMENT_STATUSES,
        ),
        required: readEdgeBoolean,
        dueAt: readEdgeNullableTimestamp,
        fulfilledByDocumentId: nullableUuidReader,
        fulfilledAt: readEdgeNullableTimestamp,
        waivedAt: readEdgeNullableTimestamp,
        waiverReason: readEdgeNullableString,
        createdAt: readEdgeTimestamp,
        updatedAt: readEdgeTimestamp,
      }),
    })(value, path);
    const requirement = response.requirement;
    assertEdgeContract(
      requirement.userId === request.userId &&
        requirement.onboardingCaseId === request.onboardingCaseId &&
        requirement.documentDefinitionId === request.documentDefinitionId,
      `${path}.requirement`,
      'the assigned user, onboarding case and definition identity',
    );
    return requirement;
  };
}
