import {
  createContractReaders,
  type UnknownObject,
} from "../_shared/coworker-document-edge/contract-readers.ts";

export type { UnknownObject } from "../_shared/coworker-document-edge/contract-readers.ts";

export const RPC = {
  getCatalog: "get_admin_coworker_operational_document_catalog",
  getList: "get_admin_coworker_operational_document_list",
  getDetail: "get_admin_coworker_operational_document_detail",
  saveDocument: "save_admin_coworker_operational_document",
  reserveUpload: "reserve_admin_coworker_operational_document_upload",
  activateSignedUpload: "activate_admin_coworker_operational_signed_upload",
  getUploadTarget: "get_admin_coworker_operational_upload_target",
  finalizeUpload: "finalize_admin_coworker_operational_upload",
  configureVersion: "configure_admin_coworker_operational_version",
  publishVersion: "publish_admin_coworker_operational_version",
  getAssignmentList: "get_admin_coworker_operational_assignment_list",
  waiveAssignment: "waive_admin_coworker_operational_assignment",
  archiveDocument: "archive_admin_coworker_operational_document",
  getDownloadTarget: "get_admin_coworker_operational_download_target",
  cancelUpload: "cancel_admin_coworker_operational_upload",
  recordCleanup: "record_admin_coworker_operational_cleanup_result",
} as const;

export type RpcName = typeof RPC[keyof typeof RPC];

export type ActionMode =
  | "information_only"
  | "acknowledgement_required"
  | "acceptance_required";

export type TargetKind =
  | "all_active_coworkers"
  | "app_role"
  | "user"
  | "event_definition";

export type StatementAction = "acknowledged" | "accepted" | "declined";
export type AdminDownloadPurpose = "admin_review" | "admin_download";

export interface TargetPayload {
  targetKind: TargetKind;
  appRole: string | null;
  userId: string | null;
  eventDefinitionId: string | null;
}

export interface StatementPayload {
  action: StatementAction;
  text: string;
}

export interface SaveDocumentRequest {
  action: "saveDocument";
  document: {
    id: string | null;
    code: string;
    title: string;
    description: string | null;
    category: string;
  };
}

export interface GetDocumentDetailRequest {
  action: "getDocumentDetail";
  documentId: string;
}

export interface ReserveUploadRequest {
  action: "reserveUpload";
  upload: {
    documentId: string;
    title: string;
    summary: string | null;
    actionMode: ActionMode;
    requiresReacceptance: boolean;
    statementVersion: number;
    actionDueAt: string | null;
    originalFilename: string;
    declaredMimeType: string;
    sizeBytes: number;
  };
}

export interface UploadSessionRequest {
  action: "finalizeUpload" | "cancelUpload";
  uploadSessionId: string;
}

export interface ConfigureVersionRequest {
  action: "configureVersion";
  configuration: {
    documentVersionId: string;
    title: string;
    summary: string | null;
    actionMode: ActionMode;
    requiresReacceptance: boolean;
    statementVersion: number;
    actionDueAt: string | null;
    targets: TargetPayload[];
    statements: StatementPayload[];
  };
}

export interface PublishVersionRequest {
  action: "publishVersion";
  documentVersionId: string;
}

export interface AssignmentListRequest {
  action: "getAssignmentList";
  documentVersionId: string;
}

export interface WaiveAssignmentRequest {
  action: "waiveAssignment";
  assignmentId: string;
  reason: string;
}

export interface ArchiveDocumentRequest {
  action: "archiveDocument";
  documentId: string;
}

export interface DownloadRequest {
  action: "downloadDocumentVersion";
  documentVersionId: string;
  purpose: AdminDownloadPurpose;
}

export type AdminOperationalRequest =
  | SaveDocumentRequest
  | GetDocumentDetailRequest
  | ReserveUploadRequest
  | UploadSessionRequest
  | ConfigureVersionRequest
  | PublishVersionRequest
  | AssignmentListRequest
  | WaiveAssignmentRequest
  | ArchiveDocumentRequest
  | DownloadRequest;

export interface UploadReservation {
  documentId: string;
  documentVersionId: string;
  versionNumber: number;
  uploadSessionId: string;
  bucket: string;
  path: string;
  originalFilename: string;
  storedFilename: string;
  declaredMimeType: string;
  expectedSizeBytes: number;
  expiresAt: string;
}

export interface SignedUploadActivation {
  documentId: string;
  documentVersionId: string;
  uploadSessionId: string;
  bucket: string;
  path: string;
  expectedSizeBytes: number;
  expectedMimeType: string;
  issuedAt: string;
  expiresAt: string;
}

export interface UploadTarget {
  uploadSessionId: string;
  sessionStatus: "created" | "uploaded" | "finalized";
  finalized: boolean;
  documentId: string;
  documentVersionId: string;
  documentVersionStatus: string;
  bucket: string;
  path: string;
  expectedSizeBytes: number;
  expectedMimeType: string;
  expiresAt: string;
  contentSha256Base64: string | null;
}

export interface CancelUploadResult {
  uploadSessionId: string;
  cancelled: true;
  cleanupStatus: "not_required" | "pending" | "completed" | "failed";
  cleanupTarget: {
    bucket: string;
    path: string;
  };
}

export interface CleanupResult {
  uploadSessionId: string;
  cleanupStatus: "completed" | "failed";
  cleanupAttemptedAt: string;
  cleanupCompletedAt: string | null;
  failureCode: string | null;
}

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
    super("Admin operational document request validation failed.");
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
  backendArray,
  backendBoolean,
  backendEnum,
  backendNullableString,
  backendNullableTimestamp,
  backendObject,
  backendPositiveInteger,
  backendString,
  backendTimestamp,
  backendUuid,
  requestBoolean,
  requestEnum,
  requestInteger,
  requestNullableString,
  requestNullableUuid,
  requestObject,
  requestString,
  requestUuid,
  throwIfRequestInvalid: throwIfInvalid,
  validated,
} = createContractReaders<RpcName>({
  createRequestError: (fieldErrors) => new RequestValidationError(fieldErrors),
  createBackendError: (rpcName) => new BackendContractError(rpcName),
  allowEmptyBackendNullableString: false,
});

const ACTIONS = [
  "saveDocument",
  "getDocumentDetail",
  "reserveUpload",
  "finalizeUpload",
  "cancelUpload",
  "configureVersion",
  "publishVersion",
  "getAssignmentList",
  "waiveAssignment",
  "archiveDocument",
  "downloadDocumentVersion",
] as const;

const ACTION_MODES = [
  "information_only",
  "acknowledgement_required",
  "acceptance_required",
] as const;

const TARGET_KINDS = [
  "all_active_coworkers",
  "app_role",
  "user",
  "event_definition",
] as const;

const STATEMENT_ACTIONS = [
  "acknowledged",
  "accepted",
  "declined",
] as const;

const DOWNLOAD_PURPOSES = ["admin_review", "admin_download"] as const;

const CODE_PATTERN = /^[a-z0-9][a-z0-9_-]*$/;
const MIME_PATTERN = /^[a-z0-9][a-z0-9.+-]*\/[a-z0-9][a-z0-9.+-]*$/;

function requestNullableFutureTimestamp(
  source: UnknownObject,
  key: string,
  path: string,
  errors: { [field: string]: string },
): string | null {
  const value = requestNullableString(source, key, path, 100, errors);
  if (value === null) {
    return null;
  }
  const timestamp = Date.parse(value);
  if (Number.isNaN(timestamp)) {
    errors[path] = "Expected a valid timestamp or null.";
  } else if (timestamp <= Date.now()) {
    errors[path] = "Expected a future timestamp or null.";
  }
  return value;
}

export function parseRequest(value: unknown): AdminOperationalRequest {
  const errors: { [field: string]: string } = {};
  const root = requestObject(value, "request", errors);
  const action = requestEnum(root, "action", ACTIONS, "action", errors);

  switch (action) {
    case "saveDocument":
      assertOnlyKeys(root, ["action", "document"], "", errors);
      return validated(
        {
          action,
          document: parseDocumentInput(root.document, errors),
        },
        errors,
      );

    case "getDocumentDetail":
      assertOnlyKeys(root, ["action", "documentId"], "", errors);
      return validated(
        {
          action,
          documentId: requestUuid(
            root,
            "documentId",
            "documentId",
            errors,
          ),
        },
        errors,
      );

    case "reserveUpload":
      assertOnlyKeys(root, ["action", "upload"], "", errors);
      return validated(
        {
          action,
          upload: parseUpload(root.upload, errors),
        },
        errors,
      );

    case "finalizeUpload":
    case "cancelUpload":
      assertOnlyKeys(root, ["action", "uploadSessionId"], "", errors);
      return validated(
        {
          action,
          uploadSessionId: requestUuid(
            root,
            "uploadSessionId",
            "uploadSessionId",
            errors,
          ),
        },
        errors,
      );

    case "configureVersion":
      assertOnlyKeys(root, ["action", "configuration"], "", errors);
      return validated(
        {
          action,
          configuration: parseConfiguration(root.configuration, errors),
        },
        errors,
      );

    case "publishVersion":
    case "getAssignmentList":
      assertOnlyKeys(root, ["action", "documentVersionId"], "", errors);
      return validated(
        {
          action,
          documentVersionId: requestUuid(
            root,
            "documentVersionId",
            "documentVersionId",
            errors,
          ),
        },
        errors,
      );

    case "waiveAssignment":
      assertOnlyKeys(
        root,
        ["action", "assignmentId", "reason"],
        "",
        errors,
      );
      return validated(
        {
          action,
          assignmentId: requestUuid(
            root,
            "assignmentId",
            "assignmentId",
            errors,
          ),
          reason: requestString(root, "reason", "reason", 2000, errors),
        },
        errors,
      );

    case "archiveDocument":
      assertOnlyKeys(root, ["action", "documentId"], "", errors);
      return validated(
        {
          action,
          documentId: requestUuid(
            root,
            "documentId",
            "documentId",
            errors,
          ),
        },
        errors,
      );

    case "downloadDocumentVersion":
      assertOnlyKeys(
        root,
        ["action", "documentVersionId", "purpose"],
        "",
        errors,
      );
      return validated(
        {
          action,
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
      throwIfInvalid(errors);
      throw new RequestValidationError({
        action: "Unsupported admin operational document action.",
      });
  }
}

function parseDocumentInput(
  value: unknown,
  errors: { [field: string]: string },
): SaveDocumentRequest["document"] {
  const document = requestObject(value, "document", errors);
  assertOnlyKeys(
    document,
    ["id", "code", "title", "description", "category"],
    "document",
    errors,
  );

  const code = requestString(
    document,
    "code",
    "document.code",
    100,
    errors,
  ).toLowerCase();
  if (code !== "" && !CODE_PATTERN.test(code)) {
    errors["document.code"] = "Provide a lowercase document code.";
  }

  return {
    id: requestNullableUuid(document, "id", "document.id", errors),
    code,
    title: requestString(
      document,
      "title",
      "document.title",
      250,
      errors,
    ),
    description: requestNullableString(
      document,
      "description",
      "document.description",
      4000,
      errors,
    ),
    category: requestString(
      document,
      "category",
      "document.category",
      150,
      errors,
    ),
  };
}

function parseUpload(
  value: unknown,
  errors: { [field: string]: string },
): ReserveUploadRequest["upload"] {
  const upload = requestObject(value, "upload", errors);
  assertOnlyKeys(
    upload,
    [
      "documentId",
      "title",
      "summary",
      "actionMode",
      "requiresReacceptance",
      "statementVersion",
      "actionDueAt",
      "originalFilename",
      "declaredMimeType",
      "sizeBytes",
    ],
    "upload",
    errors,
  );

  const originalFilename = requestString(
    upload,
    "originalFilename",
    "upload.originalFilename",
    255,
    errors,
  );
  if (
    originalFilename !== "" &&
    (/[/\\]/.test(originalFilename) ||
      /[\u0000-\u001f\u007f]/.test(originalFilename))
  ) {
    errors["upload.originalFilename"] =
      "Provide a file name without path separators.";
  }

  const declaredMimeType = requestString(
    upload,
    "declaredMimeType",
    "upload.declaredMimeType",
    150,
    errors,
  ).toLowerCase();
  if (declaredMimeType !== "" && !MIME_PATTERN.test(declaredMimeType)) {
    errors["upload.declaredMimeType"] = "Provide a valid MIME type.";
  }

  return {
    documentId: requestUuid(
      upload,
      "documentId",
      "upload.documentId",
      errors,
    ),
    title: requestString(
      upload,
      "title",
      "upload.title",
      250,
      errors,
    ),
    summary: requestNullableString(
      upload,
      "summary",
      "upload.summary",
      4000,
      errors,
    ),
    actionMode: requestEnum(
      upload,
      "actionMode",
      ACTION_MODES,
      "upload.actionMode",
      errors,
    ),
    requiresReacceptance: requestBoolean(
      upload,
      "requiresReacceptance",
      "upload.requiresReacceptance",
      errors,
    ),
    statementVersion: requestInteger(
      upload,
      "statementVersion",
      "upload.statementVersion",
      1,
      2_147_483_647,
      errors,
    ),
    actionDueAt: requestNullableFutureTimestamp(
      upload,
      "actionDueAt",
      "upload.actionDueAt",
      errors,
    ),
    originalFilename,
    declaredMimeType,
    sizeBytes: requestInteger(
      upload,
      "sizeBytes",
      "upload.sizeBytes",
      1,
      26_214_400,
      errors,
    ),
  };
}

function parseConfiguration(
  value: unknown,
  errors: { [field: string]: string },
): ConfigureVersionRequest["configuration"] {
  const configuration = requestObject(value, "configuration", errors);
  assertOnlyKeys(
    configuration,
    [
      "documentVersionId",
      "title",
      "summary",
      "actionMode",
      "requiresReacceptance",
      "statementVersion",
      "actionDueAt",
      "targets",
      "statements",
    ],
    "configuration",
    errors,
  );

  const actionMode = requestEnum(
    configuration,
    "actionMode",
    ACTION_MODES,
    "configuration.actionMode",
    errors,
  );
  const targets = parseTargets(configuration.targets, errors);
  const statements = parseStatements(configuration.statements, errors);

  if (actionMode === "information_only" && statements.length !== 0) {
    errors["configuration.statements"] =
      "Information-only versions cannot have statements.";
  }
  if (
    actionMode === "acknowledgement_required" &&
    (
      statements.length !== 1 ||
      statements[0]?.action !== "acknowledged"
    )
  ) {
    errors["configuration.statements"] =
      "Acknowledgement-required versions need one acknowledged statement.";
  }
  if (
    actionMode === "acceptance_required" &&
    (
      statements.length !== 2 ||
      !statements.some((statement) => statement.action === "accepted") ||
      !statements.some((statement) => statement.action === "declined")
    )
  ) {
    errors["configuration.statements"] =
      "Acceptance-required versions need accepted and declined statements.";
  }

  return {
    documentVersionId: requestUuid(
      configuration,
      "documentVersionId",
      "configuration.documentVersionId",
      errors,
    ),
    title: requestString(
      configuration,
      "title",
      "configuration.title",
      250,
      errors,
    ),
    summary: requestNullableString(
      configuration,
      "summary",
      "configuration.summary",
      4000,
      errors,
    ),
    actionMode,
    requiresReacceptance: requestBoolean(
      configuration,
      "requiresReacceptance",
      "configuration.requiresReacceptance",
      errors,
    ),
    statementVersion: requestInteger(
      configuration,
      "statementVersion",
      "configuration.statementVersion",
      1,
      2_147_483_647,
      errors,
    ),
    actionDueAt: requestNullableFutureTimestamp(
      configuration,
      "actionDueAt",
      "configuration.actionDueAt",
      errors,
    ),
    targets,
    statements,
  };
}

function parseTargets(
  value: unknown,
  errors: { [field: string]: string },
): TargetPayload[] {
  if (!Array.isArray(value) || value.length === 0 || value.length > 500) {
    errors["configuration.targets"] = "Expected from 1 to 500 target objects.";
    return [];
  }

  const result: TargetPayload[] = [];

  for (let index = 0; index < value.length; index += 1) {
    const path = `configuration.targets.${index}`;
    const target = requestObject(value[index], path, errors);
    assertOnlyKeys(
      target,
      ["targetKind", "appRole", "userId", "eventDefinitionId"],
      path,
      errors,
    );

    const targetKind = requestEnum(
      target,
      "targetKind",
      TARGET_KINDS,
      `${path}.targetKind`,
      errors,
    );
    const appRole = requestNullableString(
      target,
      "appRole",
      `${path}.appRole`,
      100,
      errors,
    );
    const userId = requestNullableUuid(
      target,
      "userId",
      `${path}.userId`,
      errors,
    );
    const eventDefinitionId = requestNullableUuid(
      target,
      "eventDefinitionId",
      `${path}.eventDefinitionId`,
      errors,
    );

    const validSelector = (
      targetKind === "all_active_coworkers" &&
      appRole === null &&
      userId === null &&
      eventDefinitionId === null
    ) ||
      (
        targetKind === "app_role" &&
        appRole !== null &&
        userId === null &&
        eventDefinitionId === null
      ) ||
      (
        targetKind === "user" &&
        appRole === null &&
        userId !== null &&
        eventDefinitionId === null
      ) ||
      (
        targetKind === "event_definition" &&
        appRole === null &&
        userId === null &&
        eventDefinitionId !== null
      );

    if (!validSelector) {
      errors[path] = "Target selector does not match targetKind.";
    }

    result.push({
      targetKind,
      appRole,
      userId,
      eventDefinitionId,
    });
  }

  const serialized = result.map((target) => JSON.stringify(target));
  if (new Set(serialized).size !== serialized.length) {
    errors["configuration.targets"] = "Duplicate targets are not allowed.";
  }

  return result;
}

function parseStatements(
  value: unknown,
  errors: { [field: string]: string },
): StatementPayload[] {
  if (!Array.isArray(value) || value.length > 3) {
    errors["configuration.statements"] =
      "Expected an array with at most 3 statements.";
    return [];
  }

  const result: StatementPayload[] = [];
  for (let index = 0; index < value.length; index += 1) {
    const path = `configuration.statements.${index}`;
    const statement = requestObject(value[index], path, errors);
    assertOnlyKeys(statement, ["action", "text"], path, errors);
    result.push({
      action: requestEnum(
        statement,
        "action",
        STATEMENT_ACTIONS,
        `${path}.action`,
        errors,
      ),
      text: requestString(
        statement,
        "text",
        `${path}.text`,
        8000,
        errors,
      ),
    });
  }

  const actions = result.map((statement) => statement.action);
  if (new Set(actions).size !== actions.length) {
    errors["configuration.statements"] =
      "Duplicate statement actions are not allowed.";
  }

  return result;
}

export function parseDashboard(
  catalogValue: unknown,
  listValue: unknown,
): UnknownObject {
  const catalog = backendObject(catalogValue, RPC.getCatalog);
  backendArray(catalog, "actionModes", RPC.getCatalog);
  backendArray(catalog, "targetKinds", RPC.getCatalog);
  backendArray(catalog, "appRoles", RPC.getCatalog);
  backendArray(catalog, "coworkers", RPC.getCatalog);
  backendArray(catalog, "eventDefinitions", RPC.getCatalog);

  if (!Array.isArray(listValue)) {
    throw new BackendContractError(RPC.getList);
  }

  return {
    catalog,
    documents: listValue,
  };
}

export function parseDocumentResult(
  value: unknown,
  rpcName:
    | typeof RPC.getDetail
    | typeof RPC.saveDocument
    | typeof RPC.archiveDocument,
  documentId?: string,
): UnknownObject {
  const document = backendObject(value, rpcName);
  const actualId = backendUuid(document, "id", rpcName);
  if (documentId !== undefined && actualId !== documentId) {
    throw new BackendContractError(rpcName);
  }
  return document;
}

export function parseReservation(value: unknown): UploadReservation {
  const result = backendObject(value, RPC.reserveUpload);
  const parsed: UploadReservation = {
    documentId: backendUuid(result, "documentId", RPC.reserveUpload),
    documentVersionId: backendUuid(
      result,
      "documentVersionId",
      RPC.reserveUpload,
    ),
    versionNumber: backendPositiveInteger(
      result,
      "versionNumber",
      RPC.reserveUpload,
    ),
    uploadSessionId: backendUuid(
      result,
      "uploadSessionId",
      RPC.reserveUpload,
    ),
    bucket: backendString(result, "bucket", RPC.reserveUpload),
    path: backendString(result, "path", RPC.reserveUpload),
    originalFilename: backendString(
      result,
      "originalFilename",
      RPC.reserveUpload,
    ),
    storedFilename: backendString(
      result,
      "storedFilename",
      RPC.reserveUpload,
    ),
    declaredMimeType: backendString(
      result,
      "declaredMimeType",
      RPC.reserveUpload,
    ),
    expectedSizeBytes: backendPositiveInteger(
      result,
      "expectedSizeBytes",
      RPC.reserveUpload,
    ),
    expiresAt: backendTimestamp(result, "expiresAt", RPC.reserveUpload),
  };

  if (parsed.bucket !== "coworker-documents") {
    throw new BackendContractError(RPC.reserveUpload);
  }
  return parsed;
}

export function parseActivation(
  value: unknown,
  reservation: UploadReservation,
): SignedUploadActivation {
  const result = backendObject(value, RPC.activateSignedUpload);
  const parsed: SignedUploadActivation = {
    documentId: backendUuid(
      result,
      "documentId",
      RPC.activateSignedUpload,
    ),
    documentVersionId: backendUuid(
      result,
      "documentVersionId",
      RPC.activateSignedUpload,
    ),
    uploadSessionId: backendUuid(
      result,
      "uploadSessionId",
      RPC.activateSignedUpload,
    ),
    bucket: backendString(result, "bucket", RPC.activateSignedUpload),
    path: backendString(result, "path", RPC.activateSignedUpload),
    expectedSizeBytes: backendPositiveInteger(
      result,
      "expectedSizeBytes",
      RPC.activateSignedUpload,
    ),
    expectedMimeType: backendString(
      result,
      "expectedMimeType",
      RPC.activateSignedUpload,
    ),
    issuedAt: backendTimestamp(
      result,
      "issuedAt",
      RPC.activateSignedUpload,
    ),
    expiresAt: backendTimestamp(
      result,
      "expiresAt",
      RPC.activateSignedUpload,
    ),
  };

  if (
    parsed.documentId !== reservation.documentId ||
    parsed.documentVersionId !== reservation.documentVersionId ||
    parsed.uploadSessionId !== reservation.uploadSessionId ||
    parsed.bucket !== reservation.bucket ||
    parsed.path !== reservation.path ||
    parsed.expectedSizeBytes !== reservation.expectedSizeBytes ||
    parsed.expectedMimeType !== reservation.declaredMimeType
  ) {
    throw new BackendContractError(RPC.activateSignedUpload);
  }

  return parsed;
}

export function parseUploadTarget(value: unknown): UploadTarget {
  const result = backendObject(value, RPC.getUploadTarget);
  const parsed: UploadTarget = {
    uploadSessionId: backendUuid(
      result,
      "uploadSessionId",
      RPC.getUploadTarget,
    ),
    sessionStatus: backendEnum(
      result,
      "sessionStatus",
      ["created", "uploaded", "finalized"] as const,
      RPC.getUploadTarget,
    ),
    finalized: backendBoolean(
      result,
      "finalized",
      RPC.getUploadTarget,
    ),
    documentId: backendUuid(
      result,
      "documentId",
      RPC.getUploadTarget,
    ),
    documentVersionId: backendUuid(
      result,
      "documentVersionId",
      RPC.getUploadTarget,
    ),
    documentVersionStatus: backendString(
      result,
      "documentVersionStatus",
      RPC.getUploadTarget,
    ),
    bucket: backendString(result, "bucket", RPC.getUploadTarget),
    path: backendString(result, "path", RPC.getUploadTarget),
    expectedSizeBytes: backendPositiveInteger(
      result,
      "expectedSizeBytes",
      RPC.getUploadTarget,
    ),
    expectedMimeType: backendString(
      result,
      "expectedMimeType",
      RPC.getUploadTarget,
    ),
    expiresAt: backendTimestamp(
      result,
      "expiresAt",
      RPC.getUploadTarget,
    ),
    contentSha256Base64: backendNullableString(
      result,
      "contentSha256Base64",
      RPC.getUploadTarget,
    ),
  };

  if (
    parsed.bucket !== "coworker-documents" ||
    !parsed.path.startsWith("operational/") ||
    parsed.finalized !== (parsed.sessionStatus === "finalized")
  ) {
    throw new BackendContractError(RPC.getUploadTarget);
  }

  return parsed;
}

export function parseFinalization(
  value: unknown,
  uploadSessionId: string,
): UnknownObject {
  const result = backendObject(value, RPC.finalizeUpload);
  if (
    backendUuid(result, "uploadSessionId", RPC.finalizeUpload) !==
      uploadSessionId ||
    backendBoolean(result, "finalized", RPC.finalizeUpload) !== true
  ) {
    throw new BackendContractError(RPC.finalizeUpload);
  }
  backendObject(result.documentVersion, RPC.finalizeUpload);
  return result;
}

export function parseVersion(
  value: unknown,
  rpcName: typeof RPC.configureVersion,
  documentVersionId: string,
): UnknownObject {
  const version = backendObject(value, rpcName);
  if (backendUuid(version, "id", rpcName) !== documentVersionId) {
    throw new BackendContractError(rpcName);
  }
  return version;
}

export function parsePublishResult(
  value: unknown,
  documentVersionId: string,
): UnknownObject {
  const result = backendObject(value, RPC.publishVersion);
  if (backendBoolean(result, "published", RPC.publishVersion) !== true) {
    throw new BackendContractError(RPC.publishVersion);
  }
  const document = backendObject(result.document, RPC.publishVersion);
  if (
    backendUuid(
      document,
      "currentPublishedVersionId",
      RPC.publishVersion,
    ) !== documentVersionId
  ) {
    throw new BackendContractError(RPC.publishVersion);
  }
  return result;
}

export function parseAssignmentList(value: unknown): unknown[] {
  if (!Array.isArray(value)) {
    throw new BackendContractError(RPC.getAssignmentList);
  }
  return value;
}

export function parseAssignment(
  value: unknown,
  assignmentId: string,
): UnknownObject {
  const assignment = backendObject(value, RPC.waiveAssignment);
  if (backendUuid(assignment, "id", RPC.waiveAssignment) !== assignmentId) {
    throw new BackendContractError(RPC.waiveAssignment);
  }
  return assignment;
}

export function parseCancelResult(
  value: unknown,
  uploadSessionId: string,
): CancelUploadResult {
  const result = backendObject(value, RPC.cancelUpload);
  const target = backendObject(result.cleanupTarget, RPC.cancelUpload);
  const parsed: CancelUploadResult = {
    uploadSessionId: backendUuid(
      result,
      "uploadSessionId",
      RPC.cancelUpload,
    ),
    cancelled: backendBoolean(result, "cancelled", RPC.cancelUpload) as true,
    cleanupStatus: backendEnum(
      result,
      "cleanupStatus",
      ["not_required", "pending", "completed", "failed"] as const,
      RPC.cancelUpload,
    ),
    cleanupTarget: {
      bucket: backendString(target, "bucket", RPC.cancelUpload),
      path: backendString(target, "path", RPC.cancelUpload),
    },
  };

  if (
    parsed.uploadSessionId !== uploadSessionId ||
    parsed.cancelled !== true ||
    parsed.cleanupTarget.bucket !== "coworker-documents" ||
    !parsed.cleanupTarget.path.startsWith("operational/")
  ) {
    throw new BackendContractError(RPC.cancelUpload);
  }

  return parsed;
}

export function parseCleanupResult(
  value: unknown,
  uploadSessionId: string,
): CleanupResult {
  const result = backendObject(value, RPC.recordCleanup);
  const parsed: CleanupResult = {
    uploadSessionId: backendUuid(
      result,
      "uploadSessionId",
      RPC.recordCleanup,
    ),
    cleanupStatus: backendEnum(
      result,
      "cleanupStatus",
      ["completed", "failed"] as const,
      RPC.recordCleanup,
    ),
    cleanupAttemptedAt: backendTimestamp(
      result,
      "cleanupAttemptedAt",
      RPC.recordCleanup,
    ),
    cleanupCompletedAt: backendNullableTimestamp(
      result,
      "cleanupCompletedAt",
      RPC.recordCleanup,
    ),
    failureCode: backendNullableString(
      result,
      "failureCode",
      RPC.recordCleanup,
    ),
  };

  if (parsed.uploadSessionId !== uploadSessionId) {
    throw new BackendContractError(RPC.recordCleanup);
  }
  return parsed;
}

export function parseDownloadTarget(
  value: unknown,
  documentVersionId: string,
  purpose: AdminDownloadPurpose,
): DownloadTarget {
  const result = backendObject(value, RPC.getDownloadTarget);
  const parsed: DownloadTarget = {
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
    parsed.documentVersionId !== documentVersionId ||
    parsed.purpose !== purpose ||
    parsed.bucket !== "coworker-documents" ||
    parsed.signedUrlExpiresInSeconds > 300
  ) {
    throw new BackendContractError(RPC.getDownloadTarget);
  }
  return parsed;
}
