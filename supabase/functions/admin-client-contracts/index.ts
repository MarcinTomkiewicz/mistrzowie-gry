import { withSupabase } from "npm:@supabase/server@^1";
import type { SupabaseClient } from "npm:@supabase/supabase-js@^2";

import {
  documentErrorResponse,
  DocumentRequestError,
  normalizeDocumentResponse,
  readDocumentRpc,
  readSingleDocumentRpc,
  successResponse,
} from "../_shared/document-api.ts";
import { readFormData, readJson } from "../_shared/http.ts";
import { type ClientContractsDatabase, RPC } from "./contracts.ts";
import { parseJsonRequest, parseUploadRequest } from "./requests.ts";
import {
  deleteContractTemplate,
  getContractDownload,
  storeContractPdf,
} from "./storage.ts";

const authenticatedFetch = withSupabase(
  { auth: "user" },
  async (request, context) => {
    const requestId = crypto.randomUUID();
    const client: SupabaseClient<ClientContractsDatabase> = context.supabase;
    try {
      if (request.method !== "POST") throw new DocumentRequestError();

      const contentType = request.headers.get("content-type")?.toLowerCase();
      if (contentType?.startsWith("multipart/form-data")) {
        await readDocumentRpc(RPC.listTemplates, client.rpc(RPC.listTemplates));
        const upload = parseUploadRequest(
          await readFormData(request, DocumentRequestError),
        );
        return successResponse(
          await storeContractPdf(
            client,
            context.supabaseAdmin,
            upload,
            requestId,
          ),
        );
      }

      const action = parseJsonRequest(
        await readJson(request, DocumentRequestError),
      );
      switch (action.action) {
        case "listTemplates":
          return successResponse(
            await readDocumentRpc(
              RPC.listTemplates,
              client.rpc(RPC.listTemplates),
            ),
          );
        case "listAgreements":
          return successResponse(
            await readDocumentRpc(
              RPC.listAgreements,
              client.rpc(RPC.listAgreements),
            ),
          );
        case "approveTemplate":
          return successResponse(
            await readSingleDocumentRpc(
              RPC.approveTemplate,
              client.rpc(RPC.approveTemplate, {
                p_template_id: action.templateId,
              }),
            ),
          );
        case "deleteTemplate":
          return successResponse(
            await deleteContractTemplate(
              client,
              context.supabaseAdmin,
              action.templateId,
              action.confirmActive,
              requestId,
            ),
          );
        case "getDownloadUrl":
          return successResponse(
            await getContractDownload(
              client,
              context.supabaseAdmin,
              action.artifactType,
              action.artifactId,
            ),
          );
      }
    } catch (error) {
      return documentErrorResponse(error, requestId);
    }
  },
);

export default {
  fetch: async (request: Request) =>
    await normalizeDocumentResponse(await authenticatedFetch(request)),
};
