export const RPC = {
  getPortal: "get_coworker_operational_document_portal",
  getDownloadTarget: "get_coworker_operational_download_target",
  recordAction: "record_coworker_operational_document_action",
  markNotificationRead: "mark_coworker_notification_read",
} as const;

export type RpcName = typeof RPC[keyof typeof RPC];
export type UnknownObject = { [key: string]: unknown };
export type OperationalAction = "acknowledged" | "accepted" | "declined";

export interface DownloadAction {
  action: "downloadDocumentVersion";
  documentVersionId: string;
}

export interface RecordAction {
  action: "recordAction";
  assignmentId: string;
  documentAction: OperationalAction;
  declineReason: string | null;
}

export interface MarkNotificationReadAction {
  action: "markNotificationRead";
  notificationId: string;
}

export type CoworkerOperationalRequest =
  | DownloadAction
  | RecordAction
  | MarkNotificationReadAction;

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
    super("Operational document request validation failed.");
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
  "downloadDocumentVersion",
  "recordAction",
  "markNotificationRead",
] as const;

const DOCUMENT_ACTIONS = [
  "acknowledged",
  "accepted",
  "declined",
] as const;

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function parseRequest(value: unknown): CoworkerOperationalRequest {
  const errors: { [field: string]: string } = {};
  const root = requestObject(value, errors);
  const action = requestEnum(root, "action", ACTIONS, "action", errors);

  switch (action) {
    case "downloadDocumentVersion":
      assertOnlyKeys(root, ["action", "documentVersionId"], errors);
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

    case "recordAction": {
      assertOnlyKeys(
        root,
        ["action", "assignmentId", "documentAction", "declineReason"],
        errors,
      );
      const documentAction = requestEnum(
        root,
        "documentAction",
        DOCUMENT_ACTIONS,
        "documentAction",
        errors,
      );
      const declineReason = requestNullableString(
        root,
        "declineReason",
        "declineReason",
        2000,
        errors,
      );

      if (documentAction === "declined" && declineReason === null) {
        errors.declineReason = "A decline reason is required.";
      }
      if (documentAction !== "declined" && declineReason !== null) {
        errors.declineReason =
          "declineReason is allowed only for declined actions.";
      }

      return validated(
        {
          action,
          assignmentId: requestUuid(
            root,
            "assignmentId",
            "assignmentId",
            errors,
          ),
          documentAction,
          declineReason,
        },
        errors,
      );
    }

    case "markNotificationRead":
      assertOnlyKeys(root, ["action", "notificationId"], errors);
      return validated(
        {
          action,
          notificationId: requestUuid(
            root,
            "notificationId",
            "notificationId",
            errors,
          ),
        },
        errors,
      );

    default:
      throwIfInvalid(errors);
      throw new RequestValidationError({
        action: "Unsupported operational document action.",
      });
  }
}

export function parsePortal(value: unknown, userId: string): UnknownObject {
  const portal = backendObject(value, RPC.getPortal);
  if (backendUuid(portal, "userId", RPC.getPortal) !== userId) {
    throw new BackendContractError(RPC.getPortal);
  }
  backendArray(portal, "assignments", RPC.getPortal);
  backendArray(portal, "notifications", RPC.getPortal);
  backendNonNegativeInteger(
    portal,
    "unreadNotificationCount",
    RPC.getPortal,
  );
  return portal;
}

export function parseAssignment(
  value: unknown,
  userId: string,
  assignmentId: string,
): UnknownObject {
  const assignment = backendObject(value, RPC.recordAction);
  if (
    backendUuid(assignment, "id", RPC.recordAction) !== assignmentId ||
    backendUuid(assignment, "userId", RPC.recordAction) !== userId
  ) {
    throw new BackendContractError(RPC.recordAction);
  }
  return assignment;
}

export function parseDownloadTarget(
  value: unknown,
  documentVersionId: string,
): DownloadTarget {
  const target = backendObject(value, RPC.getDownloadTarget);
  const parsed: DownloadTarget = {
    documentId: backendUuid(
      target,
      "documentId",
      RPC.getDownloadTarget,
    ),
    documentVersionId: backendUuid(
      target,
      "documentVersionId",
      RPC.getDownloadTarget,
    ),
    bucket: backendString(target, "bucket", RPC.getDownloadTarget),
    path: backendString(target, "path", RPC.getDownloadTarget),
    originalFilename: backendString(
      target,
      "originalFilename",
      RPC.getDownloadTarget,
    ),
    mimeType: backendString(target, "mimeType", RPC.getDownloadTarget),
    sizeBytes: backendPositiveInteger(
      target,
      "sizeBytes",
      RPC.getDownloadTarget,
    ),
    purpose: backendEnum(
      target,
      "purpose",
      ["self_download"] as const,
      RPC.getDownloadTarget,
    ),
    signedUrlExpiresInSeconds: backendPositiveInteger(
      target,
      "signedUrlExpiresInSeconds",
      RPC.getDownloadTarget,
    ),
  };

  if (
    parsed.documentVersionId !== documentVersionId ||
    parsed.bucket !== "coworker-documents" ||
    parsed.signedUrlExpiresInSeconds > 300
  ) {
    throw new BackendContractError(RPC.getDownloadTarget);
  }

  return parsed;
}

export function parseNotificationRead(
  value: unknown,
  notificationId: string,
): UnknownObject {
  const notification = backendObject(value, RPC.markNotificationRead);
  if (
    backendUuid(notification, "id", RPC.markNotificationRead) !==
      notificationId ||
    backendBoolean(notification, "read", RPC.markNotificationRead) !== true
  ) {
    throw new BackendContractError(RPC.markNotificationRead);
  }
  backendTimestamp(notification, "readAt", RPC.markNotificationRead);
  return notification;
}

function requestObject(
  value: unknown,
  errors: { [field: string]: string },
): UnknownObject {
  if (!isObject(value)) {
    errors.request = "Expected an object.";
    return {};
  }
  return value;
}

function assertOnlyKeys(
  source: UnknownObject,
  allowedKeys: readonly string[],
  errors: { [field: string]: string },
): void {
  const allowed = new Set(allowedKeys);
  for (const key of Object.keys(source)) {
    if (!allowed.has(key)) {
      errors[key] = "Unexpected field.";
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

function validated<T>(
  value: T,
  errors: { [field: string]: string },
): T {
  throwIfInvalid(errors);
  return value;
}

function throwIfInvalid(errors: { [field: string]: string }): void {
  if (Object.keys(errors).length > 0) {
    throw new RequestValidationError(errors);
  }
}

function backendObject(
  value: unknown,
  rpcName: RpcName,
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
  rpcName: RpcName,
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
