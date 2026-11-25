import { withSupabase } from "npm:@supabase/server@^1";

import {
  parseAdminJsonRequest,
  parseAdminMultipartRequest,
} from "../_shared/coworker-documents.schemas.ts";
import {
  documentErrorResponse,
  DocumentRequestError,
  normalizeDocumentResponse,
  successResponse,
} from "../_shared/document-api.ts";
import { readFormData, readJson } from "../_shared/http.ts";
import { handleAdminAction } from "./actions.ts";
import { getAdminDownload } from "./downloads.ts";
import { handleAdminUpload } from "./uploads.ts";

const authenticatedFetch = withSupabase(
  { auth: "user" },
  async (request, context) => {
    const requestId = crypto.randomUUID();
    try {
      if (request.method !== "POST") {
        throw new DocumentRequestError();
      }

      const contentType = request.headers.get("content-type") ?? "";
      if (contentType.startsWith("multipart/form-data")) {
        const upload = parseAdminMultipartRequest(
          await readFormData(request, DocumentRequestError),
        );
        return successResponse(
          await handleAdminUpload(
            context.supabase,
            context.supabaseAdmin,
            upload,
          ),
        );
      }

      const action = parseAdminJsonRequest(
        await readJson(request, DocumentRequestError),
      );
      if (action.action === "getDownloadUrl") {
        return successResponse(
          await getAdminDownload(
            context.supabase,
            context.supabaseAdmin,
            action,
          ),
        );
      }
      return successResponse(
        await handleAdminAction(
          context.supabase,
          context.supabaseAdmin,
          action,
        ),
      );
    } catch (error) {
      return documentErrorResponse(error, requestId);
    }
  },
);

export default {
  fetch: async (request: Request) =>
    await normalizeDocumentResponse(await authenticatedFetch(request)),
};
