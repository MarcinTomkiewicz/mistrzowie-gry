import type { QuestionnaireDocumentReservation } from "./questionnaire-document-contracts.ts";
import type { RpcName } from "./rpc-names.ts";

export function logQuestionnaireDocumentFailure(
  code: string,
  stage: string,
  requestId: string,
  rpcName: RpcName | null,
  reservation: QuestionnaireDocumentReservation | null,
  error: unknown,
): void {
  console.error(JSON.stringify({
    code,
    requestId,
    stage,
    ...(rpcName === null ? {} : { rpcName }),
    ...(reservation === null ? {} : {
      uploadSessionId: reservation.uploadSessionId,
      documentId: reservation.documentId,
      documentVersionId: reservation.documentVersionId,
    }),
    errorType: error instanceof Error ? error.name : "UnknownError",
  }));
}
