import { withSupabase } from "npm:@supabase/server@^1";

import { jsonNoStore } from "../_shared/coworker-questionnaire/http.ts";
import {
  getSelfQuestionnaire,
  putSelfQuestionnaire,
} from "../_shared/coworker-questionnaire/self.ts";
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
      const userId = context.userClaims?.id;
      if (typeof userId !== "string" || userId === "") {
        throw new MissingUserClaimsError();
      }

      switch (request.method) {
        case "GET":
          return jsonNoStore(
            await getSelfQuestionnaire(context.supabaseAdmin, userId),
          );
        case "PUT":
          return jsonNoStore(
            await putSelfQuestionnaire(
              context.supabaseAdmin,
              userId,
              await readJson(request),
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

async function readJson(request: Request): Promise<unknown> {
  try {
    return (await request.json()) as unknown;
  } catch {
    throw new InvalidJsonError();
  }
}
