import type { SupabaseClient } from "npm:@supabase/supabase-js@^2";

import type {
  IAcknowledgeCoworkerDocumentsResult,
  ICoworkerOnboardingRow,
  ICoworkerPrivateDocumentRow,
  ICoworkerSharedDocumentRow,
} from "../../../src/app/core/interfaces/i-coworker-onboarding.ts";
import { getQuestionnaireEnvelope } from "../_shared/coworker-questionnaire/rpc.ts";
import type { parseCoworkerJsonRequest } from "../_shared/coworker-documents.schemas.ts";
import {
  readDocumentRpc,
  readSingleDocumentRpc,
} from "../_shared/document-api.ts";

const RPC = {
  getOnboarding: "get_coworker_onboarding",
  listPrivateDocuments: "list_coworker_private_documents",
  listSharedDocuments: "list_coworker_shared_documents",
  acknowledgeDocuments: "acknowledge_coworker_documents",
} as const;

export async function handleCoworkerAction(
  client: SupabaseClient,
  adminClient: SupabaseClient,
  userId: string,
  request: Exclude<
    ReturnType<typeof parseCoworkerJsonRequest>,
    { action: "getDownloadUrl" }
  >,
): Promise<unknown> {
  switch (request.action) {
    case "getPortal":
      return await getPortal(client, adminClient, userId);
    case "acknowledgeDocuments":
      return await readSingleDocumentRpc<
        IAcknowledgeCoworkerDocumentsResult
      >(
        RPC.acknowledgeDocuments,
        client.rpc(RPC.acknowledgeDocuments, {
          p_assignment_ids: request.assignment_ids,
        }),
      );
  }
}

export function listCoworkerPrivateDocuments(
  client: SupabaseClient,
): Promise<ICoworkerPrivateDocumentRow[]> {
  return readDocumentRpc(
    RPC.listPrivateDocuments,
    client.rpc(RPC.listPrivateDocuments),
  );
}

export function listCoworkerSharedDocuments(
  client: SupabaseClient,
): Promise<ICoworkerSharedDocumentRow[]> {
  return readDocumentRpc(
    RPC.listSharedDocuments,
    client.rpc(RPC.listSharedDocuments),
  );
}

async function getPortal(
  client: SupabaseClient,
  adminClient: SupabaseClient,
  userId: string,
) {
  const [onboardingRows, privateRows, sharedRows, questionnaire] = await Promise
    .all([
      readDocumentRpc<ICoworkerOnboardingRow[]>(
        RPC.getOnboarding,
        client.rpc(RPC.getOnboarding),
      ),
      listCoworkerPrivateDocuments(client),
      listCoworkerSharedDocuments(client),
      getQuestionnaireEnvelope(adminClient, userId),
    ]);

  return {
    onboarding: onboardingRows[0] ?? null,
    questionnaire_complete: questionnaire?.isComplete === true &&
      questionnaire.validationPassed,
    private_assignments: privateRows.map(withoutPrivateStoragePaths),
    shared_assignments: sharedRows.map(withoutSharedStoragePath),
  };
}

function withoutPrivateStoragePaths(row: ICoworkerPrivateDocumentRow) {
  const {
    storage_path: _storagePath,
    signed_storage_path: _signedStoragePath,
    questionnaire_revision: _questionnaireRevision,
    ...assignment
  } = row;
  return assignment;
}

function withoutSharedStoragePath(row: ICoworkerSharedDocumentRow) {
  const { storage_path: _storagePath, ...assignment } = row;
  return assignment;
}
