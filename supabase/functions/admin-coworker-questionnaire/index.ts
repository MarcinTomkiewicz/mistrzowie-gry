import { withSupabase } from "npm:@supabase/server@^1";

import { getAdminQuestionnaire } from "../_shared/coworker-questionnaire/admin.ts";
import {
  InvalidJsonError,
  MethodNotAllowedError,
  MissingUserClaimsError,
} from "../_shared/coworker-questionnaire/errors.ts";
import { jsonNoStore, readJson } from "../_shared/http.ts";
import { createErrorResponse } from "./errors.ts";

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
          await readJson(request, InvalidJsonError),
        ),
      );
    } catch (error) {
      return createErrorResponse(error, requestId);
    }
  }),
};
