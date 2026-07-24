export type CoworkerShellTranslations = {
  title: string;
  subtitle: string;
};

export type CoworkerShellTabsTranslations = {
  questionnaire: string;
  privateDocuments: string;
  sharedDocuments: string;
};

export type QuestionnairePageTranslations = {
  title: string;
  subtitle: string;
};

export type QuestionnaireSectionsTranslations = {
  personalTitle: string;
  personalDescription: string;
  registeredAddressTitle: string;
  registeredAddressDescription: string;
  correspondenceAddressTitle: string;
  correspondenceAddressDescription: string;
  institutionsTitle: string;
  institutionsDescription: string;
  insuranceTitle: string;
  insuranceDescription: string;
  insuranceEmploymentTitle: string;
  insuranceEmploymentDescription: string;
  insuranceContractsTitle: string;
  insuranceContractsDescription: string;
  insuranceElectionsTitle: string;
  insuranceElectionsDescription: string;
  insuranceStatusTitle: string;
  insuranceStatusDescription: string;
  paymentTitle: string;
  paymentDescription: string;
  declarationTitle: string;
  declarationDescription: string;
};

export type QuestionnaireFieldsTranslations = {
  firstNameLabel: string;
  lastNameLabel: string;
  maidenNameLabel: string;
  middleNameLabel: string;
  birthDateLabel: string;
  birthPlaceLabel: string;
  identificationBasisLabel: string;
  peselLabel: string;
  nipLabel: string;
  identityDocumentKindLabel: string;
  identityDocumentNumberLabel: string;
  citizenshipLabel: string;
  phoneLabel: string;
  streetLabel: string;
  houseNumberLabel: string;
  apartmentNumberLabel: string;
  postalCodeLabel: string;
  cityLabel: string;
  voivodeshipLabel: string;
  countyLabel: string;
  municipalityLabel: string;
  postOfficeLabel: string;
  countryLabel: string;
  sameAsRegisteredLabel: string;
  taxOfficeLabel: string;
  nfzBranchLabel: string;
  otherEmploymentLabel: string;
  otherEmployerNameLabel: string;
  otherEmploymentAtLeastMinimumWageLabel: string;
  studentUnder26Label: string;
  schoolOrUniversityNameLabel: string;
  otherMandateContractLabel: string;
  otherPrincipalNameLabel: string;
  otherMandateContractSocialInsuranceLabel: string;
  subjectToCompulsorySocialInsuranceLabel: string;
  voluntarySicknessInsuranceLabel: string;
  voluntarySicknessInsuranceJoinConfirmedLabel: string;
  voluntaryPensionDisabilityInsuranceLabel: string;
  hasPensionOrDisabilityPensionRightLabel: string;
  disabilityDegreeLabel: string;
  registeredAtEmploymentOfficeLabel: string;
  employmentOfficeAddressLabel: string;
  bankNameLabel: string;
  bankAccountLabel: string;
  finalDeclarationAcceptedLabel: string;
};

export type QuestionnaireOptionsTranslations = {
  selectPlaceholder: string;
  yes: string;
  no: string;
  pesel: string;
  identityDocument: string;
  idCard: string;
  passport: string;
  otherDocument: string;
  join: string;
  decline: string;
  disabilityNone: string;
  disabilityLight: string;
  disabilityModerate: string;
  disabilitySevere: string;
};

export type QuestionnaireSensitiveTranslations = {
  protectedBadge: string;
  savedValueLabel: string;
  noSavedValue: string;
  preserveModeLabel: string;
  replaceModeLabel: string;
  replacementHint: string;
};

export type QuestionnaireActionsTranslations = {
  saveDraftLabel: string;
  completeLabel: string;
  reloadLabel: string;
};

export type QuestionnaireStatusTranslations = {
  savingDraft: string;
  completing: string;
  completeTitle: string;
  completeDescription: string;
  legacyCountryNotice: string;
  legacyInstitutionNotice: string;
  declarationAcceptedAtLabel: string;
};

export type QuestionnaireErrorsTranslations = {
  loadTitle: string;
  loadDescription: string;
  sessionTitle: string;
  sessionDescription: string;
  unauthorizedTitle: string;
  unauthorizedDescription: string;
  validationTitle: string;
  validationDescription: string;
  conflictTitle: string;
  concurrentModificationDescription: string;
  statementChangedDescription: string;
  peselConflictDescription: string;
  peselConflictField: string;
  finalDeclarationAccepted: string;
  fatalTitle: string;
  unexpectedDescription: string;
  codeLabel: string;
  statusLabel: string;
  fieldErrorsTitle: string;
};

export type QuestionnaireToastTranslations = {
  draftSavedSummary: string;
  draftSavedDetail: string;
  completeSummary: string;
  completeDetail: string;
};
