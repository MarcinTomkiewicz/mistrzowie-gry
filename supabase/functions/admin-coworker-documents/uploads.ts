import type { SupabaseClient } from "npm:@supabase/supabase-js@^2";

import type {
  IRegisterAdminPrivateDocumentResult,
  IRegisterSharedDocumentResult,
} from "../../../src/app/core/interfaces/i-admin-coworker-onboarding.ts";
import {
  type AdminMultipartRequest,
  CoworkerDocumentRequestError,
} from "../_shared/coworker-documents.schemas.ts";
import {
  callCoworkerRpc,
  callSingleCoworkerRpc,
  CoworkerDocumentNotFoundError,
  readPdfFile,
  removeDocumentPaths,
  uploadPdf,
} from "../_shared/coworker-documents.ts";
import {
  listAdminOnboardingDocuments,
  listAdminSharedDocuments,
} from "./actions.ts";

const RPC = {
  registerPrivateDocuments: "register_admin_private_documents",
  registerSharedDocument: "register_shared_document",
} as const;

export async function handleAdminUpload(
  client: SupabaseClient,
  storageClient: SupabaseClient,
  request: AdminMultipartRequest,
): Promise<unknown> {
  return request.action === "uploadPrivateDocuments"
    ? await uploadPrivateDocuments(client, storageClient, request)
    : await uploadSharedDocument(client, storageClient, request);
}

async function uploadPrivateDocuments(
  client: SupabaseClient,
  storageClient: SupabaseClient,
  request: Extract<
    AdminMultipartRequest,
    { action: "uploadPrivateDocuments" }
  >,
): Promise<IRegisterAdminPrivateDocumentResult[]> {
  await listAdminOnboardingDocuments(client, request.onboarding_id);
  const uploadedPaths: string[] = [];
  const documents: Array<{
    title: string;
    requires_signed_upload: boolean;
    storage_path: string;
    original_filename: string;
    mime_type: string;
    size_bytes: number;
  }> = [];
  try {
    for (let index = 0; index < request.documents.length; index += 1) {
      const metadata = request.documents[index];
      const file = request.files[index];
      const bytes = await readPdfFile(file);
      const storagePath =
        `private/${request.onboarding_id}/${crypto.randomUUID()}.pdf`;
      await uploadPdf(storageClient, storagePath, bytes);
      uploadedPaths.push(storagePath);
      documents.push({
        ...metadata,
        storage_path: storagePath,
        original_filename: file.name,
        mime_type: file.type,
        size_bytes: file.size,
      });
    }
    return await callCoworkerRpc<IRegisterAdminPrivateDocumentResult[]>(
      client,
      RPC.registerPrivateDocuments,
      {
        p_onboarding_id: request.onboarding_id,
        p_documents: documents,
      },
    );
  } catch (error) {
    await removeDocumentPaths(storageClient, uploadedPaths);
    throw error;
  }
}

async function uploadSharedDocument(
  client: SupabaseClient,
  storageClient: SupabaseClient,
  request: Extract<AdminMultipartRequest, { action: "uploadSharedDocument" }>,
): Promise<IRegisterSharedDocumentResult> {
  const documents = await listAdminSharedDocuments(client);
  if (request.document_id !== null) {
    const document = documents.find((row) =>
      row.document_id === request.document_id
    );
    if (document === undefined) throw new CoworkerDocumentNotFoundError();
    if (document.status !== "active") {
      throw new CoworkerDocumentRequestError();
    }
  }
  const bytes = await readPdfFile(request.file);
  const storagePath = `shared/${crypto.randomUUID()}.pdf`;
  try {
    await uploadPdf(storageClient, storagePath, bytes);
    return await callSingleCoworkerRpc<IRegisterSharedDocumentResult>(
      client,
      RPC.registerSharedDocument,
      {
        p_document_id: request.document_id,
        p_title: request.title,
        p_storage_path: storagePath,
        p_original_filename: request.file.name,
        p_mime_type: request.file.type,
        p_size_bytes: request.file.size,
        p_assign_after_onboarding: request.assign_after_onboarding,
      },
    );
  } catch (error) {
    await removeDocumentPaths(storageClient, [storagePath]);
    throw error;
  }
}
