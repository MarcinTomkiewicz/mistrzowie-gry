import { formatBankAccount } from "../../../../src/app/core/utils/bank-account.ts";
import type {
  DisabilityDegree,
  QuestionnairePayload,
  YesNoAnswer,
} from "./contracts.ts";
import { QUESTIONNAIRE_PDF_COPY as COPY } from "./questionnaire-pdf-copy.ts";
import type { QuestionnairePdfRow } from "./questionnaire-pdf-content.ts";

const STATEMENT_CONTRACT_ERROR =
  "Questionnaire statement text does not match the PDF content contract.";

export function buildQuestionnaireDeclarationRows(
  payload: QuestionnairePayload,
  statementText: string,
): readonly QuestionnairePdfRow[] {
  const statement = splitStatementText(statementText);
  const insurance = payload.insurance;
  const rows: QuestionnairePdfRow[] = [
    ["", statement.opening],
    [
      "",
      selectedYesNoStatement(
        insurance.hasPensionOrDisabilityPensionRight,
        COPY.statements.pensionOrDisabilityPensionRight,
      ),
    ],
    ["", disabilityStatement(insurance.disabilityDegree)],
    [
      "",
      selectedYesNoStatement(
        insurance.registeredAtEmploymentOffice,
        COPY.statements.employmentOfficeRegistration,
      ),
    ],
  ];

  if (insurance.registeredAtEmploymentOffice === "yes") {
    rows.push([
      COPY.labels.employmentOfficeAddress,
      value(insurance.employmentOfficeAddress),
    ]);
  }
  rows.push(
    [
      COPY.labels.bankAccount,
      value(formatBankAccount(payload.payment.bankAccount)),
    ],
    [COPY.labels.bankName, value(payload.payment.bankName)],
    ["", statement.confirmation],
  );

  return rows;
}

function splitStatementText(statementText: string): {
  opening: string;
  confirmation: string;
} {
  const contract = COPY.statements.finalDeclaration;
  const confirmationIndex = statementText.indexOf(contract.confirmation);
  const confirmationEnd = confirmationIndex + contract.confirmation.length;
  const opening = statementText.slice(0, confirmationIndex);

  if (
    !statementText.startsWith(contract.opening) ||
    confirmationIndex <= contract.opening.length ||
    confirmationIndex !== statementText.lastIndexOf(contract.confirmation) ||
    opening.slice(contract.opening.length).trim() === "" ||
    statementText.slice(confirmationEnd).trim() !== ""
  ) {
    throw new Error(STATEMENT_CONTRACT_ERROR);
  }

  return {
    opening,
    confirmation: statementText.slice(confirmationIndex),
  };
}

function selectedYesNoStatement(
  answer: YesNoAnswer,
  variants: Readonly<{ yes: string; no: string }>,
): string {
  return answer === null ? COPY.values.empty : variants[answer];
}

function disabilityStatement(degree: DisabilityDegree): string {
  return degree === null
    ? COPY.values.empty
    : COPY.statements.disabilityDegree[degree];
}

function value(input: string | null): string {
  return input === null || input === "" ? COPY.values.empty : input;
}
