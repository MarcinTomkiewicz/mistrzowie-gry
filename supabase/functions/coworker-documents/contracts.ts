export const RPC = {
  getPortal: "get_coworker_document_portal",
  reserveUpload: "reserve_coworker_document_upload",
  activateSignedUpload: "activate_coworker_document_signed_upload",
  finalizeUpload: "finalize_coworker_document_upload",
  cancelUpload: "cancel_coworker_document_upload",
  recordCleanup: "record_coworker_document_storage_cleanup_result",
  submitDocument: "submit_coworker_document",
  withdrawDocument: "withdraw_coworker_document",
  getDownloadTarget: "get_coworker_document_download_target",
  markNotificationRead: "mark_coworker_notification_read",
} as const;

export type RpcName = typeof RPC[keyof typeof RPC];
export type UnknownObject = { [key: string]: unknown };

export type SignatureDeclarationType =
  | "unsigned"
  | "handwritten"
  | "trusted_profile"
  | "qualified_electronic"
  | "other_electronic"
  | "unknown";

export type DocumentAction =
  | "reserveUpload"
  | "finalizeUpload"
  | "cancelUpload"
  | "submitDocument"
  | "withdrawDocument"
  | "downloadDocumentVersion"
  | "markNotificationRead";

export interface ReserveUploadAction {
  action: "reserveUpload";
  documentId: string | null;
  requirementId: string | null;
  documentDefinitionId: string | null;
  onboardingCaseId: string | null;
  originalFilename: string;
  declaredMimeType: string;
  sizeBytes: number;
  signatureDeclarationType: SignatureDeclarationType;
  title: string | null;
}

export interface UploadSessionAction {
  action: "finalizeUpload" | "cancelUpload";
  uploadSessionId: string;
}

export interface DocumentActionRequest {
  action: "submitDocument" | "withdrawDocument";
  documentId: string;
}

export interface DownloadAction {
  action: "downloadDocumentVersion";
  documentVersionId: string;
}

export interface NotificationAction {
  action: "markNotificationRead";
  notificationId: string;
}

export type CoworkerDocumentActionRequest =
  | ReserveUploadAction
  | UploadSessionAction
  | DocumentActionRequest
  | DownloadAction
  | NotificationAction;

export interface UploadReservation {
  userId: string;
  documentId: string;
  documentCreated: boolean;
  documentVersionId: string;
  versionNumber: number;
  uploadSessionId: string;
  bucket: string;
  path: string;
  originalFilename: string;
  storedFilename: string;
  declaredMimeType: string;
  expectedSizeBytes: number;
  signatureDeclarationType: SignatureDeclarationType;
  expiresAt: string;
}

export interface SignedUploadActivation {
  userId: string;
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

export interface SignedUploadData {
  signedUrl: string;
  token: string;
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
  purpose: "self_download";
  signedUrlExpiresInSeconds: number;
}

export class RequestValidationError extends Error {
  constructor(readonly fieldErrors: { [field: string]: string }) {
    super("Document request validation failed.");
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
  "reserveUpload",
  "finalizeUpload",
  "cancelUpload",
  "submitDocument",
  "withdrawDocument",
  "downloadDocumentVersion",
  "markNotificationRead",
] as const;

const SIGNATURE_TYPES = [
  "unsigned",
  "handwritten",
  "trusted_profile",
  "qualified_electronic",
  "other_electronic",
  "unknown",
] as const;

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const MIME_PATTERN =
  /^[a-z0-9][a-z0-9.+-]*\/[a-z0-9][a-z0-9.+-]*$/;

export function parseDocumentActionRequest(
  value: unknown,
): CoworkerDocumentActionRequest {
  const errors: { [field: string]: string } = {};
  const root = requestObject(value, "", errors);
  const action = requestEnum(
    root,
    "action",
    ACTIONS,
    "action",
    errors,
  );

  switch (action) {
    case "reserveUpload":
      return parseReserveUpload(root, errors);
    case "finalizeUpload":
    case "cancelUpload":
      assertOnlyKeys(root, ["action", "uploadSessionId"], "", errors);
      return {
        action,
        uploadSessionId: requestUuid(
          root,
          "uploadSessionId",
          "uploadSessionId",
          errors,
        ),
      };
    case "submitDocument":
    case "withdrawDocument":
      assertOnlyKeys(root, ["action", "documentId"], "", errors);
      return {
        action,
        documentId: requestUuid(
          root,
          "documentId",
          "documentId",
          errors,
        ),
      };
    case "downloadDocumentVersion":
      assertOnlyKeys(root, ["action", "documentVersionId"], "", errors);
      return {
        action,
        documentVersionId: requestUuid(
          root,
          "documentVersionId",
          "documentVersionId",
          errors,
        ),
      };
    case "markNotificationRead":
      assertOnlyKeys(root, ["action", "notificationId"], "", errors);
      return {
        action,
        notificationId: requestUuid(
          root,
          "notificationId",
          "notificationId",
          errors,
        ),
      };
    default:
      throwIfRequestInvalid(errors);
      throw new RequestValidationError({
        action: "Unsupported document action.",
      });
  }
}

function parseReserveUpload(
  root: UnknownObject,
  errors: { [field: string]: string },
): ReserveUploadAction {
  assertOnlyKeys(
    root,
    [
      "action",
      "documentId",
      "requirementId",
      "documentDefinitionId",
      "onboardingCaseId",
      "originalFilename",
      "declaredMimeType",
      "sizeBytes",
      "signatureDeclarationType",
      "title",
    ],
    "",
    errors,
  );

  const documentId = requestNullableUuid(
    root,
    "documentId",
    "documentId",
    errors,
  );
  const requirementId = requestNullableUuid(
    root,
    "requirementId",
    "requirementId",
    errors,
  );
  const documentDefinitionId = requestNullableUuid(
    root,
    "documentDefinitionId",
    "documentDefinitionId",
    errors,
  );
  const onboardingCaseId = requestNullableUuid(
    root,
    "onboardingCaseId",
    "onboardingCaseId",
    errors,
  );

  if (
    documentId === null &&
    requirementId === null &&
    documentDefinitionId === null
  ) {
    errors.documentDefinitionId =
      "Provide documentId, requirementId or documentDefinitionId.";
  }

  const originalFilename = requestString(
    root,
    "originalFilename",
    "originalFilename",
    255,
    errors,
  );
  if (
    originalFilename !== "" &&
    (/[/\\]/.test(originalFilename) || /[\u0000-\u001f\u007f]/.test(originalFilename))
  ) {
    errors.originalFilename = "Provide a file name without path separators.";
  }

  const declaredMimeType = requestString(
    root,
    "declaredMimeType",
    "declaredMimeType",
    150,
    errors,
  ).toLowerCase();
  if (declaredMimeType !== "" && !MIME_PATTERN.test(declaredMimeType)) {
    errors.declaredMimeType = "Provide a valid MIME type.";
  }

  const sizeBytes = requestInteger(
    root,
    "sizeBytes",
    "sizeBytes",
    1,
    26_214_400,
    errors,
  );

  const signatureDeclarationType = requestEnum(
    root,
    "signatureDeclarationType",
    SIGNATURE_TYPES,
    "signatureDeclarationType",
    errors,
  );

  const title = requestNullableString(
    root,
    "title",
    "title",
    250,
    errors,
  );

  throwIfRequestInvalid(errors);

  return {
    action: "reserveUpload",
    documentId,
    requirementId,
    documentDefinitionId,
    onboardingCaseId,
    originalFilename,
    declaredMimeType,
    sizeBytes,
    signatureDeclarationType,
    title,
  };
}

export function parsePortalResult(
  value: unknown,
  userId: string,
): UnknownObject {
  const result = backendObject(value, RPC.getPortal);
  if (backendString(result, "userId", RPC.getPortal) !== userId) {
    throw new BackendContractError(RPC.getPortal);
  }
  return result;
}

export function parseUploadReservation(
  value: unknown,
  userId: string,
): UploadReservation {
  const result = backendObject(value, RPC.reserveUpload);
  const reservation: UploadReservation = {
    userId: backendString(result, "userId", RPC.reserveUpload),
    documentId: backendUuid(result, "documentId", RPC.reserveUpload),
    documentCreated: backendBoolean(
      result,
      "documentCreated",
      RPC.reserveUpload,
    ),
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
    signatureDeclarationType: backendEnum(
      result,
      "signatureDeclarationType",
      SIGNATURE_TYPES,
      RPC.reserveUpload,
    ),
    expiresAt: backendTimestamp(result, "expiresAt", RPC.reserveUpload),
  };

  if (
    reservation.userId !== userId ||
    reservation.bucket !== "coworker-documents"
  ) {
    throw new BackendContractError(RPC.reserveUpload);
  }

  return reservation;
}

export function parseSignedUploadActivation(
  value: unknown,
  reservation: UploadReservation,
): SignedUploadActivation {
  const result = backendObject(value, RPC.activateSignedUpload);
  const activation: SignedUploadActivation = {
    userId: backendString(result, "userId", RPC.activateSignedUpload),
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
    activation.userId !== reservation.userId ||
    activation.documentId !== reservation.documentId ||
    activation.documentVersionId !== reservation.documentVersionId ||
    activation.uploadSessionId !== reservation.uploadSessionId ||
    activation.bucket !== reservation.bucket ||
    activation.path !== reservation.path ||
    activation.expectedSizeBytes !== reservation.expectedSizeBytes ||
    activation.expectedMimeType !== reservation.declaredMimeType
  ) {
    throw new BackendContractError(RPC.activateSignedUpload);
  }

  return activation;
}

export function parseSignedUploadData(value: unknown): SignedUploadData {
  const result = backendObject(value, null);
  return {
    signedUrl: backendString(result, "signedUrl", null),
    token: backendString(result, "token", null),
  };
}

export function parseDocumentResult(
  value: unknown,
  rpcName: typeof RPC.submitDocument | typeof RPC.withdrawDocument,
  userId: string,
  documentId: string,
): UnknownObject {
  const result = backendObject(value, rpcName);
  if (
    backendUuid(result, "id", rpcName) !== documentId ||
    backendUuid(result, "userId", rpcName) !== userId
  ) {
    throw new BackendContractError(rpcName);
  }
  return result;
}

export function parseFinalizationResult(
  value: unknown,
  userId: string,
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

  const document = backendObject(result.document, RPC.finalizeUpload);
  if (backendUuid(document, "userId", RPC.finalizeUpload) !== userId) {
    throw new BackendContractError(RPC.finalizeUpload);
  }

  return result;
}

export function parseCancelUploadResult(
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
    cancelled: backendBoolean(
      result,
      "cancelled",
      RPC.cancelUpload,
    ) as true,
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
    parsed.cleanupTarget.bucket !== "coworker-documents"
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
  userId: string,
  documentVersionId: string,
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
      ["self_download"] as const,
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
    target.bucket !== "coworker-documents" ||
    target.signedUrlExpiresInSeconds > 300 ||
    userId === ""
  ) {
    throw new BackendContractError(RPC.getDownloadTarget);
  }

  return target;
}

export function parseNotificationReadResult(
  value: unknown,
  notificationId: string,
): UnknownObject {
  const result = backendObject(value, RPC.markNotificationRead);
  if (
    backendUuid(result, "id", RPC.markNotificationRead) !== notificationId ||
    backendBoolean(result, "read", RPC.markNotificationRead) !== true
  ) {
    throw new BackendContractError(RPC.markNotificationRead);
  }
  backendTimestamp(result, "readAt", RPC.markNotificationRead);
  return result;
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

function throwIfRequestInvalid(errors: { [field: string]: string }): void {
  if (Object.keys(errors).length > 0) {
    throw new RequestValidationError(errors);
  }
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

function backendNullableString(
  source: UnknownObject,
  key: string,
  rpcName: RpcName,
): string | null {
  const value = source[key];
  if (value === null) {
    return null;
  }
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

function backendTimestamp(
  source: UnknownObject,
  key: string,
  rpcName: RpcName | null,
): string {
  const value = backendString(source, key, rpcName);
  if (Number.isNaN(Date.parse(value))) {
    throw new BackendContractError(rpcName);
  }
  return value;
}

function backendNullableTimestamp(
  source: UnknownObject,
  key: string,
  rpcName: RpcName,
): string | null {
  const value = source[key];
  if (value === null) {
    return null;
  }
  if (typeof value !== "string" || Number.isNaN(Date.parse(value))) {
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
