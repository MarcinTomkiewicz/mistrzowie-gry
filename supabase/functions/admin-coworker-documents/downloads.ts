import type { SupabaseClient } from "npm:@supabase/supabase-js@^2";

import type { parseAdminJsonRequest } from "../_shared/coworker-documents.schemas.ts";
import {
  CoworkerDocumentNotFoundError,
  createDocumentDownload,
} from "../_shared/coworker-documents.ts";
import {
  listAdminOnboardingDocuments,
  listAdminSharedDocuments,
} from "./actions.ts";

export async function getAdminDownload(
  client: SupabaseClient,
  storageClient: SupabaseClient,
  request: Extract<
    ReturnType<typeof parseAdminJsonRequest>,
    { action: "getDownloadUrl" }
  >,
): Promise<{ url: string; filename: string }> {
  const target = request.target === "signed"
    ? await findSignedTarget(client, request)
    : await findSourceTarget(client, request);
  if (target === null) throw new CoworkerDocumentNotFoundError();
  return await createDocumentDownload(
    storageClient,
    target.path,
    target.filename,
  );
}

async function findSignedTarget(
  client: SupabaseClient,
  request: Extract<
    ReturnType<typeof parseAdminJsonRequest>,
    { action: "getDownloadUrl"; target: "signed" }
  >,
): Promise<{ path: string; filename: string } | null> {
  const documents = await listAdminOnboardingDocuments(
    client,
    request.onboarding_id,
  );
  const document = documents.find((row) =>
    row.assignment_id === request.assignment_id
  );
  if (
    document?.signed_storage_path === undefined ||
    document.signed_storage_path === null ||
    document.signed_original_filename === null
  ) {
    return null;
  }
  return {
    path: document.signed_storage_path,
    filename: document.signed_original_filename,
  };
}

async function findSourceTarget(
  client: SupabaseClient,
  request: Extract<
    ReturnType<typeof parseAdminJsonRequest>,
    { action: "getDownloadUrl"; target: "source" }
  >,
): Promise<{ path: string; filename: string } | null> {
  const documents = request.onboarding_id === null
    ? await listAdminSharedDocuments(client)
    : await listAdminOnboardingDocuments(client, request.onboarding_id);
  const document = documents.find((row) =>
    row.document_id === request.document_id
  );
  if (
    document?.storage_path === undefined ||
    document.storage_path === null ||
    document.original_filename === null
  ) {
    return null;
  }
  return { path: document.storage_path, filename: document.original_filename };
}
