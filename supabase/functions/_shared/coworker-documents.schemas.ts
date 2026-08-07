import {
  COWORKER_DOCUMENT_DOWNLOAD_TARGETS,
  COWORKER_DOCUMENT_REVIEW_DECISIONS,
} from "../../../src/app/core/types/coworker-onboarding.ts";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const REJECTION_REASON_MAX_LENGTH = 1_000;

type JsonObject = { [key: string]: unknown };

export class CoworkerDocumentRequestError extends Error {
  constructor() {
    super("Coworker document request validation failed.");
    this.name = "CoworkerDocumentRequestError";
  }
}

export function parseAdminJsonRequest(value: unknown) {
  const source = readObject(value);
  const action = readText(source["action"]);

  switch (action) {
    case "listOnboardings":
    case "listSharedDocuments":
      return { action } as const;
    case "getOnboarding":
    case "completeOnboarding":
      return {
        action,
        onboarding_id: readUuid(source["onboarding_id"]),
      } as const;
    case "startOnboarding":
      return { action, user_id: readUuid(source["user_id"]) } as const;
    case "removePrivateDocument":
    case "archiveSharedDocument":
    case "listSharedDocumentAssignments":
      return { action, document_id: readUuid(source["document_id"]) } as const;
    case "reviewSignedDocument":
      return parseReviewRequest(source);
    case "getDownloadUrl":
      return parseAdminDownloadRequest(source);
    default:
      throw invalid();
  }
}

export function parseCoworkerJsonRequest(value: unknown) {
  const source = readObject(value);
  const action = readText(source["action"]);

  switch (action) {
    case "getPortal":
      return { action } as const;
    case "acknowledgeSharedDocuments":
      return {
        action,
        assignment_ids: readUuidArray(source["assignment_ids"]),
      } as const;
    case "getDownloadUrl":
      return {
        action,
        assignment_id: readUuid(source["assignment_id"]),
        target: readEnum(source["target"], COWORKER_DOCUMENT_DOWNLOAD_TARGETS),
      } as const;
    default:
      throw invalid();
  }
}

export function parseAdminMultipartRequest(
  formData: FormData,
) {
  const action = readText(formData.get("action"));
  if (action === "uploadPrivateDocuments") {
    const documents = readPrivateDocumentMetadata(formData);
    const files = readFiles(formData, "files");
    if (documents.length !== files.length) {
      throw invalid();
    }
    return {
      action,
      onboarding_id: readUuid(formData.get("onboarding_id")),
      documents,
      files,
    } as const;
  }
  if (action === "uploadSharedDocument") {
    return {
      action,
      document_id: readNullableUuid(formData.get("document_id")),
      title: readText(formData.get("title")),
      assign_after_onboarding: readBooleanText(
        formData.get("assign_after_onboarding"),
      ),
      file: readSingleFile(formData, "file"),
    } as const;
  }
  throw invalid();
}

export function parseCoworkerMultipartRequest(
  formData: FormData,
) {
  if (readText(formData.get("action")) !== "uploadSignedDocument") {
    throw invalid();
  }
  if (readText(formData.get("signed_declared")) !== "true") {
    throw invalid();
  }
  return {
    action: "uploadSignedDocument",
    assignment_id: readUuid(formData.get("assignment_id")),
    file: readSingleFile(formData, "file"),
  } as const;
}

export type AdminJsonRequest = ReturnType<typeof parseAdminJsonRequest>;
export type CoworkerJsonRequest = ReturnType<typeof parseCoworkerJsonRequest>;
export type AdminMultipartRequest = ReturnType<
  typeof parseAdminMultipartRequest
>;
export type CoworkerMultipartRequest = ReturnType<
  typeof parseCoworkerMultipartRequest
>;

function parseReviewRequest(source: JsonObject) {
  const decision = readEnum(
    source["decision"],
    COWORKER_DOCUMENT_REVIEW_DECISIONS,
  );
  const rejectionReason = readNullableString(
    source,
    "rejection_reason",
    REJECTION_REASON_MAX_LENGTH,
  );
  if (decision === "accepted" && rejectionReason !== null) {
    throw invalid();
  }
  if (decision === "rejected" && rejectionReason === null) {
    throw invalid();
  }
  return {
    action: "reviewSignedDocument",
    assignment_id: readUuid(source["assignment_id"]),
    decision,
    rejection_reason: rejectionReason,
  } as const;
}

function parseAdminDownloadRequest(source: JsonObject) {
  const target = readEnum(
    source["target"],
    COWORKER_DOCUMENT_DOWNLOAD_TARGETS,
  );
  if (target === "source") {
    return {
      action: "getDownloadUrl",
      target,
      document_id: readUuid(source["document_id"]),
      onboarding_id: readNullableUuid(source["onboarding_id"]),
    } as const;
  }
  return {
    action: "getDownloadUrl",
    target,
    assignment_id: readUuid(source["assignment_id"]),
    onboarding_id: readUuid(source["onboarding_id"]),
  } as const;
}

function readPrivateDocumentMetadata(formData: FormData) {
  const value = readText(formData.get("documents"));
  let parsed: unknown;
  try {
    parsed = JSON.parse(value) as unknown;
  } catch {
    throw invalid();
  }
  if (!Array.isArray(parsed) || parsed.length === 0) {
    throw invalid();
  }
  return parsed.map((item) => {
    const source = readObject(item);
    const requiresSignedUpload = source["requires_signed_upload"];
    if (typeof requiresSignedUpload !== "boolean") {
      throw invalid();
    }
    return {
      title: readText(source["title"]),
      requires_signed_upload: requiresSignedUpload,
    };
  });
}

function readObject(value: unknown): JsonObject {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw invalid();
  }
  return value as JsonObject;
}

function readText(value: unknown): string {
  if (typeof value !== "string" || value.trim() === "") {
    throw invalid();
  }
  return value.trim();
}

function readNullableString(
  source: JsonObject,
  key: string,
  maxLength: number,
): string | null {
  const value = source[key];
  if (value === null) return null;
  if (typeof value !== "string" || value.trim() === "") {
    throw invalid();
  }
  const normalized = value.trim();
  if (normalized.length > maxLength) {
    throw invalid();
  }
  return normalized;
}

function readUuid(value: unknown): string {
  return validateUuid(readText(value));
}

function readNullableUuid(value: unknown): string | null {
  if (value === null || value === "") return null;
  if (typeof value !== "string") {
    throw invalid();
  }
  return validateUuid(value.trim());
}

function readUuidArray(value: unknown): string[] {
  if (!Array.isArray(value) || value.length === 0) {
    throw invalid();
  }
  const ids = value.map((item) => {
    if (typeof item !== "string") {
      throw invalid();
    }
    return validateUuid(item.trim());
  });
  if (new Set(ids).size !== ids.length) {
    throw invalid();
  }
  return ids;
}

function readEnum<const Values extends readonly string[]>(
  value: unknown,
  values: Values,
): Values[number] {
  if (typeof value !== "string" || !values.includes(value)) {
    throw invalid();
  }
  return value as Values[number];
}

function readBooleanText(value: unknown): boolean {
  value = readText(value);
  if (value !== "true" && value !== "false") {
    throw invalid();
  }
  return value === "true";
}

function readFiles(formData: FormData, key: string): File[] {
  const files = formData.getAll(key);
  if (files.length === 0 || files.some((value) => !(value instanceof File))) {
    throw invalid();
  }
  return files as File[];
}

function readSingleFile(formData: FormData, key: string): File {
  const files = readFiles(formData, key);
  if (files.length !== 1) throw invalid();
  return files[0];
}

function validateUuid(value: string): string {
  if (!UUID_PATTERN.test(value)) throw invalid();
  return value;
}

function invalid(): CoworkerDocumentRequestError {
  return new CoworkerDocumentRequestError();
}
