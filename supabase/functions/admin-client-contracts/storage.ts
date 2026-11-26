import type { SupabaseClient } from "npm:@supabase/supabase-js@^2";
import { CONTRACT_FAMILY_KEY } from "../../../src/app/core/types/contract-template-configuration.ts";

import {
  DocumentContractError,
  DocumentPostCommitCleanupError,
  DocumentWriteOutcomeUnknownError,
  isConfirmedDocumentRpcRejection,
  readSingleDocumentRpc,
  shouldCompensateDocumentRegistration,
} from "../_shared/document-api.ts";
import {
  isConfirmedDocumentUploadRejection,
  privatePdfStorage,
} from "../_shared/private-pdf-storage.ts";
import {
  type ArtifactType,
  CLIENT_CONTRACT_PDF_MAX_BYTES,
  CLIENT_CONTRACTS_BUCKET,
  type ClientContractsDatabase,
  type ContractFileLocation,
  RPC,
} from "./contracts.ts";
import type { parseUploadRequest } from "./requests.ts";

const { readPdfFile, uploadPdf, removeDocumentPaths, createDocumentDownload } =
  privatePdfStorage(CLIENT_CONTRACTS_BUCKET, CLIENT_CONTRACT_PDF_MAX_BYTES);
const TEMPLATE_PATH = new RegExp(
  String.raw`^templates/(?:${
    CONTRACT_FAMILY_KEY.source.slice(1, -1)
  })/[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}\.pdf$`,
);

type ContractClient = SupabaseClient<ClientContractsDatabase>;
type UploadRequest = ReturnType<typeof parseUploadRequest>;

export async function storeContractPdf(
  client: ContractClient,
  storageClient: SupabaseClient,
  request: UploadRequest,
  requestId: string,
) {
  if (request.action === "saveAgreement") {
    await getContractFile(client, "active_template", request.templateId);
  }

  const bytes = await readPdfFile(request.file);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  const directory = request.action === "uploadTemplate"
    ? `templates/${request.family}`
    : "agreements";
  const path = `${directory}/${crypto.randomUUID()}.pdf`;
  const metadata = {
    p_storage_path: path,
    p_pdf_sha256: Array.from(
      new Uint8Array(digest),
      (byte) => byte.toString(16).padStart(2, "0"),
    )
      .join(""),
    p_size_bytes: bytes.byteLength,
    p_original_filename: request.file.name,
  };

  try {
    await uploadPdf(storageClient, path, bytes, requestId);
  } catch (error) {
    if (isConfirmedDocumentUploadRejection(error)) throw error;
    throw new DocumentWriteOutcomeUnknownError("UPLOAD_OUTCOME_UNKNOWN");
  }

  try {
    if (request.action === "uploadTemplate") {
      return await readSingleDocumentRpc(
        RPC.registerTemplate,
        client.rpc(RPC.registerTemplate, {
          ...metadata,
          p_family: request.family,
        }),
      );
    }
    return await readSingleDocumentRpc(
      RPC.registerAgreement,
      client.rpc(RPC.registerAgreement, {
        ...metadata,
        p_template_id: request.templateId,
        p_party_kind: request.partyKind,
        p_party_label: request.partyLabel,
        p_party_email: request.partyEmail,
        p_link_kind: request.linkKind,
        p_link_id: request.linkId,
      }),
    );
  } catch (error) {
    if (
      !shouldCompensateDocumentRegistration(error, {
        requestId,
        storagePath: path,
      })
    ) {
      throw new DocumentWriteOutcomeUnknownError(
        "REGISTRATION_OUTCOME_UNKNOWN",
      );
    }
    try {
      await removeDocumentPaths(storageClient, [path]);
    } catch {
      console.error(JSON.stringify({
        code: "UPLOAD_STORAGE_CLEANUP_FAILED",
        requestId,
        storagePath: path,
      }));
    }
    throw error;
  }
}

export async function deleteContractTemplate(
  client: ContractClient,
  storageClient: SupabaseClient,
  templateId: string,
  confirmActive: boolean,
  requestId: string,
): Promise<{ template_id: string }> {
  let target;
  try {
    target = await readSingleDocumentRpc(
      RPC.deleteTemplate,
      client.rpc(RPC.deleteTemplate, {
        p_template_id: templateId,
        p_confirm_active: confirmActive,
      }),
    );
    if (
      !isTemplateLocation(target, templateId) ||
      typeof target.already_deleted !== "boolean"
    ) {
      throw new DocumentContractError();
    }
  } catch (error) {
    if (isConfirmedDocumentRpcRejection(error)) throw error;
    const outcome = new DocumentWriteOutcomeUnknownError(
      "DELETE_OUTCOME_UNKNOWN",
    );
    console.error(
      JSON.stringify({ code: outcome.code, requestId, templateId }),
    );
    throw outcome;
  }

  try {
    await removeDocumentPaths(storageClient, [target.storage_path]);
  } catch {
    const failure = new DocumentPostCommitCleanupError();
    console.error(JSON.stringify({
      code: failure.code,
      requestId,
      templateId,
      storagePath: target.storage_path,
    }));
    throw failure;
  }
  return { template_id: templateId };
}

export async function getContractDownload(
  client: ContractClient,
  storageClient: SupabaseClient,
  artifactType: ArtifactType,
  artifactId: string,
): Promise<{ url: string; filename: string }> {
  const file = await getContractFile(client, artifactType, artifactId);
  return await createDocumentDownload(
    storageClient,
    file.storage_path,
    safePdfFilename(file.original_filename, artifactType),
  );
}

async function getContractFile(
  client: ContractClient,
  type: ArtifactType,
  id: string,
) {
  const file = await readSingleDocumentRpc(
    RPC.getFile,
    client.rpc(RPC.getFile, { p_artifact_type: type, p_artifact_id: id }),
  );
  const validLocation = type === "agreement"
    ? file.bucket_id === CLIENT_CONTRACTS_BUCKET &&
      file.storage_path.startsWith("agreements/")
    : isTemplateLocation(file, id);
  if (!validLocation) throw new DocumentContractError();
  return file;
}

function isTemplateLocation(
  file: ContractFileLocation,
  templateId: string,
): boolean {
  return file.template_id === templateId &&
    file.bucket_id === CLIENT_CONTRACTS_BUCKET &&
    typeof file.storage_path === "string" &&
    TEMPLATE_PATH.test(file.storage_path);
}

function safePdfFilename(
  originalFilename: string,
  artifactType: ArtifactType,
): string {
  const stem = originalFilename.replace(/\.pdf$/i, "")
    .replace(/[łŁ]/g, (letter) => letter === "ł" ? "l" : "L")
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^a-z0-9._ -]+/gi, "-")
    .slice(0, 200)
    .replace(/^[. -]+|[. -]+$/g, "");
  const reserved = /^(?:con|prn|aux|nul|com[0-9]|lpt[0-9])(?:\.|$)/i.test(stem);
  return `${reserved ? "_" : ""}${
    stem || (artifactType === "agreement" ? "agreement" : "template")
  }.pdf`;
}
