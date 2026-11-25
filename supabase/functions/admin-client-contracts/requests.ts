import { DocumentRequestError } from "../_shared/document-api.ts";
import {
  readEnum,
  readObject,
  readSingleFile,
  readText,
  readUuid,
} from "../_shared/document-request.ts";
import {
  ARTIFACT_TYPES,
  LINK_KINDS,
  PARTY_KINDS,
  TEMPLATE_FAMILIES,
} from "./contracts.ts";

export function parseJsonRequest(value: unknown) {
  const source = readObject(value);
  const action = source["action"];
  switch (action) {
    case "listTemplates":
    case "listAgreements":
      return { action } as const;
    case "approveTemplate":
      return {
        action,
        templateId: readUuid(source["template_id"]).toLowerCase(),
        approvalReference: readText(source["approval_reference"]),
      } as const;
    case "getDownloadUrl":
      return {
        action,
        artifactType: readEnum(source["artifact_type"], ARTIFACT_TYPES),
        artifactId: readUuid(source["artifact_id"]).toLowerCase(),
      } as const;
    default:
      throw new DocumentRequestError();
  }
}

export function parseUploadRequest(form: FormData) {
  const file = readSingleFile(form, "file");
  const action = form.get("action");
  switch (action) {
    case "uploadTemplate":
      return {
        action,
        file,
        family: readEnum(form.get("family"), TEMPLATE_FAMILIES),
        sourceDocumentUrl: readSourceDocumentUrl(
          form.get("source_document_url"),
        ),
      } as const;
    case "saveAgreement": {
      const partyLabel = readText(form.get("party_label"));
      const linkKind = readEnum(form.get("link_kind"), LINK_KINDS);
      const rawLinkId = readOptionalText(form.get("link_id"));
      if (
        [...partyLabel].length > 200 ||
        (linkKind === "none") !== (rawLinkId === null)
      ) {
        throw new DocumentRequestError();
      }
      return {
        action,
        file,
        templateId: readUuid(form.get("template_id")).toLowerCase(),
        partyKind: readEnum(form.get("party_kind"), PARTY_KINDS),
        partyLabel,
        partyEmail: readOptionalText(form.get("party_email")),
        linkKind,
        linkId: rawLinkId === null ? null : readUuid(rawLinkId).toLowerCase(),
      } as const;
    }
    default:
      throw new DocumentRequestError();
  }
}

function readSourceDocumentUrl(value: unknown): string {
  const text = readText(value);
  let url: URL;
  try {
    url = new URL(text);
  } catch {
    throw new DocumentRequestError();
  }
  if (
    url.origin !== "https://docs.google.com" ||
    url.username !== "" || url.password !== "" ||
    !url.pathname.startsWith("/document/") || url.pathname === "/document/"
  ) {
    throw new DocumentRequestError();
  }
  return text;
}

function readOptionalText(value: FormDataEntryValue | null): string | null {
  if (value === null || (typeof value === "string" && value.trim() === "")) {
    return null;
  }
  return readText(value);
}
