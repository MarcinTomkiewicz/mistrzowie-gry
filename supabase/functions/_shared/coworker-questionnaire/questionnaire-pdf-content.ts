import type {
  InsuranceData,
  JoinDeclineAnswer,
  PersonalData,
  QuestionnairePayload,
  YesNoAnswer,
} from "./contracts.ts";
import type {
  QuestionnairePdfContent,
  QuestionnairePdfField,
  QuestionnairePdfFieldSpan,
  QuestionnairePdfFormRow,
  QuestionnairePdfHeadingLevel,
} from "./questionnaire-pdf-content-model.ts";
import { QUESTIONNAIRE_PDF_COPY as COPY } from "./questionnaire-pdf-copy.ts";
import { buildQuestionnaireDeclarationContent } from "./questionnaire-pdf-declaration-content.ts";

const POLISH_REGION_NAMES = new Intl.DisplayNames(["pl"], {
  type: "region",
  fallback: "none",
});

export function buildQuestionnairePdfContent(
  payload: QuestionnairePayload,
  statementText: string,
): readonly QuestionnairePdfContent[] {
  const content: QuestionnairePdfContent[] = [
    heading(COPY.sections.personal, "section"),
    fieldGrid(personalFields(payload.personal)),
    heading(COPY.sections.registeredAddress, "subsection"),
    fieldGrid(registeredAddressFields(payload)),
  ];

  if (!payload.correspondenceAddress.sameAsRegistered) {
    content.push(
      heading(COPY.sections.correspondenceAddress, "subsection"),
      fieldGrid(correspondenceAddressFields(payload)),
    );
  }

  content.push(
    heading(COPY.sections.institutions, "section"),
    fieldGrid([
      field(
        COPY.labels.taxOffice,
        value(payload.institutions.taxOffice?.name ?? null),
      ),
      field(
        COPY.labels.nfzBranch,
        value(payload.institutions.nfzBranch?.name ?? null),
      ),
    ]),
    heading(COPY.sections.insurance, "section"),
    heading(COPY.sections.insuranceExclusions, "subsection"),
    formRows(insuranceExclusionRows(payload.insurance)),
    heading(COPY.sections.compulsoryInsurance, "subsection"),
    formRows(compulsoryInsuranceRows(payload.insurance)),
    heading(COPY.sections.declaration, "section"),
    ...buildQuestionnaireDeclarationContent(payload, statementText),
    {
      kind: "signature",
      placeAndDateLabel: COPY.signature.placeAndDate,
      signatureLabel: COPY.signature.coworker,
    },
  );

  return content;
}

function personalFields(personal: PersonalData): QuestionnairePdfField[] {
  const fields = [
    field(COPY.labels.lastName, value(personal.lastName)),
    field(COPY.labels.firstName, value(personal.firstName)),
    field(COPY.labels.maidenName, value(personal.maidenName)),
    field(COPY.labels.middleName, value(personal.middleName)),
    field(COPY.labels.birthDate, value(personal.birthDate)),
    field(COPY.labels.birthPlace, value(personal.birthPlace)),
  ];

  if (personal.identificationBasis === "pesel") {
    fields.push(field(COPY.labels.pesel, value(personal.pesel)));
  }
  fields.push(field(COPY.labels.nip, value(personal.nip)));
  if (personal.identificationBasis === "identity_document") {
    fields.push(identityDocumentField(personal));
  }
  fields.push(
    field(COPY.labels.citizenship, value(personal.citizenship)),
    field(COPY.labels.phone, value(personal.phone)),
  );

  return fields;
}

function registeredAddressFields(
  payload: QuestionnairePayload,
): QuestionnairePdfField[] {
  const address = payload.registeredAddress;
  const fields = [
    field(COPY.labels.postalCode, value(address.postalCode)),
    field(COPY.labels.city, value(address.city)),
    field(COPY.labels.street, value(address.street)),
    field(COPY.labels.houseNumber, value(address.houseNumber)),
    field(COPY.labels.apartmentNumber, value(address.apartmentNumber)),
  ];

  if (address.countryCode === "PL") {
    fields.push(
      field(COPY.labels.voivodeship, value(address.voivodeship)),
      field(COPY.labels.county, value(address.county)),
      field(COPY.labels.municipality, value(address.municipality)),
      field(COPY.labels.postOffice, value(address.postOffice)),
    );
  }
  fields.push(field(COPY.labels.country, countryName(address.countryCode)));

  return fields;
}

function correspondenceAddressFields(
  payload: QuestionnairePayload,
): QuestionnairePdfField[] {
  const address = payload.correspondenceAddress;
  return [
    field(COPY.labels.postalCode, value(address.postalCode)),
    field(COPY.labels.city, value(address.city)),
    field(COPY.labels.street, value(address.street)),
    field(COPY.labels.houseNumber, value(address.houseNumber)),
    field(COPY.labels.apartmentNumber, value(address.apartmentNumber)),
    field(COPY.labels.country, countryName(address.countryCode)),
  ];
}

function insuranceExclusionRows(
  insurance: InsuranceData,
): QuestionnairePdfFormRow[] {
  const rows = [
    answerRow(COPY.labels.otherEmployment, yesNo(insurance.otherEmployment)),
  ];
  if (insurance.otherEmployment === "yes") {
    rows.push(
      detailRow(
        COPY.labels.otherEmployerName,
        value(insurance.otherEmployerName),
      ),
      answerRow(
        COPY.labels.otherEmploymentAtLeastMinimumWage,
        yesNo(insurance.otherEmploymentAtLeastMinimumWage),
      ),
    );
  }

  rows.push(
    answerRow(COPY.labels.studentUnder26, yesNo(insurance.studentUnder26)),
  );
  if (insurance.studentUnder26 === "yes") {
    rows.push(
      detailRow(
        COPY.labels.schoolOrUniversityName,
        value(insurance.schoolOrUniversityName),
      ),
    );
  }

  rows.push(
    answerRow(
      COPY.labels.otherMandateContract,
      yesNo(insurance.otherMandateContract),
    ),
  );
  if (insurance.otherMandateContract === "yes") {
    rows.push(
      detailRow(
        COPY.labels.otherPrincipalName,
        value(insurance.otherPrincipalName),
      ),
      answerRow(
        COPY.labels.otherMandateContractSocialInsurance,
        yesNo(insurance.otherMandateContractSocialInsurance),
      ),
    );
  }

  if (insurance.subjectToCompulsorySocialInsurance === "no") {
    rows.push(
      textRow(
        selectedJoinDeclineStatement(
          insurance.voluntaryPensionDisabilityInsurance,
          COPY.statements.voluntaryPensionDisabilityInsurance,
        ),
      ),
    );
  }

  return rows;
}

function compulsoryInsuranceRows(
  insurance: InsuranceData,
): QuestionnairePdfFormRow[] {
  return [
    answerRow(
      COPY.labels.subjectToCompulsorySocialInsurance,
      yesNo(insurance.subjectToCompulsorySocialInsurance),
    ),
    textRow(
      selectedJoinDeclineStatement(
        insurance.voluntarySicknessInsurance,
        COPY.statements.voluntarySicknessInsurance,
      ),
    ),
  ];
}

function heading(
  text: string,
  level: QuestionnairePdfHeadingLevel,
): QuestionnairePdfContent {
  return { kind: "heading", level, text };
}

function fieldGrid(
  fields: readonly QuestionnairePdfField[],
): QuestionnairePdfContent {
  return { kind: "field-grid", fields };
}

function formRows(
  rows: readonly QuestionnairePdfFormRow[],
): QuestionnairePdfContent {
  return { kind: "form-rows", rows };
}

function field(
  label: string,
  fieldValue: string,
  span: QuestionnairePdfFieldSpan = "column",
): QuestionnairePdfField {
  return { label, value: fieldValue, span };
}

function answerRow(label: string, rowValue: string): QuestionnairePdfFormRow {
  return { label, value: rowValue, layout: "answer" };
}

function detailRow(label: string, rowValue: string): QuestionnairePdfFormRow {
  return { label, value: rowValue, layout: "detail" };
}

function textRow(rowValue: string): QuestionnairePdfFormRow {
  return { label: "", value: rowValue, layout: "text" };
}

function value(input: string | null): string {
  return input === null || input === "" ? COPY.values.empty : input;
}

function yesNo(input: YesNoAnswer): string {
  return input === null ? COPY.values.empty : COPY.values[input];
}

function selectedJoinDeclineStatement(
  answer: JoinDeclineAnswer,
  variants: Readonly<{ join: string; decline: string }>,
): string {
  return answer === null ? COPY.values.empty : variants[answer];
}

function countryName(countryCode: string | null): string {
  if (countryCode === null || !/^[A-Z]{2}$/.test(countryCode)) {
    return COPY.values.empty;
  }
  return POLISH_REGION_NAMES.of(countryCode) ?? COPY.values.empty;
}

function identityDocumentField(
  personal: PersonalData,
): QuestionnairePdfField {
  const kind = personal.identityDocumentKind;
  const label = kind === null ? COPY.values.empty : {
    id_card: COPY.labels.identityDocument,
    passport: COPY.values.passport,
    other: COPY.values.otherDocument,
  }[kind];

  return field(label, value(personal.identityDocumentNumber), "full");
}
