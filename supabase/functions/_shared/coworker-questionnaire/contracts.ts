export const ENCRYPTION_KEY_VERSION = 1;
export const PAYLOAD_SCHEMA_VERSION = 2;
export const VALIDATION_SCHEMA_VERSION = 2;
export const FINAL_STATEMENT_KEY =
  "coworker.questionnaire.final-declaration";

export const RPC = {
  getAdminEnvelope: "get_admin_coworker_questionnaire_envelope",
  getEnvelope: "get_coworker_questionnaire_envelope",
  getStatement: "get_coworker_questionnaire_statement",
  saveEnvelope: "save_coworker_questionnaire_envelope",
} as const;

export type RpcName = typeof RPC[keyof typeof RPC];
export type UnknownObject = { [key: string]: unknown };
export type FieldErrors = { [field: string]: string };

export type AdminQuestionnaireScope = "masked" | "full";
export type AdminQuestionnairePurpose =
  | "contract_preparation"
  | "payroll_processing"
  | "legal_review"
  | "data_correction";

export interface AdminQuestionnaireRequest {
  action: "getQuestionnaire";
  userId: string;
  scope: AdminQuestionnaireScope;
  purpose: AdminQuestionnairePurpose;
}

export type YesNoAnswer = "yes" | "no" | null;
export type JoinDeclineAnswer = "join" | "decline" | null;
export type IdentificationBasis = "pesel" | "identity_document" | null;
export type IdentityDocumentKind =
  | "id_card"
  | "passport"
  | "other"
  | null;
export type DisabilityDegree =
  | "none"
  | "light"
  | "moderate"
  | "severe"
  | null;

export interface PersonalData {
  firstName: string;
  lastName: string;
  maidenName: string | null;
  middleName: string | null;
  birthDate: string;
  birthPlace: string;
  identificationBasis: IdentificationBasis;
  pesel: string | null;
  nip: string | null;
  identityDocumentKind: IdentityDocumentKind;
  identityDocumentNumber: string | null;
  citizenship: string;
  phone: string;
}

export interface RegisteredAddressData {
  street: string;
  houseNumber: string;
  apartmentNumber: string | null;
  postalCode: string;
  city: string;
  voivodeship: string | null;
  county: string | null;
  municipality: string | null;
  postOffice: string | null;
  countryCode: string | null;
  legacyCountryName: string | null;
}

export interface CorrespondenceAddressData {
  sameAsRegistered: boolean;
  street: string | null;
  houseNumber: string | null;
  apartmentNumber: string | null;
  postalCode: string | null;
  city: string | null;
  countryCode: string | null;
  legacyCountryName: string | null;
}

export interface CatalogReference {
  kind: "catalog";
  code: string;
  name: string;
}

export interface LegacyReference {
  kind: "legacy";
  code: null;
  name: string;
}

export type InstitutionReference =
  | CatalogReference
  | LegacyReference
  | null;

export interface InstitutionsData {
  taxOffice: InstitutionReference;
  nfzBranch: InstitutionReference;
}

export interface InsuranceData {
  otherEmployment: YesNoAnswer;
  otherEmployerName: string | null;
  otherEmploymentAtLeastMinimumWage: YesNoAnswer;
  studentUnder26: YesNoAnswer;
  schoolOrUniversityName: string | null;
  otherMandateContract: YesNoAnswer;
  otherPrincipalName: string | null;
  otherMandateContractSocialInsurance: YesNoAnswer;
  subjectToCompulsorySocialInsurance: YesNoAnswer;
  voluntarySicknessInsurance: JoinDeclineAnswer;
  voluntarySicknessInsuranceJoinConfirmed: boolean | null;
  voluntaryPensionDisabilityInsurance: JoinDeclineAnswer;
  hasPensionOrDisabilityPensionRight: YesNoAnswer;
  disabilityDegree: DisabilityDegree;
  registeredAtEmploymentOffice: YesNoAnswer;
  employmentOfficeAddress: string | null;
}

export interface PaymentData {
  bankName: string;
  bankAccount: string;
}

export interface QuestionnairePayload {
  personal: PersonalData;
  registeredAddress: RegisteredAddressData;
  correspondenceAddress: CorrespondenceAddressData;
  institutions: InstitutionsData;
  insurance: InsuranceData;
  payment: PaymentData;
}

export type RedactedQuestionnairePayload = Omit<
  QuestionnairePayload,
  "personal" | "payment"
> & {
  personal: Omit<PersonalData, "pesel" | "identityDocumentNumber"> & {
    pesel: "";
    identityDocumentNumber: "";
  };
  payment: Omit<PaymentData, "bankAccount"> & { bankAccount: "" };
};

export interface SensitiveFieldMetadata {
  configured: boolean;
  masked: string | null;
}

export interface SensitiveMetadata {
  pesel: SensitiveFieldMetadata;
  identityDocumentNumber: SensitiveFieldMetadata;
  bankAccount: SensitiveFieldMetadata;
}

export interface SensitivePreservation {
  pesel: boolean;
  identityDocumentNumber: boolean;
  bankAccount: boolean;
}

export interface SensitiveLast4 {
  peselLast4: string | null;
  identityDocumentLast4: string | null;
  bankAccountLast4: string | null;
}

export interface FinalDeclarationAcceptance {
  statementKey: string;
  statementVersion: number;
  accepted: true;
}

export interface ParsedQuestionnairePutRequest {
  data: QuestionnairePayload;
  complete: boolean;
  expectedRevision: number | null;
  finalDeclaration: FinalDeclarationAcceptance | null;
  preserveSensitive: SensitivePreservation;
}

export interface QuestionnaireStatement {
  statementKey: string;
  statementVersion: number;
  statementText: string;
  statementSha256Base64: string;
}

export interface CurrentDeclaration extends QuestionnaireStatement {
  id: string;
  questionnaireRevision: number;
  actorUserId: string;
  source: "web";
  acceptedAt: string;
}

export interface QuestionnaireGetResponse {
  configured: boolean;
  revision: number | null;
  complete: boolean;
  validationPassed: boolean;
  completedAt: string | null;
  updatedAt: string | null;
  data: RedactedQuestionnairePayload | null;
  sensitive: SensitiveMetadata;
  statement: QuestionnaireStatement;
  currentDeclaration: CurrentDeclaration | null;
}

export interface QuestionnairePutResponse {
  saved: true;
  revision: number;
  complete: boolean;
  validationPassed: boolean;
  completedAt: string | null;
  updatedAt: string;
  sensitive: SensitiveMetadata;
  statement: QuestionnaireStatement;
  currentDeclaration: CurrentDeclaration | null;
}

interface AdminQuestionnaireView<TData> {
  userId: string;
  configured: boolean;
  revision: number | null;
  complete: boolean;
  validationPassed: boolean;
  completedAt: string | null;
  updatedAt: string | null;
  data: TData | null;
  sensitive: SensitiveMetadata;
  statement: QuestionnaireStatement;
  currentDeclaration: CurrentDeclaration | null;
}

interface AdminQuestionnaireResponseVariant<
  TScope extends AdminQuestionnaireScope,
  TData,
> {
  ok: true;
  action: "getQuestionnaire";
  scope: TScope;
  purpose: AdminQuestionnairePurpose;
  questionnaire: AdminQuestionnaireView<TData>;
}

export type AdminQuestionnaireResponse =
  | AdminQuestionnaireResponseVariant<
    "masked",
    RedactedQuestionnairePayload
  >
  | AdminQuestionnaireResponseVariant<"full", QuestionnairePayload>;

export interface QuestionnaireEnvelope {
  userId: string;
  ciphertextBase64: string;
  ivBase64: string;
  encryptionKeyVersion: number;
  payloadSchemaVersion: number;
  validationSchemaVersion: number;
  revision: number;
  isComplete: boolean;
  validationPassed: boolean;
  completedAt: string | null;
  validatedAt: string | null;
  updatedAt: string;
  currentDeclaration: CurrentDeclaration | null;
}

export interface SaveEnvelopeInput extends SensitiveLast4 {
  userId: string;
  expectedRevision: number | null;
  ciphertextBase64: string;
  ivBase64: string;
  peselHmacBase64: string | null;
  validationPassed: boolean;
  isComplete: boolean;
  finalDeclaration: FinalDeclarationAcceptance | null;
}

export interface SaveEnvelopeResult {
  userId: string;
  saved: true;
  revision: number;
  isComplete: boolean;
  validationPassed: boolean;
  completedAt: string | null;
  validatedAt: string | null;
  updatedAt: string;
  currentDeclaration: CurrentDeclaration | null;
}
