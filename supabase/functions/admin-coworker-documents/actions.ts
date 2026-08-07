import type { SupabaseClient } from "npm:@supabase/supabase-js@^2";

import type {
  IAdminCoworkerOnboardingCandidate,
  IAdminCoworkerOnboardingDocumentRow,
  IAdminCoworkerOnboardingRow,
  IAdminSharedDocumentAssignmentRow,
  IAdminSharedDocumentRow,
  IArchiveSharedDocumentResult,
  ICompleteCoworkerOnboardingResult,
  IRemovePrivateDocumentResult,
  IReviewCoworkerSignedSubmissionResult,
  IStartCoworkerOnboardingResult,
} from "../../../src/app/core/interfaces/i-admin-coworker-onboarding.ts";
import type { AdminJsonRequest } from "../_shared/coworker-documents.schemas.ts";
import {
  callCoworkerRpc,
  callSingleCoworkerRpc,
  CoworkerDocumentNotFoundError,
  removeDocumentPaths,
} from "../_shared/coworker-documents.ts";

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
} as const;

type AdminCommandRequest = Exclude<
  AdminJsonRequest,
  { action: "getDownloadUrl" }
>;

export async function handleAdminAction(
  client: SupabaseClient,
  storageClient: SupabaseClient,
  request: AdminCommandRequest,
): Promise<unknown> {
  switch (request.action) {
    case "listOnboardingCandidates":
      return await callCoworkerRpc<IAdminCoworkerOnboardingCandidate[]>(
        client,
        RPC.listOnboardingCandidates,
      );
    case "listOnboardings":
      return await listAdminOnboardings(client);
    case "getOnboarding":
      return await getOnboarding(client, request.onboarding_id);
    case "startOnboarding":
      return await callSingleCoworkerRpc<IStartCoworkerOnboardingResult>(
        client,
        RPC.startOnboarding,
        { p_user_id: request.user_id },
      );
    case "removePrivateDocument": {
      const result = await callSingleCoworkerRpc<IRemovePrivateDocumentResult>(
        client,
        RPC.removePrivateDocument,
        { p_document_id: request.document_id },
      );
      try {
        await removeDocumentPaths(storageClient, result.storage_paths);
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
      const result = await callSingleCoworkerRpc<
        IReviewCoworkerSignedSubmissionResult
      >(client, RPC.reviewSignedDocument, {
        p_assignment_id: request.assignment_id,
        p_decision: request.decision,
        p_rejection_reason: request.rejection_reason,
      });
      const { signed_storage_path: _signedStoragePath, ...response } = result;
      return response;
    }
    case "listSharedDocuments":
      return (await listAdminSharedDocuments(client)).map(
        withoutSharedDocumentPath,
      );
    case "archiveSharedDocument":
      return await callSingleCoworkerRpc<IArchiveSharedDocumentResult>(
        client,
        RPC.archiveSharedDocument,
        { p_document_id: request.document_id },
      );
    case "listSharedDocumentAssignments":
      return (await listAdminSharedAssignments(client, request.document_id))
        .map(withoutSharedAssignmentPath);
    case "completeOnboarding":
      return await callSingleCoworkerRpc<ICompleteCoworkerOnboardingResult>(
        client,
        RPC.completeOnboarding,
        { p_onboarding_id: request.onboarding_id },
      );
  }
}

export function listAdminOnboardings(
  client: SupabaseClient,
): Promise<IAdminCoworkerOnboardingRow[]> {
  return callCoworkerRpc(client, RPC.listOnboardings);
}

export function listAdminOnboardingDocuments(
  client: SupabaseClient,
  onboardingId: string,
): Promise<IAdminCoworkerOnboardingDocumentRow[]> {
  return callCoworkerRpc(client, RPC.listOnboardingDocuments, {
    p_onboarding_id: onboardingId,
  });
}

export function listAdminSharedDocuments(
  client: SupabaseClient,
): Promise<IAdminSharedDocumentRow[]> {
  return callCoworkerRpc(client, RPC.listSharedDocuments);
}

export function listAdminSharedAssignments(
  client: SupabaseClient,
  documentId: string,
): Promise<IAdminSharedDocumentAssignmentRow[]> {
  return callCoworkerRpc(client, RPC.listSharedAssignments, {
    p_document_id: documentId,
  });
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
  const [onboardings, documents] = await Promise.all([
    listAdminOnboardings(client),
    listAdminOnboardingDocuments(client, onboardingId),
  ]);
  const onboarding = onboardings.find((row) =>
    row.onboarding_id === onboardingId
  );
  if (onboarding === undefined) throw new CoworkerDocumentNotFoundError();
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
