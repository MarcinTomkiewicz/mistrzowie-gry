import { withSupabase } from "npm:@supabase/server@^1";

import { getAdminQuestionnaire } from "../_shared/coworker-questionnaire/admin.ts";
import { jsonNoStore } from "../_shared/coworker-questionnaire/http.ts";
import {
  createErrorResponse,
  InvalidJsonError,
  MethodNotAllowedError,
  MissingUserClaimsError,
} from "./errors.ts";

export default {
  fetch: withSupabase({ auth: "user" }, async (request, context) => {
    const requestId = crypto.randomUUID();
    try {
      const actorUserId = context.userClaims?.id;
      if (typeof actorUserId !== "string" || actorUserId === "") {
        throw new MissingUserClaimsError();
      }
      if (request.method !== "POST") {
        throw new MethodNotAllowedError();
      }

      return jsonNoStore(
        await getAdminQuestionnaire(
          context.supabaseAdmin,
          actorUserId,
          await readJson(request),
        ),
      );
    } catch (error) {
      return createErrorResponse(error, requestId);
    }
  }),
};

async function readJson(request: Request): Promise<unknown> {
  try {
    return (await request.json()) as unknown;
  } catch {
    throw new InvalidJsonError();
  }
}
