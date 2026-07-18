import {
  FINAL_STATEMENT_KEY,
  type FinalDeclarationAcceptance,
  type QuestionnaireStatement,
  type RpcName,
} from "./contracts.ts";
import {
  BackendContractError,
  QuestionnaireValidationError,
} from "./errors.ts";
import { createFieldErrors } from "./request-reader.ts";

export async function validateStatementIntegrity(
  statement: QuestionnaireStatement,
  rpcName: RpcName,
): Promise<void> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(statement.statementText),
  );
  if (encodeBase64(new Uint8Array(digest)) !== statement.statementSha256Base64) {
    throw new BackendContractError(rpcName);
  }
}

export function validateFinalDeclaration(
  complete: boolean,
  acceptance: FinalDeclarationAcceptance | null,
  statement: QuestionnaireStatement,
): void {
  if (!complete) {
    return;
  }
  const errors = createFieldErrors();
  if (acceptance === null) {
    errors.finalDeclaration = "Final declaration is required.";
  } else {
    if (
      acceptance.statementKey !== FINAL_STATEMENT_KEY ||
      acceptance.statementKey !== statement.statementKey
    ) {
      errors["finalDeclaration.statementKey"] =
        "Statement key does not match the current declaration.";
    }
    if (acceptance.statementVersion !== statement.statementVersion) {
      errors["finalDeclaration.statementVersion"] =
        "Statement version does not match the current declaration.";
    }
  }
  if (Object.keys(errors).length > 0) {
    throw new QuestionnaireValidationError(errors);
  }
}

function encodeBase64(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}
