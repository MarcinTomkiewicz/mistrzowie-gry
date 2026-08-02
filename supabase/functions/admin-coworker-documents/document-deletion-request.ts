import {
  COWORKER_DOCUMENT_PRESERVATION_KINDS,
  type CoworkerDocumentPreservationKind,
} from "../_shared/coworker-document-edge/coworker-document-deletion-models.ts";
import {
  isObject,
  isOneOf,
} from "../_shared/coworker-document-edge/contract-reader-foundation.ts";
import { adminDocumentReaders, RequestValidationError } from "./contracts.ts";

const ADMIN_DOCUMENT_DELETION_ACTIONS = [
  "getDeletionCapabilities",
  "deleteDocumentVersion",
  "deleteDocument",
  "setDocumentVersionPreservation",
] as const;

export interface GetAdminDeletionCapabilitiesAction {
  action: "getDeletionCapabilities";
  userId: string;
  documentId: string;
}

export interface DeleteAdminDocumentVersionAction {
  action: "deleteDocumentVersion";
  userId: string;
  documentId: string;
  documentVersionId: string;
}

export interface DeleteAdminDocumentAction {
  action: "deleteDocument";
  userId: string;
  documentId: string;
}

export interface SetDocumentVersionPreservationAction {
  action: "setDocumentVersionPreservation";
  userId: string;
  documentId: string;
  documentVersionId: string;
  preservationKind: CoworkerDocumentPreservationKind | null;
  note: string | null;
}

export type AdminDocumentDeletionAction =
  | GetAdminDeletionCapabilitiesAction
  | DeleteAdminDocumentVersionAction
  | DeleteAdminDocumentAction
  | SetDocumentVersionPreservationAction;

const {
  assertOnlyKeys,
  requestEnum,
  requestNullableString,
  requestObject,
  requestUuid,
  validated,
} = adminDocumentReaders;

export function isAdminDocumentDeletionAction(value: unknown): boolean {
  return isObject(value) &&
    isOneOf(value.action, ADMIN_DOCUMENT_DELETION_ACTIONS);
}

export function parseAdminDocumentDeletionAction(
  value: unknown,
): AdminDocumentDeletionAction {
  const errors: Record<string, string> = {};
  const root = requestObject(value, "", errors);
  const action = requestEnum(
    root,
    "action",
    ADMIN_DOCUMENT_DELETION_ACTIONS,
    "action",
    errors,
  );
  const userId = requestUuid(root, "userId", "userId", errors);
  const documentId = requestUuid(root, "documentId", "documentId", errors);

  switch (action) {
    case "getDeletionCapabilities":
    case "deleteDocument":
      assertOnlyKeys(root, ["action", "userId", "documentId"], "", errors);
      return validated({ action, userId, documentId }, errors);
    case "deleteDocumentVersion":
      assertOnlyKeys(
        root,
        ["action", "userId", "documentId", "documentVersionId"],
        "",
        errors,
      );
      return validated({
        action,
        userId,
        documentId,
        documentVersionId: requestUuid(
          root,
          "documentVersionId",
          "documentVersionId",
          errors,
        ),
      }, errors);
    case "setDocumentVersionPreservation":
      assertOnlyKeys(
        root,
        [
          "action",
          "userId",
          "documentId",
          "documentVersionId",
          "preservationKind",
          "note",
        ],
        "",
        errors,
      );
      return validated({
        action,
        userId,
        documentId,
        documentVersionId: requestUuid(
          root,
          "documentVersionId",
          "documentVersionId",
          errors,
        ),
        preservationKind: root.preservationKind === null ? null : requestEnum(
          root,
          "preservationKind",
          COWORKER_DOCUMENT_PRESERVATION_KINDS,
          "preservationKind",
          errors,
        ),
        note: requestNullableString(root, "note", "note", 4000, errors),
      }, errors);
    default:
      throw new RequestValidationError({
        action: "Unsupported admin document deletion action.",
      });
  }
}
