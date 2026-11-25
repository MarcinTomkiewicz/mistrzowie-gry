import {
  COWORKER_DOCUMENT_DOWNLOAD_TARGETS,
  COWORKER_DOCUMENT_REQUIRED_ACTIONS,
  COWORKER_DOCUMENT_REVIEW_DECISIONS,
} from "../../../src/app/core/types/coworker-onboarding.ts";
import { DocumentRequestError } from "./document-api.ts";
import {
  readEnum,
  readFiles,
  readObject,
  readSingleFile,
  readText,
  readUuid,
} from "./document-request.ts";

const COWORKER_UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const REJECTION_REASON_MAX_LENGTH = 1_000;
const CATEGORY_NAME_MAX_LENGTH = 80;

export function parseAdminJsonRequest(value: unknown) {
  const source = readObject(value);
  const action = readText(source["action"]);

  switch (action) {
    case "listOnboardingCandidates":
    case "listOnboardings":
    case "listSharedDocuments":
    case "listDocumentCategories":
      return { action } as const;
    case "saveDocumentCategory":
      return {
        action,
        category_key: source["category_key"] === null
          ? null
          : readCategoryKey(source["category_key"]),
        name: readCategoryName(source["name"]),
      } as const;
    case "retireDocumentCategory":
      return {
        action,
        category_key: readCategoryKey(source["category_key"]),
      } as const;
    case "setDocumentCategory":
      return {
        action,
        onboarding_id: readCoworkerUuid(source["onboarding_id"]),
        document_ids: readUuidArray(source["document_ids"]),
        category_key: readCategoryKey(source["category_key"]),
      } as const;
    case "listDocumentCategoryHistory":
      return {
        action,
        category_key: source["category_key"] == null
          ? null
          : readCategoryKey(source["category_key"]),
      } as const;
    case "getOnboarding":
    case "completeOnboarding":
    case "cancelOnboarding":
      return {
        action,
        onboarding_id: readCoworkerUuid(source["onboarding_id"]),
      } as const;
    case "startOnboarding":
      return { action, user_id: readCoworkerUuid(source["user_id"]) } as const;
    case "removePrivateDocument":
    case "archiveSharedDocument":
    case "listSharedDocumentAssignments":
      return {
        action,
        document_id: readCoworkerUuid(source["document_id"]),
      } as const;
    case "reviewSignedDocument":
      return parseReviewRequest(source);
    case "getDownloadUrl":
      return parseAdminDownloadRequest(source);
    default:
      throw new DocumentRequestError();
  }
}

export function parseCoworkerJsonRequest(value: unknown) {
  const source = readObject(value);
  const action = readText(source["action"]);

  switch (action) {
    case "getPortal":
      return { action } as const;
    case "acknowledgeDocuments":
      return {
        action,
        assignment_ids: readUuidArray(source["assignment_ids"]),
      } as const;
    case "getDownloadUrl":
      return {
        action,
        assignment_id: readCoworkerUuid(source["assignment_id"]),
        target: readEnum(source["target"], COWORKER_DOCUMENT_DOWNLOAD_TARGETS),
      } as const;
    default:
      throw new DocumentRequestError();
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
      throw new DocumentRequestError();
    }
    return {
      action,
      onboarding_id: readCoworkerUuid(formData.get("onboarding_id")),
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
  throw new DocumentRequestError();
}

export function parseCoworkerMultipartRequest(
  formData: FormData,
) {
  if (readText(formData.get("action")) !== "uploadSignedDocument") {
    throw new DocumentRequestError();
  }
  if (readText(formData.get("signed_declared")) !== "true") {
    throw new DocumentRequestError();
  }
  return {
    action: "uploadSignedDocument",
    assignment_id: readCoworkerUuid(formData.get("assignment_id")),
    file: readSingleFile(formData, "file"),
  } as const;
}

function parseReviewRequest(source: Record<string, unknown>) {
  const decision = readEnum(
    source["decision"],
    COWORKER_DOCUMENT_REVIEW_DECISIONS,
  );
  const rejectionReason = readNullableString(
    source["rejection_reason"],
    REJECTION_REASON_MAX_LENGTH,
  );
  if (decision === "accepted" && rejectionReason !== null) {
    throw new DocumentRequestError();
  }
  if (decision === "rejected" && rejectionReason === null) {
    throw new DocumentRequestError();
  }
  return {
    action: "reviewSignedDocument",
    assignment_id: readCoworkerUuid(source["assignment_id"]),
    decision,
    rejection_reason: rejectionReason,
  } as const;
}

function parseAdminDownloadRequest(source: Record<string, unknown>) {
  const target = readEnum(
    source["target"],
    COWORKER_DOCUMENT_DOWNLOAD_TARGETS,
  );
  if (target === "source") {
    const onboardingId = readNullableUuid(source["onboarding_id"]);
    if (onboardingId !== null) {
      return {
        action: "getDownloadUrl",
        target,
        version_id: readCoworkerUuid(source["version_id"]),
        onboarding_id: onboardingId,
      } as const;
    }
    return {
      action: "getDownloadUrl",
      target,
      document_id: readCoworkerUuid(source["document_id"]),
      onboarding_id: null,
    } as const;
  }
  return {
    action: "getDownloadUrl",
    target,
    assignment_id: readCoworkerUuid(source["assignment_id"]),
    onboarding_id: readCoworkerUuid(source["onboarding_id"]),
  } as const;
}

function readPrivateDocumentMetadata(formData: FormData) {
  const value = readText(formData.get("documents"));
  let parsed: unknown;
  try {
    parsed = JSON.parse(value);
  } catch {
    throw new DocumentRequestError();
  }
  if (!Array.isArray(parsed) || parsed.length === 0) {
    throw new DocumentRequestError();
  }
  return parsed.map((item) => {
    const source = readObject(item);
    const requiresSignedUpload = source["requires_signed_upload"];
    const requiredAction = source["required_action"] === undefined
      ? undefined
      : readEnum(source["required_action"], COWORKER_DOCUMENT_REQUIRED_ACTIONS);
    const category = source["category"];
    if (
      typeof requiresSignedUpload !== "boolean" ||
      (requiredAction !== undefined &&
        requiresSignedUpload !== (requiredAction === "upload_signed"))
    ) {
      throw new DocumentRequestError();
    }
    return {
      title: readText(source["title"]),
      requires_signed_upload: requiresSignedUpload,
      ...(requiredAction === undefined
        ? {}
        : { required_action: requiredAction }),
      ...(category === undefined
        ? {}
        : { category: readCategoryKey(category) }),
    };
  });
}

function readCategoryKey(value: unknown): string {
  if (typeof value !== "string" || value.trim() === "") {
    throw new DocumentRequestError();
  }
  return value;
}

function readCategoryName(value: unknown): string {
  const name = readText(value);
  if ([...name].length > CATEGORY_NAME_MAX_LENGTH || /\p{Cc}/u.test(name)) {
    throw new DocumentRequestError();
  }
  return name;
}

function readNullableString(value: unknown, maxLength: number): string | null {
  if (value === null) return null;
  const normalized = readText(value);
  if (normalized.length > maxLength) {
    throw new DocumentRequestError();
  }
  return normalized;
}

function readCoworkerUuid(value: unknown): string {
  return readUuid(value, COWORKER_UUID_PATTERN);
}

function readNullableUuid(value: unknown): string | null {
  if (value === null || value === "") return null;
  return readCoworkerUuid(value);
}

function readUuidArray(value: unknown): string[] {
  if (!Array.isArray(value) || value.length === 0) {
    throw new DocumentRequestError();
  }
  const ids = value.map(readCoworkerUuid);
  if (new Set(ids.map((id) => id.toLowerCase())).size !== ids.length) {
    throw new DocumentRequestError();
  }
  return ids;
}

function readBooleanText(value: unknown): boolean {
  value = readText(value);
  if (value !== "true" && value !== "false") {
    throw new DocumentRequestError();
  }
  return value === "true";
}
