import {
  CONFIGURATION_MODES,
  CONTRACT_FAMILY_KEY,
  isContractConfiguration,
  isContractFamilyLabel,
  isContractLabel,
  isContractPages,
  trimContractFamilyLabel,
} from "../../../src/app/core/types/contract-template-configuration.ts";

import { DocumentRequestError } from "../_shared/document-api.ts";
import {
  readEnum,
  readObject,
  readSingleFile,
  readText,
  readUuid,
} from "../_shared/document-request.ts";
import { ARTIFACT_TYPES, LINK_KINDS, PARTY_KINDS } from "./contracts.ts";

export function parseJsonRequest(value: unknown) {
  const source = readObject(value);
  const action = source["action"];
  switch (action) {
    case "listTemplates":
    case "listFamilies":
      requireKeys(source, []);
      return { action } as const;
    case "listAgreements":
      return { action } as const;
    case "createFamily": {
      requireKeys(source, ["family", "label"]);
      const label = source["label"];
      if (!isContractLabel(label)) throw new DocumentRequestError();
      return {
        action,
        args: { p_family: readFamily(source["family"]), p_label: label },
      } as const;
    }
    case "renameFamily":
      requireKeys(source, ["family", "expected_label", "label"]);
      return {
        action,
        args: {
          p_family: readFamily(source["family"]),
          p_expected_label: readFamilyLabel(source["expected_label"]),
          p_label: readFamilyLabel(source["label"]),
        },
      } as const;
    case "getTemplateConfiguration":
      requireKeys(source, ["template_id", "mode"]);
      return {
        action,
        args: {
          p_template_id: readUuid(source["template_id"]).toLowerCase(),
          p_mode: readEnum(source["mode"], CONFIGURATION_MODES),
        },
      } as const;
    case "saveTemplateConfiguration": {
      requireKeys(source, [...REVISION_KEYS, "configuration"]);
      const configuration = source["configuration"];
      if (!isContractConfiguration(configuration)) {
        throw new DocumentRequestError();
      }
      return {
        action,
        args: { ...readRevisionArgs(source), p_configuration: configuration },
      } as const;
    }
    case "copyTemplateConfiguration": {
      requireKeys(source, [
        ...REVISION_KEYS,
        "source_template_id",
        "source_revision",
        "pages",
      ]);
      const pages = source["pages"];
      if (!isContractPages(pages)) throw new DocumentRequestError();
      return {
        action,
        args: {
          ...readRevisionArgs(source),
          p_source_template_id: readUuid(source["source_template_id"])
            .toLowerCase(),
          p_source_revision: readRevision(source["source_revision"]),
          p_pages: pages,
        },
      } as const;
    }
    case "approveTemplate": {
      requireKeys(source, [...REVISION_KEYS, "confirm_preview"]);
      const confirmed = source["confirm_preview"];
      if (typeof confirmed !== "boolean") throw new DocumentRequestError();
      return {
        action,
        args: { ...readRevisionArgs(source), p_confirm_preview: confirmed },
      } as const;
    }
    case "reassignTemplate":
      requireKeys(source, [
        ...REVISION_KEYS,
        "expected_family",
        "target_family",
      ]);
      return {
        action,
        args: {
          ...readRevisionArgs(source),
          p_expected_family: readFamily(source["expected_family"]),
          p_target_family: readFamily(source["target_family"]),
        },
      } as const;
    case "deleteTemplate": {
      const confirmActive = source["confirm_active"];
      if (
        typeof confirmActive !== "boolean" || Object.keys(source).length !== 3
      ) {
        throw new DocumentRequestError();
      }
      return {
        action,
        templateId: readUuid(source["template_id"]).toLowerCase(),
        confirmActive,
      } as const;
    }
    case "getDownloadUrl":
      requireKeys(source, ["artifact_type", "artifact_id"]);
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
      if ([...form.keys()].length !== 3) throw new DocumentRequestError();
      return {
        action,
        file,
        family: readFamily(form.get("family")),
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

const REVISION_KEYS = [
  "template_id",
  "pdf_sha256",
  "expected_revision",
] as const;

function requireKeys(
  source: Record<string, unknown>,
  keys: readonly string[],
): void {
  if (
    Object.keys(source).length !== keys.length + 1 ||
    !keys.every((key) => Object.hasOwn(source, key))
  ) {
    throw new DocumentRequestError();
  }
}

function readRevisionArgs(source: Record<string, unknown>) {
  const sha = source["pdf_sha256"];
  if (typeof sha !== "string" || !/^[a-f0-9]{64}$/.test(sha)) {
    throw new DocumentRequestError();
  }
  return {
    p_template_id: readUuid(source["template_id"]).toLowerCase(),
    p_pdf_sha256: sha,
    p_expected_revision: readRevision(source["expected_revision"]),
  };
}

function readRevision(value: unknown): number {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 0) {
    throw new DocumentRequestError();
  }
  return value;
}

function readFamily(value: unknown): string {
  if (typeof value !== "string" || !CONTRACT_FAMILY_KEY.test(value)) {
    throw new DocumentRequestError();
  }
  return value;
}

function readFamilyLabel(value: unknown): string {
  if (typeof value !== "string") throw new DocumentRequestError();
  const label = trimContractFamilyLabel(value);
  if (!isContractFamilyLabel(label)) throw new DocumentRequestError();
  return label;
}

function readOptionalText(value: FormDataEntryValue | null): string | null {
  if (value === null || (typeof value === "string" && value.trim() === "")) {
    return null;
  }
  return readText(value);
}
