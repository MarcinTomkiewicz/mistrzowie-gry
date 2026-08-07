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
          await readFormData(request),
        );
        return successResponse(
          await uploadSignedDocument(
            context.supabase,
            context.supabaseAdmin,
            upload,
          ),
        );
      }

      const action = parseCoworkerJsonRequest(await readJson(request));
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

async function readJson(request: Request): Promise<unknown> {
  try {
    return (await request.json()) as unknown;
  } catch {
    throw new CoworkerDocumentRequestError();
  }
}

async function readFormData(request: Request): Promise<FormData> {
  try {
    return await request.formData();
  } catch {
    throw new CoworkerDocumentRequestError();
  }
}
