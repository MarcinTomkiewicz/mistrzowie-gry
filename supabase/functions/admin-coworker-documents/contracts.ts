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
export type UnknownObject = { [key: string]: unknown };

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

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const DEFINITION_CODE_PATTERN =
  /^[a-z0-9][a-z0-9_-]*$/;

const MIME_PATTERN =
  /^[a-z0-9][a-z0-9.+-]*\/[a-z0-9][a-z0-9.+-]*$/;

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
    errors.reason =
      "A reason is required when the signature is not confirmed.";
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

function requestObject(
  value: unknown,
  path: string,
  errors: { [field: string]: string },
): UnknownObject {
  if (!isObject(value)) {
    errors[path || "request"] = "Expected an object.";
    return {};
  }
  return value;
}

function assertOnlyKeys(
  source: UnknownObject,
  allowedKeys: readonly string[],
  path: string,
  errors: { [field: string]: string },
): void {
  const allowed = new Set(allowedKeys);
  for (const key of Object.keys(source)) {
    if (!allowed.has(key)) {
      errors[path === "" ? key : `${path}.${key}`] = "Unexpected field.";
    }
  }
}

function requestString(
  source: UnknownObject,
  key: string,
  path: string,
  maxLength: number,
  errors: { [field: string]: string },
): string {
  const value = source[key];
  if (typeof value !== "string" || value.trim() === "") {
    errors[path] = "Expected a non-empty string.";
    return "";
  }
  const normalized = value.trim();
  if (normalized.length > maxLength) {
    errors[path] = `Maximum length is ${maxLength}.`;
  }
  return normalized;
}

function requestNullableString(
  source: UnknownObject,
  key: string,
  path: string,
  maxLength: number,
  errors: { [field: string]: string },
): string | null {
  const value = source[key];
  if (value === undefined || value === null || value === "") {
    return null;
  }
  if (typeof value !== "string") {
    errors[path] = "Expected a string or null.";
    return null;
  }
  const normalized = value.trim();
  if (normalized === "") {
    return null;
  }
  if (normalized.length > maxLength) {
    errors[path] = `Maximum length is ${maxLength}.`;
  }
  return normalized;
}

function requestUuid(
  source: UnknownObject,
  key: string,
  path: string,
  errors: { [field: string]: string },
): string {
  const value = requestString(source, key, path, 36, errors);
  if (value !== "" && !UUID_PATTERN.test(value)) {
    errors[path] = "Expected a valid UUID.";
  }
  return value;
}

function requestNullableUuid(
  source: UnknownObject,
  key: string,
  path: string,
  errors: { [field: string]: string },
): string | null {
  const value = requestNullableString(source, key, path, 36, errors);
  if (value !== null && !UUID_PATTERN.test(value)) {
    errors[path] = "Expected a valid UUID or null.";
  }
  return value;
}

function requestBoolean(
  source: UnknownObject,
  key: string,
  path: string,
  errors: { [field: string]: string },
): boolean {
  const value = source[key];
  if (typeof value !== "boolean") {
    errors[path] = "Expected a boolean.";
    return false;
  }
  return value;
}

function requestInteger(
  source: UnknownObject,
  key: string,
  path: string,
  minimum: number,
  maximum: number,
  errors: { [field: string]: string },
): number {
  const value = source[key];
  if (
    typeof value !== "number" ||
    !Number.isInteger(value) ||
    value < minimum ||
    value > maximum
  ) {
    errors[path] = `Expected an integer from ${minimum} to ${maximum}.`;
    return minimum;
  }
  return value;
}

function requestNullableInteger(
  source: UnknownObject,
  key: string,
  path: string,
  minimum: number,
  maximum: number,
  errors: { [field: string]: string },
): number | null {
  const value = source[key];
  if (value === undefined || value === null) {
    return null;
  }
  if (
    typeof value !== "number" ||
    !Number.isInteger(value) ||
    value < minimum ||
    value > maximum
  ) {
    errors[path] =
      `Expected null or an integer from ${minimum} to ${maximum}.`;
    return null;
  }
  return value;
}

function requestNullableTimestamp(
  source: UnknownObject,
  key: string,
  path: string,
  errors: { [field: string]: string },
): string | null {
  const value = requestNullableString(source, key, path, 100, errors);
  if (value !== null && Number.isNaN(Date.parse(value))) {
    errors[path] = "Expected a valid timestamp or null.";
  }
  return value;
}

function requestStringArray(
  source: UnknownObject,
  key: string,
  path: string,
  maxItems: number,
  maxItemLength: number,
  errors: { [field: string]: string },
): string[] {
  const value = source[key];
  if (!Array.isArray(value) || value.length === 0) {
    errors[path] = "Expected a non-empty string array.";
    return [];
  }
  if (value.length > maxItems) {
    errors[path] = `Maximum item count is ${maxItems}.`;
  }

  const result: string[] = [];
  for (let index = 0; index < value.length; index += 1) {
    const item = value[index];
    if (typeof item !== "string" || item.trim() === "") {
      errors[`${path}.${index}`] = "Expected a non-empty string.";
      continue;
    }
    const normalized = item.trim();
    if (normalized.length > maxItemLength) {
      errors[`${path}.${index}`] =
        `Maximum length is ${maxItemLength}.`;
    }
    result.push(normalized);
  }
  return result;
}

function requestEnum<const T extends readonly string[]>(
  source: UnknownObject,
  key: string,
  allowedValues: T,
  path: string,
  errors: { [field: string]: string },
): T[number] {
  const value = source[key];
  if (
    typeof value !== "string" ||
    !allowedValues.includes(value as T[number])
  ) {
    errors[path] = `Expected one of: ${allowedValues.join(", ")}.`;
    return allowedValues[0];
  }
  return value as T[number];
}

function assertUnique(
  values: string[],
  path: string,
  errors: { [field: string]: string },
): void {
  if (new Set(values).size !== values.length) {
    errors[path] = "Duplicate values are not allowed.";
  }
}

function throwIfRequestInvalid(errors: { [field: string]: string }): void {
  if (Object.keys(errors).length > 0) {
    throw new RequestValidationError(errors);
  }
}

function validated<T>(
  value: T,
  errors: { [field: string]: string },
): T {
  throwIfRequestInvalid(errors);
  return value;
}

function backendObject(
  value: unknown,
  rpcName: RpcName | null,
): UnknownObject {
  if (!isObject(value)) {
    throw new BackendContractError(rpcName);
  }
  return value;
}

function backendArray(
  source: UnknownObject,
  key: string,
  rpcName: RpcName,
): unknown[] {
  const value = source[key];
  if (!Array.isArray(value)) {
    throw new BackendContractError(rpcName);
  }
  return value;
}

function backendString(
  source: UnknownObject,
  key: string,
  rpcName: RpcName | null,
): string {
  const value = source[key];
  if (typeof value !== "string" || value === "") {
    throw new BackendContractError(rpcName);
  }
  return value;
}

function backendUuid(
  source: UnknownObject,
  key: string,
  rpcName: RpcName,
): string {
  const value = backendString(source, key, rpcName);
  if (!UUID_PATTERN.test(value)) {
    throw new BackendContractError(rpcName);
  }
  return value;
}

function backendBoolean(
  source: UnknownObject,
  key: string,
  rpcName: RpcName,
): boolean {
  const value = source[key];
  if (typeof value !== "boolean") {
    throw new BackendContractError(rpcName);
  }
  return value;
}

function backendPositiveInteger(
  source: UnknownObject,
  key: string,
  rpcName: RpcName,
): number {
  const value = source[key];
  if (typeof value !== "number" || !Number.isInteger(value) || value < 1) {
    throw new BackendContractError(rpcName);
  }
  return value;
}

function backendNonNegativeInteger(
  source: UnknownObject,
  key: string,
  rpcName: RpcName,
): number {
  const value = source[key];
  if (typeof value !== "number" || !Number.isInteger(value) || value < 0) {
    throw new BackendContractError(rpcName);
  }
  return value;
}

function backendTimestamp(
  source: UnknownObject,
  key: string,
  rpcName: RpcName,
): string {
  const value = backendString(source, key, rpcName);
  if (Number.isNaN(Date.parse(value))) {
    throw new BackendContractError(rpcName);
  }
  return value;
}

function backendEnum<const T extends readonly string[]>(
  source: UnknownObject,
  key: string,
  allowedValues: T,
  rpcName: RpcName,
): T[number] {
  const value = source[key];
  if (
    typeof value !== "string" ||
    !allowedValues.includes(value as T[number])
  ) {
    throw new BackendContractError(rpcName);
  }
  return value as T[number];
}

function isObject(value: unknown): value is UnknownObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
