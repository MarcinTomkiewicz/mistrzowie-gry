import { withSupabase } from "npm:@supabase/server@^1";

import {
  CoworkerDocumentRequestError,
  parseCoworkerJsonRequest,
  parseCoworkerMultipartRequest,
} from "../_shared/coworker-documents.schemas.ts";
import {
  CoworkerDocumentAuthenticationError,
  documentErrorResponse,
  normalizeDocumentResponse,
  successResponse,
} from "../_shared/coworker-documents.ts";
import { readFormData, readJson } from "../_shared/http.ts";
import { handleCoworkerAction } from "./actions.ts";
import { getCoworkerDownload } from "./downloads.ts";
import { uploadSignedDocument } from "./uploads.ts";

const authenticatedFetch = withSupabase(
  { auth: "user" },
  async (request, context) => {
    const requestId = crypto.randomUUID();
    try {
      if (request.method !== "POST") {
        throw new CoworkerDocumentRequestError();
      }
      const userId = context.userClaims?.id;
      if (typeof userId !== "string" || userId === "") {
        throw new CoworkerDocumentAuthenticationError();
      }

      const contentType = request.headers.get("content-type") ?? "";
      if (contentType.startsWith("multipart/form-data")) {
        const upload = parseCoworkerMultipartRequest(
          await readFormData(request, CoworkerDocumentRequestError),
        );
        return successResponse(
          await uploadSignedDocument(
            context.supabase,
            context.supabaseAdmin,
            upload,
          ),
        );
      }

      const action = parseCoworkerJsonRequest(
        await readJson(request, CoworkerDocumentRequestError),
      );
      if (action.action === "getDownloadUrl") {
        return successResponse(
          await getCoworkerDownload(
            context.supabase,
            context.supabaseAdmin,
            action,
          ),
        );
      }
      return successResponse(
        await handleCoworkerAction(
          context.supabase,
          context.supabaseAdmin,
          userId,
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
