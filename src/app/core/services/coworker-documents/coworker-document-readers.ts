import {
  ICoworkerActiveOnboardingCase,
  ICoworkerSignaturePolicy,
} from '../../interfaces/i-coworker-document';
import {
  COWORKER_ACTIVE_ONBOARDING_STATUSES,
  COWORKER_DOCUMENT_MULTIPLICITIES,
  COWORKER_DOCUMENT_ORIGIN_POLICIES,
  COWORKER_SIGNATURE_DECLARATION_TYPES,
} from '../../types/coworker-document';
import { EdgeReader } from '../../types/edge-contract';
import {
  createEdgeArrayReader,
  createEdgeLiteralReader,
  createEdgeObjectReader,
  readEdgeBoolean,
  readEdgeInteger,
  readEdgeNullableInteger,
  readEdgeNullableString,
  readEdgeNullableTimestamp,
  readEdgeString,
  readEdgeTimestamp,
  readEdgeUuid,
} from '../../utils/edge-contract';

export const coworkerSignaturePolicyReader:
  EdgeReader<ICoworkerSignaturePolicy> = createEdgeObjectReader({
    id: readEdgeUuid,
    code: readEdgeString,
    name: readEdgeString,
    description: readEdgeNullableString,
    signatureRequired: readEdgeBoolean,
    allowedDeclarationTypes: createEdgeArrayReader(
      createEdgeLiteralReader(COWORKER_SIGNATURE_DECLARATION_TYPES),
    ),
    manualReviewRequired: readEdgeBoolean,
    automaticVerificationMode: readEdgeString,
    isActive: readEdgeBoolean,
  });

export const coworkerDocumentDefinitionFieldReaders = {
  id: readEdgeUuid,
  code: readEdgeString,
  title: readEdgeString,
  description: readEdgeNullableString,
  category: readEdgeString,
  originPolicy: createEdgeLiteralReader(COWORKER_DOCUMENT_ORIGIN_POLICIES),
  multiplicity: createEdgeLiteralReader(COWORKER_DOCUMENT_MULTIPLICITIES),
  isRequiredByDefault: readEdgeBoolean,
  allowedMimeTypes: createEdgeArrayReader(readEdgeString),
  allowedExtensions: createEdgeArrayReader(readEdgeString),
  maxSizeBytes: readEdgeInteger,
  retentionDays: readEdgeNullableInteger,
  isActive: readEdgeBoolean,
  activeFrom: readEdgeNullableTimestamp,
  activeUntil: readEdgeNullableTimestamp,
  createdAt: readEdgeTimestamp,
  updatedAt: readEdgeTimestamp,
} as const;

export const coworkerActiveOnboardingCaseReader:
  EdgeReader<ICoworkerActiveOnboardingCase> = createEdgeObjectReader({
    id: readEdgeUuid,
    userId: readEdgeUuid,
    status: createEdgeLiteralReader(COWORKER_ACTIVE_ONBOARDING_STATUSES),
    openedAt: readEdgeTimestamp,
    submittedAt: readEdgeNullableTimestamp,
    reviewStartedAt: readEdgeNullableTimestamp,
    needsCorrectionAt: readEdgeNullableTimestamp,
    approvedAt: readEdgeNullableTimestamp,
    suspendedAt: readEdgeNullableTimestamp,
    closedAt: readEdgeNullableTimestamp,
    revision: readEdgeInteger,
    createdAt: readEdgeTimestamp,
    updatedAt: readEdgeTimestamp,
  });
