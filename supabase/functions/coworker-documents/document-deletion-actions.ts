import type { SupabaseClient } from "npm:@supabase/supabase-js@^2";

import {
  parseCoworkerDocumentDeletionCapabilities,
  parseDocumentDeletionResult,
  parseDocumentVersionDeletionResult,
} from "../_shared/coworker-document-edge/coworker-document-deletion-parser.ts";
import { COWORKER_DOCUMENT_DELETION_RPC } from "../_shared/coworker-document-edge/coworker-document-deletion-models.ts";
import { callRpc } from "../_shared/coworker-document-edge/rpc.ts";
import { attemptDocumentRetentionCleanup } from "../_shared/coworker-document-retention/retention-cleanup.ts";
import type {
  CoworkerDocumentActionRequest,
  CoworkerDocumentDeletionAction,
} from "./contracts.ts";

const DELETION_ACTIONS = [
  "getDeletionCapabilities",
  "deleteDocumentVersion",
  "deleteDocument",
] as const;

export function isCoworkerDocumentDeletionAction(
  action: CoworkerDocumentActionRequest,
): action is CoworkerDocumentDeletionAction {
  return DELETION_ACTIONS.some((candidate) => candidate === action.action);
}

export async function handleCoworkerDocumentDeletionAction(
  client: SupabaseClient,
  userId: string,
  action: CoworkerDocumentDeletionAction,
  requestId: string,
): Promise<Response> {
  switch (action.action) {
    case "getDeletionCapabilities": {
      const data = await callRpc(
        client,
        COWORKER_DOCUMENT_DELETION_RPC.getCapabilities,
        documentParameters(userId, action.documentId),
      );
      return Response.json({
        ok: true,
        action: "getDeletionCapabilities",
        capabilities: parseCoworkerDocumentDeletionCapabilities(
          data,
          action.documentId,
        ),
      });
    }
    case "deleteDocumentVersion": {
      const data = await callRpc(
        client,
        COWORKER_DOCUMENT_DELETION_RPC.requestVersionDeletion,
        {
          ...documentParameters(userId, action.documentId),
          p_document_version_id: action.documentVersionId,
        },
      );
      const result = parseDocumentVersionDeletionResult(
        data,
        action.documentId,
        action.documentVersionId,
      );
      await attemptDocumentRetentionCleanup(
        client,
        action.documentId,
        requestId,
        "document_version_deletion_requested",
      );
      return Response.json({
        ok: true,
        action: "deleteDocumentVersion",
        result,
      });
    }
    case "deleteDocument": {
      const data = await callRpc(
        client,
        COWORKER_DOCUMENT_DELETION_RPC.requestDocumentDeletion,
        documentParameters(userId, action.documentId),
      );
      const result = parseDocumentDeletionResult(data, action.documentId);
      if (!result.documentDeleted) {
        await attemptDocumentRetentionCleanup(
          client,
          action.documentId,
          requestId,
          "document_deletion_requested",
        );
      }
      return Response.json({
        ok: true,
        action: "deleteDocument",
        result,
      });
    }
  }
}

function documentParameters(userId: string, documentId: string) {
  return {
    p_user_id: userId,
    p_actor_user_id: userId,
    p_document_id: documentId,
  };
}
