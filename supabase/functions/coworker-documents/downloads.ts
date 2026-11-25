import type { SupabaseClient } from "npm:@supabase/supabase-js@^2";

import type { parseCoworkerJsonRequest } from "../_shared/coworker-documents.schemas.ts";
import { coworkerPdfStorage } from "../_shared/coworker-documents.ts";
import { DocumentNotFoundError } from "../_shared/document-api.ts";
import {
  listCoworkerPrivateDocuments,
  listCoworkerSharedDocuments,
} from "./actions.ts";

export async function getCoworkerDownload(
  client: SupabaseClient,
  storageClient: SupabaseClient,
  request: Extract<
    ReturnType<typeof parseCoworkerJsonRequest>,
    { action: "getDownloadUrl" }
  >,
): Promise<{ url: string; filename: string }> {
  const [privateDocuments, sharedDocuments] = await Promise.all([
    listCoworkerPrivateDocuments(client),
    listCoworkerSharedDocuments(client),
  ]);
  const privateDocument = privateDocuments.find((row) =>
    row.assignment_id === request.assignment_id
  );
  if (privateDocument !== undefined) {
    const path = request.target === "source"
      ? privateDocument.storage_path
      : privateDocument.signed_storage_path;
    const filename = request.target === "source"
      ? privateDocument.original_filename
      : privateDocument.signed_original_filename;
    if (path === null || filename === null) {
      throw new DocumentNotFoundError();
    }
    return await coworkerPdfStorage.createDocumentDownload(
      storageClient,
      path,
      filename,
    );
  }

  if (request.target === "signed") {
    throw new DocumentNotFoundError();
  }
  const sharedDocument = sharedDocuments.find((row) =>
    row.assignment_id === request.assignment_id
  );
  if (sharedDocument === undefined) {
    throw new DocumentNotFoundError();
  }
  return await coworkerPdfStorage.createDocumentDownload(
    storageClient,
    sharedDocument.storage_path,
    sharedDocument.original_filename,
  );
}
