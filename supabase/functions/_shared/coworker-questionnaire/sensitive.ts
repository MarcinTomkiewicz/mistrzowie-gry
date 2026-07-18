import type {
  QuestionnairePayload,
  RedactedQuestionnairePayload,
  SensitiveFieldMetadata,
  SensitiveLast4,
  SensitiveMetadata,
  SensitivePreservation,
} from "./contracts.ts";

export function hasSensitivePreservation(
  preservation: SensitivePreservation,
): boolean {
  return preservation.pesel ||
    preservation.identityDocumentNumber ||
    preservation.bankAccount;
}

export function mergeSensitiveValues(
  incoming: QuestionnairePayload,
  preservation: SensitivePreservation,
  existing: QuestionnairePayload | null,
): QuestionnairePayload {
  return {
    ...incoming,
    personal: {
      ...incoming.personal,
      pesel: preservation.pesel
        ? (existing?.personal.pesel ?? null)
        : incoming.personal.pesel,
      identityDocumentNumber: preservation.identityDocumentNumber
        ? (existing?.personal.identityDocumentNumber ?? null)
        : incoming.personal.identityDocumentNumber,
    },
    payment: {
      ...incoming.payment,
      bankAccount: preservation.bankAccount
        ? (existing?.payment.bankAccount ?? "")
        : incoming.payment.bankAccount,
    },
  };
}

export function redactSensitiveValues(
  payload: QuestionnairePayload,
): RedactedQuestionnairePayload {
  return {
    ...payload,
    personal: {
      ...payload.personal,
      pesel: "",
      identityDocumentNumber: "",
    },
    payment: { ...payload.payment, bankAccount: "" },
  };
}

export function getSensitiveLast4(
  payload: QuestionnairePayload,
): SensitiveLast4 {
  return {
    peselLast4: payload.personal.pesel?.slice(-4) ?? null,
    identityDocumentLast4:
      payload.personal.identityDocumentNumber?.slice(-4) ?? null,
    bankAccountLast4: payload.payment.bankAccount.slice(-4) || null,
  };
}

export function buildSensitiveMetadata(
  payload: QuestionnairePayload,
): SensitiveMetadata {
  return buildSensitiveMetadataFromLast4(getSensitiveLast4(payload));
}

export function emptySensitiveMetadata(): SensitiveMetadata {
  return buildSensitiveMetadataFromLast4({
    peselLast4: null,
    identityDocumentLast4: null,
    bankAccountLast4: null,
  });
}

function buildSensitiveMetadataFromLast4(
  last4: SensitiveLast4,
): SensitiveMetadata {
  return {
    pesel: field(last4.peselLast4, "*******"),
    identityDocumentNumber: field(last4.identityDocumentLast4, "••••"),
    bankAccount: field(last4.bankAccountLast4, "••••"),
  };
}

function field(
  last4: string | null,
  maskPrefix: string,
): SensitiveFieldMetadata {
  return {
    configured: last4 !== null,
    masked: last4 === null ? null : `${maskPrefix}${last4}`,
  };
}
