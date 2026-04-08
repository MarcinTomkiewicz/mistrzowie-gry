export interface LoginFormTitleTranslations {
  main: string;
}

export interface LoginFormTranslations {
  emailLabel: string;
  passwordLabel: string;
}

export interface LoginFormActionsTranslations {
  submitLabel: string;
}

export interface LoginFormErrorsTranslations {
  invalidCredentials: string;
}

export interface ProfileFormTitleTranslations {
  register: string;
  edit: string;
}

export interface ProfileFormTranslations {
  emailLabel: string;
  passwordLabel: string;
  firstNameLabel: string;
  nicknameLabel: string;
  useNicknameLabel: string;
  phoneNumberLabel: string;
  cityLabel: string;
  streetLabel: string;
  houseNumberLabel: string;
  apartmentNumberLabel: string;
  postalCodeLabel: string;
  ageLabel: string;
  shortDescriptionLabel: string;
  longDescriptionLabel: string;
  extendedDescriptionLabel: string;
}

export interface ProfileFormErrorsTranslations {
  displayNameRequired: string;
  displayPreference: string;
  emailAlreadyRegistered: string;
  emailNotConfirmed: string;
  weakPassword: string;
  profileNotFound: string;
  invalidCredentials: string;
}

export interface ProfileFormToastTranslations {
  invalidFormSummary: string;
  registerFailedSummary: string;
  registerSuccessSummary: string;
  updateFailedSummary: string;
  updateSuccessSummary: string;
  confirmationRequiredSummary: string;
}

export interface ProfileFormSuccessTranslations {
  registered: string;
  confirmationRequired: string;
  updated: string;
}

export interface ProfileFormActionsTranslations {
  registerLabel: string;
  updateLabel: string;
}

export interface RegisterSeoTranslations {
  title: string;
  description: string;
}

export interface RegisterRootTranslations {
  seoTitle: string;
  seoDescription: string;
  hero: RegisterHeroTranslations;
}

export interface RegisterHeroTranslations {
  title: string;
  subtitle: string;
}

export interface EditProfileSeoTranslations {
  title: string;
  description: string;
}

export interface EditProfileHeroTranslations {
  title: string;
  subtitle: string;
}

export interface EditProfileTabsTranslations {
  profile: string;
  gmProfile: string;
  gmSessions: string;
  gmAvailability: string;
}

export interface GmProfileFormTranslations {
  displayNameLabel: string;
  experienceLabel: string;
  experienceRangeLabel: string;
  descriptionLabel: string;
  quoteLabel: string;
  stylesLabel: string;
  languagesLabel: string;
}

export interface GmProfileErrorsTranslations {
  invalidStyleCount: string;
}

export interface GmProfileActionsTranslations {
  saveLabel: string;
}

export interface GmProfileToastTranslations {
  invalidFormDetail: string;
  saveSuccessSummary: string;
  saveSuccessDetail: string;
  saveFailedSummary: string;
  saveFailedDetail: string;
  loadFailedSummary: string;
  loadFailedDetail: string;
}

export interface GmProfileTranslations {
  title: string;
}

export interface GmSessionsTranslations {
  title: string;
  subtitle: string;
}

export interface GmSessionsActionsTranslations {
  addLabel: string;
  createLabel: string;
  updateLabel: string;
}

export interface GmSessionsFormTranslations {
  systemFilterAllLabel: string;
  systemFilterLabel: string;
}

export interface GmSessionsEmptyTranslations {
  title: string;
  description: string;
}

export interface GmSessionsToastTranslations {
  loadFailedSummary: string;
  loadFailedDetail: string;
  saveSuccessSummary: string;
  saveSuccessDetail: string;
  saveFailedSummary: string;
  saveFailedDetail: string;
  deleteSuccessSummary: string;
  deleteSuccessDetail: string;
  deleteFailedSummary: string;
  deleteFailedDetail: string;
}

export interface GmAvailabilityTranslations {
  title: string;
  subtitle: string;
  editorTitle: string;
  hint: string;
}

export interface GmAvailabilityActionsTranslations {
  addRangeLabel: string;
  removeRangeLabel: string;
  clearDayLabel: string;
  previousDayLabel: string;
  nextDayLabel: string;
  saveLabel: string;
}

export interface GmAvailabilityFormTranslations {
  fromLabel: string;
  toLabel: string;
  rangeSummaryLabel: string;
  emptyTitle: string;
  emptyDescription: string;
}

export interface GmAvailabilityDialogTranslations {
  invalidDurationTitle: string;
  invalidDurationBody: string;
  overlapTitle: string;
  overlapBody: string;
  noSpaceTitle: string;
  noSpaceBody: string;
}

export interface GmAvailabilityToastTranslations {
  loadFailedSummary: string;
  loadFailedDetail: string;
  saveSuccessSummary: string;
  saveSuccessDetail: string;
  saveFailedSummary: string;
  saveFailedDetail: string;
}

export interface GmAvailabilityOverviewTranslations {
  title: string;
  subtitle: string;
  selectLabel: string;
  selectPlaceholder: string;
  dayDetailsTitle: string;
  filteredHint: string;
  aggregateHint: string;
  emptyDayTitle: string;
  emptyDayDescription: string;
  emptyStateTitle: string;
  emptyStateDescription: string;
}

export interface GmAvailabilityOverviewToastTranslations {
  loadFailedSummary: string;
  loadFailedDetail: string;
}

export interface MyWorkLogTranslations {
  title: string;
  subtitle: string;
  monthHint: string;
  totalHoursLabel: string;
  lockedPreviousMonthTitle: string;
  lockedPreviousMonthDescription: string;
}

export interface MyWorkLogActionsTranslations {
  previousMonthLabel: string;
  currentMonthLabel: string;
  addRangeLabel: string;
  clearDayLabel: string;
  resetChangesLabel: string;
}

export interface MyWorkLogFormTranslations {
  dateLabel: string;
  rangesLabel: string;
  commentLabel: string;
  chaoticThursdayLabel: string;
  chaoticThursdayTooltip: string;
  totalHoursLabel: string;
  toLabel: string;
  emptyDayDescription: string;
}

export interface MyWorkLogDialogTranslations {
  invalidDurationTitle: string;
  invalidDurationBody: string;
  overlapTitle: string;
  overlapBody: string;
  noSpaceTitle: string;
  noSpaceBody: string;
}

export interface MyWorkLogToastTranslations {
  loadFailedSummary: string;
  loadFailedDetail: string;
  saveSuccessSummary: string;
  saveSuccessDetail: string;
  saveFailedSummary: string;
  saveFailedDetail: string;
}

export interface WorkLogOverviewTranslations {
  title: string;
  subtitle: string;
  totalHoursLabel: string;
  emptyStateTitle: string;
  emptyStateDescription: string;
  emptyUserTitle: string;
  emptyUserDescription: string;
}

export interface WorkLogOverviewActionsTranslations {
  previousMonthLabel: string;
  currentMonthLabel: string;
  exportCsvLabel: string;
  exportXlsLabel: string;
}

export interface WorkLogOverviewFormTranslations {
  dateLabel: string;
  rangesLabel: string;
  commentLabel: string;
  chaoticThursdayLabel: string;
  chaoticThursdayYes: string;
  chaoticThursdayNo: string;
  totalHoursLabel: string;
}

export interface WorkLogOverviewToastTranslations {
  loadFailedSummary: string;
  loadFailedDetail: string;
}

export interface CoworkerProfileTranslations {
  title: string;
  subtitle: string;
  officialSectionTitle: string;
  officialSectionDescription: string;
  protectedSectionTitle: string;
  protectedSectionBadge: string;
  protectedSectionDescription: string;
  securityNotice: string;
}

export interface CoworkerProfileFormTranslations {
  firstNameLabel: string;
  lastNameLabel: string;
  peselLabel: string;
  bankAccountLabel: string;
  streetLabel: string;
  houseNumberLabel: string;
  apartmentNumberLabel: string;
  postalCodeLabel: string;
  cityLabel: string;
}

export interface CoworkerProfileActionsTranslations {
  saveLabel: string;
}

export interface CoworkerProfileToastTranslations {
  loadFailedSummary: string;
  loadFailedDetail: string;
  saveSuccessSummary: string;
  saveSuccessDetail: string;
  saveFailedSummary: string;
  saveFailedDetail: string;
}

export type EventSignupFormTranslations = {
  modeLabel: string;
};

export type EventSignupFormActionsTranslations = {
  submitLabel: string;
  withdrawLabel: string;
  backToSelectionLabel: string;
  resetLabel: string;
  selectLabel: string;
};

export type EventSignupFormStatesTranslations = {
  notFoundTitle: string;
  notFoundDescription: string;
  fullTitle: string;
  fullDescription: string;
};

export type EventSignupFormModeTranslations = {
  templateLabel: string;
  customLabel: string;
};

export type EventSignupFormTemplateTranslations = {
  emptyTitle: string;
  emptyDescription: string;
};

export type EventSignupFormCustomTranslations = {
  previousSessionsLabel: string;
};

export type EventSignupFormSectionsTranslations = {
  pageTitlePrefix: string;
  pageSubtitle: string;
  submittedSessionTitle: string;
};

export type EventSignupFormToastTranslations = {
  loadFailedSummary: string;
  loadFailedDetail: string;
  saveSuccessSummary: string;
  saveSuccessDetail: string;
  saveFailedSummary: string;
  saveFailedDetail: string;
  withdrawSuccessSummary: string;
  withdrawSuccessDetail: string;
  withdrawFailedSummary: string;
  withdrawFailedDetail: string;
};

export type EventSignupFormBreadcrumbTranslations = {
  eventSignupLabel: string;
};

export type EventSignupFormNavigationTranslations = {
  previousLabel: string;
  nextLabel: string;
};

export type EventSignupFormConfirmationTranslations = {
  withdrawMessage: string;
};

export type EventSignupSeoTranslations = {
  title: string;
  description: string;
};

export type EventSignupPageTranslations = {
  title: string;
  subtitle: string;
};

export type EventSignupDetailsTranslations = {
  timeLabel: string;
  beginnersLabel: string;
  beginnersYes: string;
  beginnersNo: string;
};

export type EventSignupOccurrencesTranslations = {
  title: string;
  subtitle: string;
};

export type EventSignupEmptyTranslations = {
  title: string;
  description: string;
};

export type EventSignupFormSeoTranslations = {
  title: string;
  description: string;
};

export interface UserMenuTranslations {
  greeting: string;
  accountSectionTitle: string;
  gmZoneSectionTitle: string;
  administrationSectionTitle: string;
  editProfileLabel: string;
  eventSignupLabel: string;
  coworkerProfileLabel: string;
  myWorkLogLabel: string;
  gmAvailabilityOverviewLabel: string;
  workLogOverviewLabel: string;
}
