import type {
  CurrentDeclaration,
  InstitutionReference,
  JoinDeclineAnswer,
  QuestionnairePayload,
  YesNoAnswer,
} from "./contracts.ts";
import { QUESTIONNAIRE_PDF_COPY as COPY } from "./questionnaire-pdf-copy.ts";

export type QuestionnairePdfRow = readonly [label: string, value: string];
export type QuestionnairePdfSection = {
  title: string;
  rows: readonly QuestionnairePdfRow[];
};

export function buildQuestionnairePdfSections(
  payload: QuestionnairePayload,
  declaration: CurrentDeclaration,
): readonly QuestionnairePdfSection[] {
  const personal = payload.personal;
  const registered = payload.registeredAddress;
  const correspondence = payload.correspondenceAddress;
  const insurance = payload.insurance;

  return [
    {
      title: COPY.sections.personal,
      rows: [
        [COPY.labels.firstName, value(personal.firstName)],
        [COPY.labels.lastName, value(personal.lastName)],
        [COPY.labels.maidenName, value(personal.maidenName)],
        [COPY.labels.middleName, value(personal.middleName)],
        [COPY.labels.birthDate, value(personal.birthDate)],
        [COPY.labels.birthPlace, value(personal.birthPlace)],
        [
          COPY.labels.identificationBasis,
          personal.identificationBasis === "pesel"
            ? COPY.values.pesel
            : COPY.values.identityDocument,
        ],
        ...(personal.identificationBasis === "pesel"
          ? [[COPY.labels.pesel, value(personal.pesel)] as const]
          : [
            [
              COPY.labels.identityDocumentKind,
              identityDocumentKind(personal.identityDocumentKind),
            ] as const,
            [
              COPY.labels.identityDocumentNumber,
              value(personal.identityDocumentNumber),
            ] as const,
          ]),
        [COPY.labels.nip, value(personal.nip)],
        [COPY.labels.citizenship, value(personal.citizenship)],
        [COPY.labels.phone, value(personal.phone)],
      ],
    },
    {
      title: COPY.sections.registeredAddress,
      rows: [
        [COPY.labels.street, value(registered.street)],
        [COPY.labels.houseNumber, value(registered.houseNumber)],
        [COPY.labels.apartmentNumber, value(registered.apartmentNumber)],
        [COPY.labels.postalCode, value(registered.postalCode)],
        [COPY.labels.city, value(registered.city)],
        [COPY.labels.voivodeship, value(registered.voivodeship)],
        [COPY.labels.county, value(registered.county)],
        [COPY.labels.municipality, value(registered.municipality)],
        [COPY.labels.postOffice, value(registered.postOffice)],
        [COPY.labels.countryCode, value(registered.countryCode)],
        [COPY.labels.legacyCountryName, value(registered.legacyCountryName)],
      ],
    },
    {
      title: COPY.sections.correspondenceAddress,
      rows: [
        [
          COPY.labels.sameAsRegistered,
          booleanValue(correspondence.sameAsRegistered),
        ],
        [COPY.labels.street, value(correspondence.street)],
        [COPY.labels.houseNumber, value(correspondence.houseNumber)],
        [COPY.labels.apartmentNumber, value(correspondence.apartmentNumber)],
        [COPY.labels.postalCode, value(correspondence.postalCode)],
        [COPY.labels.city, value(correspondence.city)],
        [COPY.labels.countryCode, value(correspondence.countryCode)],
        [
          COPY.labels.legacyCountryName,
          value(correspondence.legacyCountryName),
        ],
      ],
    },
    {
      title: COPY.sections.institutions,
      rows: [
        ...institutionRows(
          payload.institutions.taxOffice,
          COPY.labels.taxOfficeKind,
          COPY.labels.taxOfficeCode,
          COPY.labels.taxOfficeName,
        ),
        ...institutionRows(
          payload.institutions.nfzBranch,
          COPY.labels.nfzBranchKind,
          COPY.labels.nfzBranchCode,
          COPY.labels.nfzBranchName,
        ),
      ],
    },
    {
      title: COPY.sections.insurance,
      rows: [
        [COPY.labels.otherEmployment, yesNo(insurance.otherEmployment)],
        [COPY.labels.otherEmployerName, value(insurance.otherEmployerName)],
        [
          COPY.labels.otherEmploymentAtLeastMinimumWage,
          yesNo(insurance.otherEmploymentAtLeastMinimumWage),
        ],
        [COPY.labels.studentUnder26, yesNo(insurance.studentUnder26)],
        [
          COPY.labels.schoolOrUniversityName,
          value(insurance.schoolOrUniversityName),
        ],
        [
          COPY.labels.otherMandateContract,
          yesNo(insurance.otherMandateContract),
        ],
        [COPY.labels.otherPrincipalName, value(insurance.otherPrincipalName)],
        [
          COPY.labels.otherMandateContractSocialInsurance,
          yesNo(insurance.otherMandateContractSocialInsurance),
        ],
        [
          COPY.labels.subjectToCompulsorySocialInsurance,
          yesNo(insurance.subjectToCompulsorySocialInsurance),
        ],
        [
          COPY.labels.voluntarySicknessInsurance,
          joinDecline(insurance.voluntarySicknessInsurance),
        ],
        [
          COPY.labels.voluntarySicknessInsuranceJoinConfirmed,
          nullableBoolean(insurance.voluntarySicknessInsuranceJoinConfirmed),
        ],
        [
          COPY.labels.voluntaryPensionDisabilityInsurance,
          joinDecline(insurance.voluntaryPensionDisabilityInsurance),
        ],
        [
          COPY.labels.hasPensionOrDisabilityPensionRight,
          yesNo(insurance.hasPensionOrDisabilityPensionRight),
        ],
        [COPY.labels.disabilityDegree, disability(insurance.disabilityDegree)],
        [
          COPY.labels.registeredAtEmploymentOffice,
          yesNo(insurance.registeredAtEmploymentOffice),
        ],
        [
          COPY.labels.employmentOfficeAddress,
          value(insurance.employmentOfficeAddress),
        ],
      ],
    },
    {
      title: COPY.sections.payment,
      rows: [
        [COPY.labels.bankName, value(payload.payment.bankName)],
        [COPY.labels.bankAccount, value(payload.payment.bankAccount)],
      ],
    },
    {
      title: COPY.sections.declaration,
      rows: [
        [COPY.labels.statementKey, declaration.statementKey],
        [COPY.labels.statementVersion, String(declaration.statementVersion)],
        [COPY.labels.statementText, declaration.statementText],
        [
          COPY.labels.questionnaireRevision,
          String(declaration.questionnaireRevision),
        ],
        [COPY.labels.acceptedAt, declaration.acceptedAt],
        [COPY.labels.actorUserId, declaration.actorUserId],
        [COPY.labels.source, declaration.source],
      ],
    },
  ];
}

function institutionRows(
  reference: InstitutionReference,
  kindLabel: string,
  codeLabel: string,
  nameLabel: string,
): readonly QuestionnairePdfRow[] {
  return [
    [
      kindLabel,
      reference === null
        ? COPY.values.empty
        : reference.kind === "catalog"
        ? COPY.values.catalog
        : COPY.values.legacy,
    ],
    [codeLabel, value(reference?.code ?? null)],
    [nameLabel, value(reference?.name ?? null)],
  ];
}

function value(input: string | null): string {
  return input === null || input === "" ? COPY.values.empty : input;
}

function booleanValue(input: boolean): string {
  return input ? COPY.values.yes : COPY.values.no;
}

function nullableBoolean(input: boolean | null): string {
  return input === null ? COPY.values.empty : booleanValue(input);
}

function yesNo(input: YesNoAnswer): string {
  return input === null ? COPY.values.empty : COPY.values[input];
}

function joinDecline(input: JoinDeclineAnswer): string {
  return input === null ? COPY.values.empty : COPY.values[input];
}

function identityDocumentKind(
  input: QuestionnairePayload["personal"]["identityDocumentKind"],
): string {
  if (input === null) return COPY.values.empty;
  return {
    id_card: COPY.values.idCard,
    passport: COPY.values.passport,
    other: COPY.values.otherDocument,
  }[input];
}

function disability(
  input: QuestionnairePayload["insurance"]["disabilityDegree"],
): string {
  if (input === null) return COPY.values.empty;
  return {
    none: COPY.values.disabilityNone,
    light: COPY.values.disabilityLight,
    moderate: COPY.values.disabilityModerate,
    severe: COPY.values.disabilitySevere,
  }[input];
}
