import type { SupabaseClient } from "npm:@supabase/supabase-js@^2";

import {
  parseCoworkerDocumentDeletionCapabilities,
  parseDocumentDeletionResult,
  parseDocumentVersionDeletionResult,
  parseDocumentVersionPreservationResult,
} from "../_shared/coworker-document-edge/coworker-document-deletion-parser.ts";
import { COWORKER_DOCUMENT_DELETION_RPC } from "../_shared/coworker-document-edge/coworker-document-deletion-models.ts";
import { callRpc } from "../_shared/coworker-document-edge/rpc.ts";
import { attemptDocumentRetentionCleanup } from "../_shared/coworker-document-retention/retention-cleanup.ts";
import type { AdminDocumentDeletionAction } from "./document-deletion-request.ts";

export async function handleAdminDocumentDeletionAction(
  client: SupabaseClient,
  actorUserId: string,
  action: AdminDocumentDeletionAction,
  requestId: string,
): Promise<Response> {
  switch (action.action) {
    case "getDeletionCapabilities": {
      const data = await callRpc(
        client,
        COWORKER_DOCUMENT_DELETION_RPC.getCapabilities,
        documentParameters(action.userId, actorUserId, action.documentId),
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
          ...documentParameters(
            action.userId,
            actorUserId,
            action.documentId,
          ),
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
        documentParameters(action.userId, actorUserId, action.documentId),
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
    case "setDocumentVersionPreservation": {
      const data = await callRpc(
        client,
        COWORKER_DOCUMENT_DELETION_RPC.setVersionPreservation,
        {
          ...documentParameters(
            action.userId,
            actorUserId,
            action.documentId,
          ),
          p_document_version_id: action.documentVersionId,
          p_preservation_kind: action.preservationKind,
          p_note: action.note,
        },
      );
      const result = parseDocumentVersionPreservationResult(
        data,
        action.documentId,
        action.documentVersionId,
        action.preservationKind,
      );
      await attemptDocumentRetentionCleanup(
        client,
        action.documentId,
        requestId,
        "document_version_preservation_changed",
      );
      return Response.json({
        ok: true,
        action: "setDocumentVersionPreservation",
        result,
      });
    }
  }
}

function documentParameters(
  userId: string,
  actorUserId: string,
  documentId: string,
) {
  return {
    p_user_id: userId,
    p_actor_user_id: actorUserId,
    p_document_id: documentId,
  };
}
