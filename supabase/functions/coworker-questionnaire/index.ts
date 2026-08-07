import { withSupabase } from "npm:@supabase/server@^1";

import { jsonNoStore, readJson } from "../_shared/http.ts";
import {
  InvalidJsonError,
  MethodNotAllowedError,
  MissingUserClaimsError,
} from "../_shared/coworker-questionnaire/errors.ts";
import {
  getSelfQuestionnaire,
  putSelfQuestionnaire,
} from "../_shared/coworker-questionnaire/self.ts";
import { createErrorResponse } from "./errors.ts";

export default {
  fetch: withSupabase({ auth: "user" }, async (request, context) => {
    const requestId = crypto.randomUUID();
    try {
      const userId = context.userClaims?.id;
      if (typeof userId !== "string" || userId === "") {
        throw new MissingUserClaimsError();
      }

      switch (request.method) {
        case "GET":
          return jsonNoStore(
            await getSelfQuestionnaire(
              context.supabaseAdmin,
              context.supabase,
              userId,
            ),
          );
        case "PUT":
          return jsonNoStore(
            await putSelfQuestionnaire(
              context.supabaseAdmin,
              context.supabase,
              userId,
              await readJson(request, InvalidJsonError),
            ),
          );
        default:
          throw new MethodNotAllowedError();
      }
    } catch (error) {
      return createErrorResponse(error, requestId);
    }
  }),
};
