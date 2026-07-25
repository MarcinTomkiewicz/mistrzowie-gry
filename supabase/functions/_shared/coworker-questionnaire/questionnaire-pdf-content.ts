import { buildCountryOptions } from "../../../../src/app/core/utils/country-options.ts";
import type {
  InsuranceData,
  JoinDeclineAnswer,
  PersonalData,
  QuestionnairePayload,
  YesNoAnswer,
} from "./contracts.ts";
import { QUESTIONNAIRE_PDF_COPY as COPY } from "./questionnaire-pdf-copy.ts";
import { buildQuestionnaireDeclarationRows } from "./questionnaire-pdf-declaration-content.ts";

export type QuestionnairePdfRow = readonly [label: string, value: string];
export type QuestionnairePdfSection = {
  title: string;
  rows: readonly QuestionnairePdfRow[];
};

const POLISH_COUNTRY_OPTIONS = buildCountryOptions("pl");

export function buildQuestionnairePdfSections(
  payload: QuestionnairePayload,
  statementText: string,
): readonly QuestionnairePdfSection[] {
  const sections: QuestionnairePdfSection[] = [
    {
      title: COPY.sections.personal,
      rows: personalRows(payload.personal),
    },
    {
      title: COPY.sections.registeredAddress,
      rows: registeredAddressRows(payload),
    },
  ];

  if (!payload.correspondenceAddress.sameAsRegistered) {
    sections.push({
      title: COPY.sections.correspondenceAddress,
      rows: correspondenceAddressRows(payload),
    });
  }

  sections.push(
    {
      title: COPY.sections.institutions,
      rows: [
        row(
          COPY.labels.taxOffice,
          value(payload.institutions.taxOffice?.name ?? null),
        ),
        row(
          COPY.labels.nfzBranch,
          value(payload.institutions.nfzBranch?.name ?? null),
        ),
      ],
    },
    {
      title: COPY.sections.insurance,
      rows: [],
    },
    {
      title: COPY.sections.insuranceExclusions,
      rows: insuranceExclusionRows(payload.insurance),
    },
    {
      title: COPY.sections.compulsoryInsurance,
      rows: compulsoryInsuranceRows(payload.insurance),
    },
    {
      title: COPY.sections.declaration,
      rows: buildQuestionnaireDeclarationRows(payload, statementText),
    },
  );

  return sections;
}

function personalRows(personal: PersonalData): QuestionnairePdfRow[] {
  const rows = [
    row(COPY.labels.lastName, value(personal.lastName)),
    row(COPY.labels.firstName, value(personal.firstName)),
    row(COPY.labels.maidenName, value(personal.maidenName)),
    row(COPY.labels.middleName, value(personal.middleName)),
    row(COPY.labels.birthDate, value(personal.birthDate)),
    row(COPY.labels.birthPlace, value(personal.birthPlace)),
  ];

  if (personal.identificationBasis === "pesel") {
    rows.push(row(COPY.labels.pesel, value(personal.pesel)));
  }
  rows.push(row(COPY.labels.nip, value(personal.nip)));
  if (personal.identificationBasis === "identity_document") {
    rows.push(identityDocumentRow(personal));
  }
  rows.push(
    row(COPY.labels.citizenship, value(personal.citizenship)),
    row(COPY.labels.phone, value(personal.phone)),
  );

  return rows;
}

function registeredAddressRows(
  payload: QuestionnairePayload,
): QuestionnairePdfRow[] {
  const address = payload.registeredAddress;
  const rows = [
    row(COPY.labels.postalCode, value(address.postalCode)),
    row(COPY.labels.city, value(address.city)),
    row(COPY.labels.street, value(address.street)),
    row(COPY.labels.houseNumber, value(address.houseNumber)),
    row(COPY.labels.apartmentNumber, value(address.apartmentNumber)),
  ];

  if (address.countryCode === "PL") {
    rows.push(
      row(COPY.labels.voivodeship, value(address.voivodeship)),
      row(COPY.labels.county, value(address.county)),
      row(COPY.labels.municipality, value(address.municipality)),
      row(COPY.labels.postOffice, value(address.postOffice)),
    );
  }
  rows.push(row(COPY.labels.country, countryName(address.countryCode)));

  return rows;
}

function correspondenceAddressRows(
  payload: QuestionnairePayload,
): QuestionnairePdfRow[] {
  const address = payload.correspondenceAddress;
  return [
    row(COPY.labels.postalCode, value(address.postalCode)),
    row(COPY.labels.city, value(address.city)),
    row(COPY.labels.street, value(address.street)),
    row(COPY.labels.houseNumber, value(address.houseNumber)),
    row(COPY.labels.apartmentNumber, value(address.apartmentNumber)),
    row(COPY.labels.country, countryName(address.countryCode)),
  ];
}

function insuranceExclusionRows(
  insurance: InsuranceData,
): QuestionnairePdfRow[] {
  const rows = [
    row(COPY.labels.otherEmployment, yesNo(insurance.otherEmployment)),
  ];
  if (insurance.otherEmployment === "yes") {
    rows.push(
      row(
        COPY.labels.otherEmployerName,
        value(insurance.otherEmployerName),
      ),
      row(
        COPY.labels.otherEmploymentAtLeastMinimumWage,
        yesNo(insurance.otherEmploymentAtLeastMinimumWage),
      ),
    );
  }

  rows.push(row(COPY.labels.studentUnder26, yesNo(insurance.studentUnder26)));
  if (insurance.studentUnder26 === "yes") {
    rows.push(
      row(
        COPY.labels.schoolOrUniversityName,
        value(insurance.schoolOrUniversityName),
      ),
    );
  }

  rows.push(
    row(
      COPY.labels.otherMandateContract,
      yesNo(insurance.otherMandateContract),
    ),
  );
  if (insurance.otherMandateContract === "yes") {
    rows.push(
      row(
        COPY.labels.otherPrincipalName,
        value(insurance.otherPrincipalName),
      ),
      row(
        COPY.labels.otherMandateContractSocialInsurance,
        yesNo(insurance.otherMandateContractSocialInsurance),
      ),
    );
  }

  if (insurance.subjectToCompulsorySocialInsurance === "no") {
    rows.push(
      row(
        "",
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
): QuestionnairePdfRow[] {
  return [
    row(
      COPY.labels.subjectToCompulsorySocialInsurance,
      yesNo(insurance.subjectToCompulsorySocialInsurance),
    ),
    row(
      "",
      selectedJoinDeclineStatement(
        insurance.voluntarySicknessInsurance,
        COPY.statements.voluntarySicknessInsurance,
      ),
    ),
  ];
}

function countryName(countryCode: string | null): string {
  if (countryCode === null) return COPY.values.empty;
  return POLISH_COUNTRY_OPTIONS.find(
    (option) => option.value === countryCode,
  )?.label ?? COPY.values.empty;
}

function row(label: string, content: string): QuestionnairePdfRow {
  return [label, content];
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

function identityDocumentRow(personal: PersonalData): QuestionnairePdfRow {
  const number = value(personal.identityDocumentNumber);
  const kind = personal.identityDocumentKind;
  const label = kind === null
    ? COPY.values.empty
    : {
      id_card: COPY.labels.identityDocument,
      passport: COPY.values.passport,
      other: COPY.values.otherDocument,
    }[kind];

  return row(label, number);
}
