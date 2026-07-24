import type { FieldErrors } from "./contracts.ts";
import type { RpcName } from "./rpc-names.ts";

export class QuestionnaireValidationError extends Error {
  constructor(readonly fieldErrors: FieldErrors) {
    super("Questionnaire validation failed.");
    this.name = "QuestionnaireValidationError";
  }
}

export class BackendContractError extends Error {
  constructor(readonly rpcName: RpcName | null = null) {
    super("Questionnaire backend contract validation failed.");
    this.name = "BackendContractError";
  }
}

export class RpcCallError extends Error {
  constructor(
    readonly rpcName: RpcName,
    readonly sqlState: string | null,
    readonly databaseMessage: string | null,
    readonly databaseDetails: string | null,
  ) {
    super("Questionnaire RPC call failed.");
    this.name = "RpcCallError";
  }
}

export class CryptoConfigurationError extends Error {
  constructor() {
    super("Invalid questionnaire cryptographic configuration.");
    this.name = "CryptoConfigurationError";
  }
}

export class CryptoOperationError extends Error {
  constructor() {
    super("Questionnaire cryptographic operation failed.");
    this.name = "CryptoOperationError";
  }
}

export class QuestionnairePdfGenerationError extends Error {
  constructor() {
    super("Questionnaire PDF generation failed.");
    this.name = "QuestionnairePdfGenerationError";
  }
}

export class QuestionnaireDocumentStorageError extends Error {
  constructor() {
    super("Questionnaire document Storage upload failed.");
    this.name = "QuestionnaireDocumentStorageError";
  }
}

export class QuestionnaireDocumentFinalizationError extends Error {
  constructor() {
    super("Questionnaire document finalization failed.");
    this.name = "QuestionnaireDocumentFinalizationError";
  }
}

export class QuestionnaireDocumentCleanupError extends Error {
  constructor() {
    super("Questionnaire document cleanup failed.");
    this.name = "QuestionnaireDocumentCleanupError";
  }
}
