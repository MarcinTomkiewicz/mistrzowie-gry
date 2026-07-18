import type {
  FieldErrors,
  FinalDeclarationAcceptance,
  ParsedQuestionnairePutRequest,
  QuestionnairePayload,
  SensitivePreservation,
} from "./contracts.ts";
import { parseCorrespondenceAddress, parseRegisteredAddress } from "./parse-addresses.ts";
import { parseInstitutions } from "./parse-institutions.ts";
import { parseInsurance } from "./parse-insurance.ts";
import { parsePersonal } from "./parse-personal.ts";
import {
  createFieldErrors,
  requestBoolean,
  requestNullablePositiveInteger,
  requestObject,
  requestOptionalNullableString,
  requestPositiveInteger,
  requestString,
  requestTrue,
  throwIfRequestInvalid,
} from "./request-reader.ts";

const REQUEST_KEYS = [
  "data",
  "complete",
  "expectedRevision",
  "finalDeclaration",
] as const;
const DATA_KEYS = [
  "personal",
  "registeredAddress",
  "correspondenceAddress",
  "institutions",
  "insurance",
  "payment",
] as const;
const PAYMENT_KEYS = ["bankName", "bankAccount"] as const;
const DECLARATION_KEYS = [
  "statementKey",
  "statementVersion",
  "accepted",
] as const;

export function parseQuestionnairePutRequest(
  value: unknown,
): ParsedQuestionnairePutRequest {
  const errors = createFieldErrors();
  const request = requestObject(value, "", REQUEST_KEYS, [], errors);
  const parsed = parseData(request.data, true, errors);
  const complete = requestBoolean(request, "complete", "complete", errors);
  const finalDeclaration = parseFinalDeclaration(
    request.finalDeclaration,
    errors,
  );

  if (complete && finalDeclaration === null) {
    errors.finalDeclaration = "Final declaration is required.";
  } else if (!complete && finalDeclaration !== null) {
    errors.finalDeclaration = "Final declaration must be null for a draft.";
  }

  const result: ParsedQuestionnairePutRequest = {
    data: parsed.data,
    complete,
    expectedRevision: requestNullablePositiveInteger(
      request,
      "expectedRevision",
      "expectedRevision",
      errors,
    ),
    finalDeclaration,
    preserveSensitive: parsed.preserveSensitive,
  };

  throwIfRequestInvalid(errors);
  return result;
}

export function parseStoredQuestionnairePayload(
  value: unknown,
): QuestionnairePayload {
  const errors = createFieldErrors();
  const parsed = parseData(value, false, errors);
  throwIfRequestInvalid(errors);
  return parsed.data;
}

function parseData(
  value: unknown,
  allowSensitiveOmission: boolean,
  errors: FieldErrors,
): { data: QuestionnairePayload; preserveSensitive: SensitivePreservation } {
  const source = requestObject(value, "data", DATA_KEYS, [], errors);
  const personal = parsePersonal(
    source.personal,
    allowSensitiveOmission,
    errors,
  );
  const payment = parsePayment(
    source.payment,
    allowSensitiveOmission,
    errors,
  );

  return {
    data: {
      personal: personal.data,
      registeredAddress: parseRegisteredAddress(
        source.registeredAddress,
        errors,
      ),
      correspondenceAddress: parseCorrespondenceAddress(
        source.correspondenceAddress,
        errors,
      ),
      institutions: parseInstitutions(source.institutions, errors),
      insurance: parseInsurance(source.insurance, errors),
      payment: payment.data,
    },
    preserveSensitive: {
      ...personal.preserve,
      bankAccount: payment.preserve,
    },
  };
}

function parsePayment(
  value: unknown,
  allowSensitiveOmission: boolean,
  errors: FieldErrors,
) {
  const source = requestObject(
    value,
    "data.payment",
    PAYMENT_KEYS,
    allowSensitiveOmission ? ["bankAccount"] : [],
    errors,
  );
  let bankAccount: string;
  let preserve = false;
  if (allowSensitiveOmission) {
    const input = requestOptionalNullableString(
      source,
      "bankAccount",
      "data.payment.bankAccount",
      errors,
    );
    if (
      input.missing ||
      input.value === null ||
      input.value.trim() === ""
    ) {
      preserve = true;
      bankAccount = "";
    } else {
      bankAccount = input.value;
    }
  } else {
    bankAccount = requestString(
      source,
      "bankAccount",
      "data.payment.bankAccount",
      errors,
    );
  }

  return {
    data: {
      bankName: requestString(
        source,
        "bankName",
        "data.payment.bankName",
        errors,
      ),
      bankAccount,
    },
    preserve,
  };
}

function parseFinalDeclaration(
  value: unknown,
  errors: FieldErrors,
): FinalDeclarationAcceptance | null {
  if (value === null) {
    return null;
  }

  const source = requestObject(
    value,
    "finalDeclaration",
    DECLARATION_KEYS,
    [],
    errors,
  );

  return {
    statementKey: requestString(
      source,
      "statementKey",
      "finalDeclaration.statementKey",
      errors,
    ),
    statementVersion: requestPositiveInteger(
      source,
      "statementVersion",
      "finalDeclaration.statementVersion",
      errors,
    ),
    accepted: requestTrue(
      source,
      "accepted",
      "finalDeclaration.accepted",
      errors,
    ),
  };
}
