import type { FieldErrors, RpcName } from "./contracts.ts";

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
