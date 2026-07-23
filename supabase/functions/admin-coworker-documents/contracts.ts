import {
  createContractReaders,
  type UnknownObject,
} from "../_shared/coworker-document-edge/contract-readers.ts";

export type { UnknownObject } from "../_shared/coworker-document-edge/contract-readers.ts";

export const RPC = {
  getCatalog: "get_admin_coworker_document_catalog",
  saveDefinition: "save_admin_coworker_document_definition",
  ensureOnboarding: "ensure_admin_coworker_onboarding_case",
  seedDefaultRequirements: "seed_admin_coworker_default_requirements",
  assignRequirement: "assign_admin_coworker_document_requirement",
  getReviewQueue: "get_admin_coworker_document_review_queue",
  getReviewDetail: "get_admin_coworker_document_review_detail",
  startReview: "start_admin_coworker_document_review",
  verifySignature: "record_admin_coworker_signature_verification",
  acceptDocument: "accept_admin_coworker_document",
  rejectDocument: "reject_admin_coworker_document",
  getDownloadTarget: "get_coworker_document_download_target",
} as const;

export type RpcName = typeof RPC[keyof typeof RPC];

export type OriginPolicy =
  | "coworker_upload"
  | "admin_upload"
  | "system_generated"
  | "mixed";

export type Multiplicity = "single" | "multiple" | "versioned_single";

export type VerificationStatus =
  | "confirmed"
  | "rejected"
  | "indeterminate"
  | "unsupported";

export type AdminDownloadPurpose = "admin_review" | "admin_download";

export interface DocumentDefinitionPayload {
  id: string | null;
  code: string;
  title: string;
  description: string | null;
  category: string;
  originPolicy: OriginPolicy;
  multiplicity: Multiplicity;
  isRequiredByDefault: boolean;
  signaturePolicyCode: string;
  allowedMimeTypes: string[];
  allowedExtensions: string[];
  maxSizeBytes: number;
  retentionDays: number | null;
  isActive: boolean;
  activeFrom: string | null;
  activeUntil: string | null;
}

export interface RequirementPayload {
  userId: string;
  onboardingCaseId: string | null;
  documentDefinitionId: string;
  required: boolean;
  dueAt: string | null;
}

export interface GetReviewDetailAction {
  action: "getReviewDetail";
  userId: string;
  documentId: string;
}

export interface SaveDefinitionAction {
  action: "saveDefinition";
  definition: DocumentDefinitionPayload;
}

export interface EnsureOnboardingAction {
  action: "ensureOnboarding";
  userId: string;
}

export interface SeedDefaultRequirementsAction {
  action: "seedDefaultRequirements";
  userId: string;
  onboardingCaseId: string;
}

export interface AssignRequirementAction {
  action: "assignRequirement";
  requirement: RequirementPayload;
}

export interface StartReviewAction {
  action: "startReview";
  userId: string;
  documentId: string;
}

export interface AcceptDocumentAction {
  action: "acceptDocument";
  userId: string;
  documentId: string;
  note: string | null;
}

export interface RejectDocumentAction {
  action: "rejectDocument";
  userId: string;
  documentId: string;
  rejectionReason: string;
  note: string | null;
}

export interface VerifySignatureAction {
  action: "verifySignature";
  userId: string;
  documentId: string;
  documentVersionId: string;
  verificationStatus: VerificationStatus;
  reason: string | null;
}

export interface DownloadDocumentVersionAction {
  action: "downloadDocumentVersion";
  userId: string;
  documentVersionId: string;
  purpose: AdminDownloadPurpose;
}

export type AdminDocumentActionRequest =
  | GetReviewDetailAction
  | SaveDefinitionAction
  | EnsureOnboardingAction
  | SeedDefaultRequirementsAction
  | AssignRequirementAction
  | StartReviewAction
  | AcceptDocumentAction
  | RejectDocumentAction
  | VerifySignatureAction
  | DownloadDocumentVersionAction;

export interface DownloadTarget {
  documentId: string;
  documentVersionId: string;
  bucket: string;
  path: string;
  originalFilename: string;
  mimeType: string;
  sizeBytes: number;
  purpose: AdminDownloadPurpose;
  signedUrlExpiresInSeconds: number;
}

export class RequestValidationError extends Error {
  constructor(readonly fieldErrors: { [field: string]: string }) {
    super("Admin document request validation failed.");
    this.name = "RequestValidationError";
  }
}

export class BackendContractError extends Error {
  constructor(readonly rpcName: RpcName | null = null) {
    super("Backend contract validation failed.");
    this.name = "BackendContractError";
  }
}

const {
  assertOnlyKeys,
  assertUnique,
  backendArray,
  backendBoolean,
  backendEnum,
  backendNonNegativeInteger,
  backendObject,
  backendPositiveInteger,
  backendString,
  backendTimestamp,
  backendUuid,
  requestBoolean,
  requestEnum,
  requestInteger,
  requestNullableInteger,
  requestNullableString,
  requestNullableTimestamp,
  requestNullableUuid,
  requestObject,
  requestString,
  requestStringArray,
  requestUuid,
  throwIfRequestInvalid,
  validated,
} = createContractReaders<RpcName | null>({
  createRequestError: (fieldErrors) => new RequestValidationError(fieldErrors),
  createBackendError: (rpcName) => new BackendContractError(rpcName),
});

const ACTIONS = [
  "getReviewDetail",
  "saveDefinition",
  "ensureOnboarding",
  "seedDefaultRequirements",
  "assignRequirement",
  "startReview",
  "verifySignature",
  "acceptDocument",
  "rejectDocument",
  "downloadDocumentVersion",
] as const;

const ORIGIN_POLICIES = [
  "coworker_upload",
  "admin_upload",
  "system_generated",
  "mixed",
] as const;

const MULTIPLICITIES = [
  "single",
  "multiple",
  "versioned_single",
] as const;

const VERIFICATION_STATUSES = [
  "confirmed",
  "rejected",
  "indeterminate",
  "unsupported",
] as const;

const DOWNLOAD_PURPOSES = [
  "admin_review",
  "admin_download",
] as const;

const DEFINITION_CODE_PATTERN = /^[a-z0-9][a-z0-9_-]*$/;

const MIME_PATTERN = /^[a-z0-9][a-z0-9.+-]*\/[a-z0-9][a-z0-9.+-]*$/;

const EXTENSION_PATTERN = /^[a-z0-9]{1,16}$/;

export function parseAdminDocumentActionRequest(
  value: unknown,
): AdminDocumentActionRequest {
  const errors: { [field: string]: string } = {};
  const root = requestObject(value, "", errors);
  const action = requestEnum(root, "action", ACTIONS, "action", errors);

  switch (action) {
    case "getReviewDetail":
      assertOnlyKeys(root, ["action", "userId", "documentId"], "", errors);
      return validated(
        {
          action,
          userId: requestUuid(root, "userId", "userId", errors),
          documentId: requestUuid(
            root,
            "documentId",
            "documentId",
            errors,
          ),
        },
        errors,
      );

    case "saveDefinition":
      assertOnlyKeys(root, ["action", "definition"], "", errors);
      return validated(
        {
          action,
          definition: parseDefinition(root.definition, errors),
        },
        errors,
      );

    case "ensureOnboarding":
      assertOnlyKeys(root, ["action", "userId"], "", errors);
      return validated(
        {
          action,
          userId: requestUuid(root, "userId", "userId", errors),
        },
        errors,
      );

    case "seedDefaultRequirements":
      assertOnlyKeys(
        root,
        ["action", "userId", "onboardingCaseId"],
        "",
        errors,
      );
      return validated(
        {
          action,
          userId: requestUuid(root, "userId", "userId", errors),
          onboardingCaseId: requestUuid(
            root,
            "onboardingCaseId",
            "onboardingCaseId",
            errors,
          ),
        },
        errors,
      );

    case "assignRequirement":
      assertOnlyKeys(root, ["action", "requirement"], "", errors);
      return validated(
        {
          action,
          requirement: parseRequirement(root.requirement, errors),
        },
        errors,
      );

    case "startReview":
      assertOnlyKeys(root, ["action", "userId", "documentId"], "", errors);
      return validated(
        {
          action,
          userId: requestUuid(root, "userId", "userId", errors),
          documentId: requestUuid(
            root,
            "documentId",
            "documentId",
            errors,
          ),
        },
        errors,
      );

    case "verifySignature":
      assertOnlyKeys(
        root,
        [
          "action",
          "userId",
          "documentId",
          "documentVersionId",
          "verificationStatus",
          "reason",
        ],
        "",
        errors,
      );
      return parseVerifySignature(root, errors);

    case "acceptDocument":
      assertOnlyKeys(
        root,
        ["action", "userId", "documentId", "note"],
        "",
        errors,
      );
      return validated(
        {
          action,
          userId: requestUuid(root, "userId", "userId", errors),
          documentId: requestUuid(
            root,
            "documentId",
            "documentId",
            errors,
          ),
          note: requestNullableString(root, "note", "note", 4000, errors),
        },
        errors,
      );

    case "rejectDocument":
      assertOnlyKeys(
        root,
        [
          "action",
          "userId",
          "documentId",
          "rejectionReason",
          "note",
        ],
        "",
        errors,
      );
      return validated(
        {
          action,
          userId: requestUuid(root, "userId", "userId", errors),
          documentId: requestUuid(
            root,
            "documentId",
            "documentId",
            errors,
          ),
          rejectionReason: requestString(
            root,
            "rejectionReason",
            "rejectionReason",
            2000,
            errors,
          ),
          note: requestNullableString(root, "note", "note", 4000, errors),
        },
        errors,
      );

    case "downloadDocumentVersion":
      assertOnlyKeys(
        root,
        [
          "action",
          "userId",
          "documentVersionId",
          "purpose",
        ],
        "",
        errors,
      );
      return validated(
        {
          action,
          userId: requestUuid(root, "userId", "userId", errors),
          documentVersionId: requestUuid(
            root,
            "documentVersionId",
            "documentVersionId",
            errors,
          ),
          purpose: requestEnum(
            root,
            "purpose",
            DOWNLOAD_PURPOSES,
            "purpose",
            errors,
          ),
        },
        errors,
      );

    default:
      throwIfRequestInvalid(errors);
      throw new RequestValidationError({
        action: "Unsupported admin document action.",
      });
  }
}

function parseDefinition(
  value: unknown,
  errors: { [field: string]: string },
): DocumentDefinitionPayload {
  const definition = requestObject(value, "definition", errors);
  assertOnlyKeys(
    definition,
    [
      "id",
      "code",
      "title",
      "description",
      "category",
      "originPolicy",
      "multiplicity",
      "isRequiredByDefault",
      "signaturePolicyCode",
      "allowedMimeTypes",
      "allowedExtensions",
      "maxSizeBytes",
      "retentionDays",
      "isActive",
      "activeFrom",
      "activeUntil",
    ],
    "definition",
    errors,
  );

  const code = requestString(
    definition,
    "code",
    "definition.code",
    100,
    errors,
  ).toLowerCase();
  if (code !== "" && !DEFINITION_CODE_PATTERN.test(code)) {
    errors["definition.code"] = "Provide a lowercase document code.";
  }

  const allowedMimeTypes = requestStringArray(
    definition,
    "allowedMimeTypes",
    "definition.allowedMimeTypes",
    50,
    150,
    errors,
  ).map((item) => item.toLowerCase());

  if (allowedMimeTypes.some((item) => !MIME_PATTERN.test(item))) {
    errors["definition.allowedMimeTypes"] =
      "Every item must be a valid MIME type.";
  }
  assertUnique(
    allowedMimeTypes,
    "definition.allowedMimeTypes",
    errors,
  );

  const allowedExtensions = requestStringArray(
    definition,
    "allowedExtensions",
    "definition.allowedExtensions",
    50,
    16,
    errors,
  ).map((item) => item.replace(/^\./, "").toLowerCase());

  if (allowedExtensions.some((item) => !EXTENSION_PATTERN.test(item))) {
    errors["definition.allowedExtensions"] =
      "Every item must be a valid file extension.";
  }
  assertUnique(
    allowedExtensions,
    "definition.allowedExtensions",
    errors,
  );

  const activeFrom = requestNullableTimestamp(
    definition,
    "activeFrom",
    "definition.activeFrom",
    errors,
  );
  const activeUntil = requestNullableTimestamp(
    definition,
    "activeUntil",
    "definition.activeUntil",
    errors,
  );

  if (
    activeFrom !== null &&
    activeUntil !== null &&
    Date.parse(activeUntil) <= Date.parse(activeFrom)
  ) {
    errors["definition.activeUntil"] =
      "activeUntil must be later than activeFrom.";
  }

  const result: DocumentDefinitionPayload = {
    id: requestNullableUuid(definition, "id", "definition.id", errors),
    code,
    title: requestString(
      definition,
      "title",
      "definition.title",
      250,
      errors,
    ),
    description: requestNullableString(
      definition,
      "description",
      "definition.description",
      4000,
      errors,
    ),
    category: requestString(
      definition,
      "category",
      "definition.category",
      150,
      errors,
    ),
    originPolicy: requestEnum(
      definition,
      "originPolicy",
      ORIGIN_POLICIES,
      "definition.originPolicy",
      errors,
    ),
    multiplicity: requestEnum(
      definition,
      "multiplicity",
      MULTIPLICITIES,
      "definition.multiplicity",
      errors,
    ),
    isRequiredByDefault: requestBoolean(
      definition,
      "isRequiredByDefault",
      "definition.isRequiredByDefault",
      errors,
    ),
    signaturePolicyCode: requestString(
      definition,
      "signaturePolicyCode",
      "definition.signaturePolicyCode",
      100,
      errors,
    ).toLowerCase(),
    allowedMimeTypes,
    allowedExtensions,
    maxSizeBytes: requestInteger(
      definition,
      "maxSizeBytes",
      "definition.maxSizeBytes",
      1,
      26_214_400,
      errors,
    ),
    retentionDays: requestNullableInteger(
      definition,
      "retentionDays",
      "definition.retentionDays",
      0,
      36500,
      errors,
    ),
    isActive: requestBoolean(
      definition,
      "isActive",
      "definition.isActive",
      errors,
    ),
    activeFrom,
    activeUntil,
  };

  throwIfRequestInvalid(errors);
  return result;
}

function parseRequirement(
  value: unknown,
  errors: { [field: string]: string },
): RequirementPayload {
  const requirement = requestObject(value, "requirement", errors);
  assertOnlyKeys(
    requirement,
    [
      "userId",
      "onboardingCaseId",
      "documentDefinitionId",
      "required",
      "dueAt",
    ],
    "requirement",
    errors,
  );

  const result: RequirementPayload = {
    userId: requestUuid(
      requirement,
      "userId",
      "requirement.userId",
      errors,
    ),
    onboardingCaseId: requestNullableUuid(
      requirement,
      "onboardingCaseId",
      "requirement.onboardingCaseId",
      errors,
    ),
    documentDefinitionId: requestUuid(
      requirement,
      "documentDefinitionId",
      "requirement.documentDefinitionId",
      errors,
    ),
    required: requestBoolean(
      requirement,
      "required",
      "requirement.required",
      errors,
    ),
    dueAt: requestNullableTimestamp(
      requirement,
      "dueAt",
      "requirement.dueAt",
      errors,
    ),
  };

  throwIfRequestInvalid(errors);
  return result;
}

function parseVerifySignature(
  root: UnknownObject,
  errors: { [field: string]: string },
): VerifySignatureAction {
  const userId = requestUuid(root, "userId", "userId", errors);
  const documentId = requestUuid(
    root,
    "documentId",
    "documentId",
    errors,
  );
  const documentVersionId = requestUuid(
    root,
    "documentVersionId",
    "documentVersionId",
    errors,
  );
  const verificationStatus = requestEnum(
    root,
    "verificationStatus",
    VERIFICATION_STATUSES,
    "verificationStatus",
    errors,
  );
  const reason = requestNullableString(
    root,
    "reason",
    "reason",
    2000,
    errors,
  );

  if (verificationStatus !== "confirmed" && reason === null) {
    errors.reason = "A reason is required when the signature is not confirmed.";
  }

  return validated(
    {
      action: "verifySignature",
      userId,
      documentId,
      documentVersionId,
      verificationStatus,
      reason,
    },
    errors,
  );
}

export function parseAdminDashboard(
  catalogValue: unknown,
  queueValue: unknown,
): UnknownObject {
  const catalog = backendObject(catalogValue, RPC.getCatalog);
  backendArray(catalog, "signaturePolicies", RPC.getCatalog);
  backendArray(catalog, "documentDefinitions", RPC.getCatalog);

  if (!Array.isArray(queueValue)) {
    throw new BackendContractError(RPC.getReviewQueue);
  }

  return {
    catalog,
    reviewQueue: queueValue,
  };
}

export function parseSavedDefinition(value: unknown): UnknownObject {
  const definition = backendObject(value, RPC.saveDefinition);
  backendUuid(definition, "id", RPC.saveDefinition);
  backendString(definition, "code", RPC.saveDefinition);
  backendString(definition, "title", RPC.saveDefinition);
  return definition;
}

export function parseOnboardingResult(
  value: unknown,
  userId: string,
): UnknownObject {
  const result = backendObject(value, RPC.ensureOnboarding);
  backendBoolean(result, "created", RPC.ensureOnboarding);
  const onboardingCase = backendObject(result.case, RPC.ensureOnboarding);
  backendUuid(onboardingCase, "id", RPC.ensureOnboarding);

  if (
    backendUuid(onboardingCase, "userId", RPC.ensureOnboarding) !== userId
  ) {
    throw new BackendContractError(RPC.ensureOnboarding);
  }

  return result;
}

export function parseSeedRequirementsResult(
  value: unknown,
  userId: string,
  onboardingCaseId: string,
): UnknownObject {
  const result = backendObject(value, RPC.seedDefaultRequirements);
  if (
    backendUuid(result, "userId", RPC.seedDefaultRequirements) !== userId ||
    backendUuid(
        result,
        "onboardingCaseId",
        RPC.seedDefaultRequirements,
      ) !== onboardingCaseId
  ) {
    throw new BackendContractError(RPC.seedDefaultRequirements);
  }
  backendNonNegativeInteger(
    result,
    "insertedCount",
    RPC.seedDefaultRequirements,
  );
  return result;
}

export function parseRequirementResult(
  value: unknown,
  userId: string,
): UnknownObject {
  const requirement = backendObject(value, RPC.assignRequirement);
  backendUuid(requirement, "id", RPC.assignRequirement);
  if (
    backendUuid(requirement, "userId", RPC.assignRequirement) !== userId
  ) {
    throw new BackendContractError(RPC.assignRequirement);
  }
  return requirement;
}

export function parseReviewDetail(
  value: unknown,
  userId: string,
  documentId: string,
): UnknownObject {
  const detail = backendObject(value, RPC.getReviewDetail);
  const user = backendObject(detail.user, RPC.getReviewDetail);
  const document = backendObject(detail.document, RPC.getReviewDetail);

  if (
    backendUuid(user, "userId", RPC.getReviewDetail) !== userId ||
    backendUuid(document, "id", RPC.getReviewDetail) !== documentId ||
    backendUuid(document, "userId", RPC.getReviewDetail) !== userId
  ) {
    throw new BackendContractError(RPC.getReviewDetail);
  }

  backendArray(detail, "signatureVerifications", RPC.getReviewDetail);
  backendArray(detail, "reviews", RPC.getReviewDetail);
  return detail;
}

export function parseDocumentResult(
  value: unknown,
  rpcName:
    | typeof RPC.startReview
    | typeof RPC.acceptDocument
    | typeof RPC.rejectDocument,
  userId: string,
  documentId: string,
): UnknownObject {
  const document = backendObject(value, rpcName);
  if (
    backendUuid(document, "id", rpcName) !== documentId ||
    backendUuid(document, "userId", rpcName) !== userId
  ) {
    throw new BackendContractError(rpcName);
  }
  return document;
}

export function parseSignatureVerification(
  value: unknown,
  userId: string,
  documentId: string,
  documentVersionId: string,
  expectedStatus: VerificationStatus,
): UnknownObject {
  const verification = backendObject(value, RPC.verifySignature);

  if (
    backendUuid(verification, "documentId", RPC.verifySignature) !==
      documentId ||
    backendUuid(
        verification,
        "documentVersionId",
        RPC.verifySignature,
      ) !== documentVersionId ||
    backendString(
        verification,
        "verificationStatus",
        RPC.verifySignature,
      ) !== expectedStatus ||
    userId === ""
  ) {
    throw new BackendContractError(RPC.verifySignature);
  }

  backendUuid(verification, "id", RPC.verifySignature);
  backendTimestamp(verification, "createdAt", RPC.verifySignature);
  return verification;
}

export function parseDownloadTarget(
  value: unknown,
  documentVersionId: string,
  purpose: AdminDownloadPurpose,
): DownloadTarget {
  const result = backendObject(value, RPC.getDownloadTarget);
  const target: DownloadTarget = {
    documentId: backendUuid(
      result,
      "documentId",
      RPC.getDownloadTarget,
    ),
    documentVersionId: backendUuid(
      result,
      "documentVersionId",
      RPC.getDownloadTarget,
    ),
    bucket: backendString(result, "bucket", RPC.getDownloadTarget),
    path: backendString(result, "path", RPC.getDownloadTarget),
    originalFilename: backendString(
      result,
      "originalFilename",
      RPC.getDownloadTarget,
    ),
    mimeType: backendString(result, "mimeType", RPC.getDownloadTarget),
    sizeBytes: backendPositiveInteger(
      result,
      "sizeBytes",
      RPC.getDownloadTarget,
    ),
    purpose: backendEnum(
      result,
      "purpose",
      DOWNLOAD_PURPOSES,
      RPC.getDownloadTarget,
    ),
    signedUrlExpiresInSeconds: backendPositiveInteger(
      result,
      "signedUrlExpiresInSeconds",
      RPC.getDownloadTarget,
    ),
  };

  if (
    target.documentVersionId !== documentVersionId ||
    target.purpose !== purpose ||
    target.bucket !== "coworker-documents" ||
    target.signedUrlExpiresInSeconds > 300
  ) {
    throw new BackendContractError(RPC.getDownloadTarget);
  }

  return target;
}
