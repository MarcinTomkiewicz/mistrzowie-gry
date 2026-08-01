import type { SupabaseClient } from "npm:@supabase/supabase-js@^2";

import type { SigningPackageActionRequest } from "./signing-package-contracts.ts";
import {
  parseAdminSigningPackageList,
  parseExternalDelivery,
  parseIssueSigningPackageResult,
  parseSigningPackageDetail,
} from "./signing-package-response-contracts.ts";
import {
  getSigningPackageDetail,
  getSigningPackageList,
  issueSigningPackage,
  recordQuestionnaireDelivery,
} from "./signing-package-rpc.ts";

export async function handleSigningPackageAction(
  client: SupabaseClient,
  actorUserId: string,
  action: SigningPackageActionRequest,
): Promise<Response> {
  switch (action.action) {
    case "recordQuestionnaireDelivery": {
      const data = await recordQuestionnaireDelivery(
        client,
        actorUserId,
        action.userId,
        action.onboardingCaseId,
        action.documentId,
        action.documentVersionId,
        action.note,
      );
      return Response.json({
        ok: true,
        action: "recordQuestionnaireDelivery",
        result: parseExternalDelivery(data, {
          userId: action.userId,
          onboardingCaseId: action.onboardingCaseId,
          documentId: action.documentId,
          documentVersionId: action.documentVersionId,
        }),
      });
    }
    case "issueSigningPackage": {
      const data = await issueSigningPackage(
        client,
        actorUserId,
        action.userId,
        action.onboardingCaseId,
      );
      return Response.json({
        ok: true,
        action: "issueSigningPackage",
        result: parseIssueSigningPackageResult(
          data,
          action.userId,
          action.onboardingCaseId,
        ),
      });
    }
    case "getSigningPackageList": {
      const data = await getSigningPackageList(client, actorUserId);
      return Response.json({
        ok: true,
        action: "getSigningPackageList",
        packages: parseAdminSigningPackageList(data),
      });
    }
    case "getSigningPackageDetail": {
      const data = await getSigningPackageDetail(
        client,
        actorUserId,
        action.packageId,
      );
      return Response.json({
        ok: true,
        action: "getSigningPackageDetail",
        detail: parseSigningPackageDetail(data, action.packageId),
      });
    }
  }
}
