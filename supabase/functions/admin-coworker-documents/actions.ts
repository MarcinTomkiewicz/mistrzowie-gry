import type { SupabaseClient } from "npm:@supabase/supabase-js@^2";

import type {
  IAdminCoworkerOnboardingCandidate,
  IAdminCoworkerOnboardingDocumentRow,
  IAdminCoworkerOnboardingRow,
  IAdminSharedDocumentAssignmentRow,
  IAdminSharedDocumentRow,
  IArchiveSharedDocumentResult,
  ICancelCoworkerOnboardingResult,
  ICompleteCoworkerOnboardingResult,
  IRemovePrivateDocumentResult,
  IReviewCoworkerSignedSubmissionResult,
  ISetAdminCoworkerDocumentCategoryResult,
  IStartCoworkerOnboardingResult,
} from "../../../src/app/core/interfaces/i-admin-coworker-onboarding.ts";
import type { parseAdminJsonRequest } from "../_shared/coworker-documents.schemas.ts";
import { coworkerPdfStorage } from "../_shared/coworker-documents.ts";
import {
  DocumentNotFoundError,
  readDocumentRpc,
  readSingleDocumentRpc,
} from "../_shared/document-api.ts";

const RPC = {
  listOnboardingCandidates: "list_admin_coworker_onboarding_candidates",
  listOnboardings: "list_admin_coworker_onboardings",
  listOnboardingDocuments: "list_admin_coworker_onboarding_documents",
  startOnboarding: "start_coworker_onboarding",
  removePrivateDocument: "remove_private_document",
  reviewSignedDocument: "review_coworker_signed_submission",
  listSharedDocuments: "list_admin_shared_documents",
  archiveSharedDocument: "archive_shared_document",
  listSharedAssignments: "list_admin_shared_document_assignments",
  completeOnboarding: "complete_coworker_onboarding",
  cancelOnboarding: "cancel_coworker_onboarding",
  listDocumentCategories: "list_admin_coworker_document_categories",
  saveDocumentCategory: "save_admin_coworker_document_category",
  retireDocumentCategory: "retire_admin_coworker_document_category",
  setDocumentCategory: "set_admin_coworker_document_category",
  listDocumentCategoryHistory: "list_admin_coworker_document_category_history",
} as const;

export async function handleAdminAction(
  client: SupabaseClient,
  storageClient: SupabaseClient,
  request: Exclude<
    ReturnType<typeof parseAdminJsonRequest>,
    { action: "getDownloadUrl" }
  >,
): Promise<unknown> {
  switch (request.action) {
    case "listOnboardingCandidates":
      return await readDocumentRpc<IAdminCoworkerOnboardingCandidate[]>(
        RPC.listOnboardingCandidates,
        client.rpc(RPC.listOnboardingCandidates),
      );
    case "listOnboardings":
      return await listAdminOnboardings(client);
    case "getOnboarding":
      return await getOnboarding(client, request.onboarding_id);
    case "startOnboarding":
      return await readSingleDocumentRpc<IStartCoworkerOnboardingResult>(
        RPC.startOnboarding,
        client.rpc(RPC.startOnboarding, { p_user_id: request.user_id }),
      );
    case "removePrivateDocument": {
      const result = await readSingleDocumentRpc<IRemovePrivateDocumentResult>(
        RPC.removePrivateDocument,
        client.rpc(RPC.removePrivateDocument, {
          p_document_id: request.document_id,
        }),
      );
      try {
        await coworkerPdfStorage.removeDocumentPaths(
          storageClient,
          result.storage_paths,
        );
      } catch (error) {
        console.error(JSON.stringify({
          code: "POST_COMMIT_STORAGE_CLEANUP_FAILED",
          operation: "remove_private_document",
          storagePaths: result.storage_paths,
          errorType: error instanceof Error ? error.name : "UnknownError",
        }));
      }
      const { storage_paths: _storagePaths, ...response } = result;
      return response;
    }
    case "reviewSignedDocument": {
      const result = await readSingleDocumentRpc<
        IReviewCoworkerSignedSubmissionResult
      >(
        RPC.reviewSignedDocument,
        client.rpc(RPC.reviewSignedDocument, {
          p_assignment_id: request.assignment_id,
          p_decision: request.decision,
          p_rejection_reason: request.rejection_reason,
        }),
      );
      const { signed_storage_path: _signedStoragePath, ...response } = result;
      return response;
    }
    case "listSharedDocuments":
      return (await listAdminSharedDocuments(client)).map(
        withoutSharedDocumentPath,
      );
    case "archiveSharedDocument":
      return await readSingleDocumentRpc<IArchiveSharedDocumentResult>(
        RPC.archiveSharedDocument,
        client.rpc(RPC.archiveSharedDocument, {
          p_document_id: request.document_id,
        }),
      );
    case "listSharedDocumentAssignments":
      return (await listAdminSharedAssignments(client, request.document_id))
        .map(withoutSharedAssignmentPath);
    case "completeOnboarding":
      return await readSingleDocumentRpc<ICompleteCoworkerOnboardingResult>(
        RPC.completeOnboarding,
        client.rpc(RPC.completeOnboarding, {
          p_onboarding_id: request.onboarding_id,
        }),
      );
    case "cancelOnboarding":
      return await readSingleDocumentRpc<ICancelCoworkerOnboardingResult>(
        RPC.cancelOnboarding,
        client.rpc(RPC.cancelOnboarding, {
          p_onboarding_id: request.onboarding_id,
        }),
      );
    case "listDocumentCategories":
      return await readDocumentRpc(
        RPC.listDocumentCategories,
        client.rpc(RPC.listDocumentCategories),
      );
    case "saveDocumentCategory":
      return await readSingleDocumentRpc(
        RPC.saveDocumentCategory,
        client.rpc(RPC.saveDocumentCategory, {
          p_category_key: request.category_key,
          p_name: request.name,
        }),
      );
    case "retireDocumentCategory":
      return await readSingleDocumentRpc(
        RPC.retireDocumentCategory,
        client.rpc(RPC.retireDocumentCategory, {
          p_category_key: request.category_key,
        }),
      );
    case "setDocumentCategory":
      return await readSingleDocumentRpc<
        ISetAdminCoworkerDocumentCategoryResult
      >(
        RPC.setDocumentCategory,
        client.rpc(RPC.setDocumentCategory, {
          p_onboarding_id: request.onboarding_id,
          p_document_ids: request.document_ids,
          p_category_key: request.category_key,
        }),
      );
    case "listDocumentCategoryHistory":
      return await readDocumentRpc(
        RPC.listDocumentCategoryHistory,
        client.rpc(RPC.listDocumentCategoryHistory, {
          p_category_key: request.category_key,
        }),
      );
  }
}

function listAdminOnboardings(
  client: SupabaseClient,
): Promise<IAdminCoworkerOnboardingRow[]> {
  return readDocumentRpc(RPC.listOnboardings, client.rpc(RPC.listOnboardings));
}

export async function getAdminOnboarding(
  client: SupabaseClient,
  onboardingId: string,
): Promise<IAdminCoworkerOnboardingRow> {
  const canonicalId = onboardingId.toLowerCase();
  const onboardings = await listAdminOnboardings(client);
  const onboarding = onboardings.find((row) =>
    row.onboarding_id === canonicalId
  );
  if (onboarding === undefined) throw new DocumentNotFoundError();
  return onboarding;
}

export function listAdminOnboardingDocuments(
  client: SupabaseClient,
  onboardingId: string,
): Promise<IAdminCoworkerOnboardingDocumentRow[]> {
  return readDocumentRpc(
    RPC.listOnboardingDocuments,
    client.rpc(RPC.listOnboardingDocuments, {
      p_onboarding_id: onboardingId,
    }),
  );
}

export function listAdminSharedDocuments(
  client: SupabaseClient,
): Promise<IAdminSharedDocumentRow[]> {
  return readDocumentRpc(
    RPC.listSharedDocuments,
    client.rpc(RPC.listSharedDocuments),
  );
}

export function listAdminSharedAssignments(
  client: SupabaseClient,
  documentId: string,
): Promise<IAdminSharedDocumentAssignmentRow[]> {
  return readDocumentRpc(
    RPC.listSharedAssignments,
    client.rpc(RPC.listSharedAssignments, {
      p_document_id: documentId,
    }),
  );
}

async function getOnboarding(
  client: SupabaseClient,
  onboardingId: string,
): Promise<{
  onboarding: IAdminCoworkerOnboardingRow;
  documents: Array<
    Omit<
      IAdminCoworkerOnboardingDocumentRow,
      "storage_path" | "signed_storage_path"
    >
  >;
}> {
  const [onboarding, documents] = await Promise.all([
    getAdminOnboarding(client, onboardingId),
    listAdminOnboardingDocuments(client, onboardingId),
  ]);
  return { onboarding, documents: documents.map(withoutPrivateStoragePaths) };
}

function withoutPrivateStoragePaths(row: IAdminCoworkerOnboardingDocumentRow) {
  const {
    storage_path: _storagePath,
    signed_storage_path: _signedStoragePath,
    ...document
  } = row;
  return document;
}

function withoutSharedDocumentPath(row: IAdminSharedDocumentRow) {
  const { storage_path: _storagePath, ...document } = row;
  return document;
}

function withoutSharedAssignmentPath(row: IAdminSharedDocumentAssignmentRow) {
  const { storage_path: _storagePath, ...assignment } = row;
  return assignment;
}
