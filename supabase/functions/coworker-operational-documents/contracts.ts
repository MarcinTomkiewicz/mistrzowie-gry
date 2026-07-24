import {
  createContractReaders,
  type UnknownObject,
} from "../_shared/coworker-document-edge/contract-readers.ts";
import type { OperationalAssignment } from "../_shared/coworker-document-edge/operational-assignment-models.ts";
import { createOperationalAssignmentParser } from "../_shared/coworker-document-edge/operational-assignment-parser.ts";

export type { UnknownObject } from "../_shared/coworker-document-edge/contract-readers.ts";

export const RPC = {
  getPortal: "get_coworker_operational_document_portal",
  getDownloadTarget: "get_coworker_operational_download_target",
  recordAction: "record_coworker_operational_document_action",
  markNotificationRead: "mark_coworker_notification_read",
} as const;

export type RpcName = typeof RPC[keyof typeof RPC];
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

const contractReaders = createContractReaders<RpcName>({
  createRequestError: (fieldErrors) => new RequestValidationError(fieldErrors),
  createBackendError: (rpcName) => new BackendContractError(rpcName),
});

const {
  assertOnlyKeys,
  backendArray,
  backendBoolean,
  backendEnum,
  backendNonNegativeInteger,
  backendObject,
  backendPositiveInteger,
  backendString,
  backendTimestamp,
  backendUuid,
  requestEnum,
  requestNullableString,
  requestObject,
  requestUuid,
  throwIfRequestInvalid: throwIfInvalid,
  validated,
} = contractReaders;

const { parseOperationalAssignment } = createOperationalAssignmentParser(
  contractReaders,
  (rpcName) => new BackendContractError(rpcName),
);

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

export function parseRequest(value: unknown): CoworkerOperationalRequest {
  const errors: { [field: string]: string } = {};
  const root = requestObject(value, "", errors);
  const action = requestEnum(root, "action", ACTIONS, "action", errors);

  switch (action) {
    case "downloadDocumentVersion":
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

    case "recordAction": {
      assertOnlyKeys(
        root,
        ["action", "assignmentId", "documentAction", "declineReason"],
        "",
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
      assertOnlyKeys(root, ["action", "notificationId"], "", errors);
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
  const assignments = backendArray(portal, "assignments", RPC.getPortal).map(
    (assignment) => parseOperationalAssignment(assignment, RPC.getPortal),
  );
  if (assignments.some((assignment) => assignment.userId !== userId)) {
    throw new BackendContractError(RPC.getPortal);
  }
  backendArray(portal, "notifications", RPC.getPortal);
  backendNonNegativeInteger(
    portal,
    "unreadNotificationCount",
    RPC.getPortal,
  );
  return { ...portal, assignments };
}

export function parseAssignment(
  value: unknown,
  userId: string,
  assignmentId: string,
): OperationalAssignment {
  const assignment = parseOperationalAssignment(value, RPC.recordAction);
  if (
    assignment.id !== assignmentId ||
    assignment.userId !== userId
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
