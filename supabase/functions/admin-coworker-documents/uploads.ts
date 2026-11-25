import type { SupabaseClient } from "npm:@supabase/supabase-js@^2";

import type {
  IRegisterAdminPrivateDocumentResult,
  IRegisterSharedDocumentResult,
} from "../../../src/app/core/interfaces/i-admin-coworker-onboarding.ts";
import type { parseAdminMultipartRequest } from "../_shared/coworker-documents.schemas.ts";
import { coworkerPdfStorage } from "../_shared/coworker-documents.ts";
import {
  DocumentConflictError,
  DocumentNotFoundError,
  DocumentRequestError,
  readDocumentRpc,
  readSingleDocumentRpc,
  shouldCompensateDocumentRegistration,
} from "../_shared/document-api.ts";
import { getAdminOnboarding, listAdminSharedDocuments } from "./actions.ts";

const RPC = {
  registerPrivateDocuments: "register_admin_private_documents",
  registerSharedDocument: "register_shared_document",
} as const;

type PrivateUploadRequest = Extract<
  ReturnType<typeof parseAdminMultipartRequest>,
  { action: "uploadPrivateDocuments" }
>;

export async function handleAdminUpload(
  client: SupabaseClient,
  storageClient: SupabaseClient,
  request: ReturnType<typeof parseAdminMultipartRequest>,
): Promise<unknown> {
  return request.action === "uploadPrivateDocuments"
    ? await uploadPrivateDocuments(client, storageClient, request)
    : await uploadSharedDocument(client, storageClient, request);
}

async function uploadPrivateDocuments(
  client: SupabaseClient,
  storageClient: SupabaseClient,
  request: PrivateUploadRequest,
): Promise<IRegisterAdminPrivateDocumentResult[]> {
  const onboarding = await getAdminOnboarding(client, request.onboarding_id);
  const completed = onboarding.status === "completed";
  if (onboarding.status !== "in_progress" && !completed) {
    throw new DocumentConflictError();
  }
  const storageDirectory = completed
    ? `private/by-user/${onboarding.user_id}`
    : `private/${onboarding.onboarding_id}`;
  const uploadedPaths: string[] = [];
  const documents: Array<
    PrivateUploadRequest["documents"][number] & {
      storage_path: string;
      original_filename: string;
      mime_type: string;
      size_bytes: number;
    }
  > = [];
  try {
    for (let index = 0; index < request.documents.length; index += 1) {
      const metadata = request.documents[index];
      const file = request.files[index];
      const bytes = await coworkerPdfStorage.readPdfFile(file);
      const storagePath = `${storageDirectory}/${crypto.randomUUID()}.pdf`;
      await coworkerPdfStorage.uploadPdf(storageClient, storagePath, bytes);
      uploadedPaths.push(storagePath);
      documents.push({
        ...metadata,
        storage_path: storagePath,
        original_filename: file.name,
        mime_type: file.type,
        size_bytes: file.size,
      });
    }
  } catch (error) {
    await cleanupFailedUpload(storageClient, uploadedPaths, request.action);
    throw error;
  }

  try {
    return await readDocumentRpc<IRegisterAdminPrivateDocumentResult[]>(
      RPC.registerPrivateDocuments,
      client.rpc(RPC.registerPrivateDocuments, {
        p_onboarding_id: onboarding.onboarding_id,
        p_documents: documents,
      }),
    );
  } catch (error) {
    if (
      shouldCompensateDocumentRegistration(error, {
        operation: request.action,
        storagePaths: uploadedPaths,
      })
    ) {
      await cleanupFailedUpload(storageClient, uploadedPaths, request.action);
    }
    throw error;
  }
}

async function uploadSharedDocument(
  client: SupabaseClient,
  storageClient: SupabaseClient,
  request: Extract<
    ReturnType<typeof parseAdminMultipartRequest>,
    { action: "uploadSharedDocument" }
  >,
): Promise<IRegisterSharedDocumentResult> {
  const documents = await listAdminSharedDocuments(client);
  if (request.document_id !== null) {
    const document = documents.find((row) =>
      row.document_id === request.document_id
    );
    if (document === undefined) throw new DocumentNotFoundError();
    if (document.status !== "active") {
      throw new DocumentRequestError();
    }
  }
  const bytes = await coworkerPdfStorage.readPdfFile(request.file);
  const storagePath = `shared/${crypto.randomUUID()}.pdf`;
  await coworkerPdfStorage.uploadPdf(storageClient, storagePath, bytes);
  try {
    return await readSingleDocumentRpc<IRegisterSharedDocumentResult>(
      RPC.registerSharedDocument,
      client.rpc(RPC.registerSharedDocument, {
        p_document_id: request.document_id,
        p_title: request.title,
        p_storage_path: storagePath,
        p_original_filename: request.file.name,
        p_mime_type: request.file.type,
        p_size_bytes: request.file.size,
        p_assign_after_onboarding: request.assign_after_onboarding,
      }),
    );
  } catch (error) {
    const storagePaths = [storagePath];
    if (
      shouldCompensateDocumentRegistration(error, {
        operation: request.action,
        storagePaths,
      })
    ) {
      await cleanupFailedUpload(storageClient, storagePaths, request.action);
    }
    throw error;
  }
}

async function cleanupFailedUpload(
  storageClient: SupabaseClient,
  storagePaths: readonly string[],
  operation: ReturnType<typeof parseAdminMultipartRequest>["action"],
): Promise<void> {
  try {
    await coworkerPdfStorage.removeDocumentPaths(storageClient, storagePaths);
  } catch (error) {
    console.error(JSON.stringify({
      code: "UPLOAD_STORAGE_CLEANUP_FAILED",
      operation,
      storagePaths,
      errorType: error instanceof Error ? error.name : "UnknownError",
    }));
  }
}
