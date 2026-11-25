import type { SupabaseClient } from "npm:@supabase/supabase-js@^2";

import type {
  IRegisterCoworkerSignedSubmissionResult,
} from "../../../src/app/core/interfaces/i-coworker-onboarding.ts";
import type { parseCoworkerMultipartRequest } from "../_shared/coworker-documents.schemas.ts";
import { coworkerPdfStorage } from "../_shared/coworker-documents.ts";
import {
  DocumentNotFoundError,
  DocumentRequestError,
  readSingleDocumentRpc,
  shouldCompensateDocumentRegistration,
} from "../_shared/document-api.ts";
import { listCoworkerPrivateDocuments } from "./actions.ts";

const RPC = "register_coworker_signed_submission";

export async function uploadSignedDocument(
  client: SupabaseClient,
  storageClient: SupabaseClient,
  request: ReturnType<typeof parseCoworkerMultipartRequest>,
): Promise<
  Omit<
    IRegisterCoworkerSignedSubmissionResult,
    "signed_storage_path" | "replaced_signed_storage_path"
  >
> {
  const assignments = await listCoworkerPrivateDocuments(client);
  const assignment = assignments.find((row) =>
    row.assignment_id === request.assignment_id
  );
  if (assignment === undefined) throw new DocumentNotFoundError();
  if (
    assignment.required_action !== "upload_signed" ||
    (assignment.assignment_status !== "pending" &&
      assignment.assignment_status !== "rejected")
  ) {
    throw new DocumentRequestError();
  }
  const bytes = await coworkerPdfStorage.readPdfFile(request.file);
  const storagePath =
    `signed/${request.assignment_id}/${crypto.randomUUID()}.pdf`;
  await coworkerPdfStorage.uploadPdf(storageClient, storagePath, bytes);
  let result: IRegisterCoworkerSignedSubmissionResult;
  try {
    result = await readSingleDocumentRpc<
      IRegisterCoworkerSignedSubmissionResult
    >(
      RPC,
      client.rpc(RPC, {
        p_assignment_id: request.assignment_id,
        p_storage_path: storagePath,
        p_original_filename: request.file.name,
        p_mime_type: request.file.type,
        p_size_bytes: request.file.size,
        p_declared_at: new Date().toISOString(),
      }),
    );
  } catch (error) {
    const storagePaths = [storagePath];
    if (
      shouldCompensateDocumentRegistration(error, {
        operation: RPC,
        storagePaths,
      })
    ) {
      await coworkerPdfStorage.removeDocumentPaths(storageClient, storagePaths);
    }
    throw error;
  }

  if (result.replaced_signed_storage_path !== null) {
    try {
      await coworkerPdfStorage.removeDocumentPaths(storageClient, [
        result.replaced_signed_storage_path,
      ]);
    } catch (error) {
      console.error(JSON.stringify({
        code: "POST_COMMIT_STORAGE_CLEANUP_FAILED",
        operation: "replace_signed_document",
        storagePath: result.replaced_signed_storage_path,
        errorType: error instanceof Error ? error.name : "UnknownError",
      }));
    }
  }
  const {
    signed_storage_path: _signedStoragePath,
    replaced_signed_storage_path: _replacedSignedStoragePath,
    ...response
  } = result;
  return response;
}
