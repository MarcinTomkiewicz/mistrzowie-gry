import { withSupabase } from "npm:@supabase/server@^1";

import {
  CoworkerDocumentRequestError,
  parseAdminJsonRequest,
  parseAdminMultipartRequest,
} from "../_shared/coworker-documents.schemas.ts";
import {
  documentErrorResponse,
  normalizeDocumentResponse,
  successResponse,
} from "../_shared/coworker-documents.ts";
import { handleAdminAction } from "./actions.ts";
import { getAdminDownload } from "./downloads.ts";
import { handleAdminUpload } from "./uploads.ts";

const authenticatedFetch = withSupabase(
  { auth: "user" },
  async (request, context) => {
    const requestId = crypto.randomUUID();
    try {
      if (request.method !== "POST") {
        throw new CoworkerDocumentRequestError();
      }

      const contentType = request.headers.get("content-type") ?? "";
      if (contentType.startsWith("multipart/form-data")) {
        const upload = parseAdminMultipartRequest(await readFormData(request));
        return successResponse(
          await handleAdminUpload(
            context.supabase,
            context.supabaseAdmin,
            upload,
          ),
        );
      }

      const action = parseAdminJsonRequest(await readJson(request));
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
