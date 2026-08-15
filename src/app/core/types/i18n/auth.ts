export interface LoginFormTitleTranslations {
  main: string;
}

export interface LoginFormActionsTranslations {
  submitLabel: string;
}

export interface LoginFormErrorsTranslations {
  invalidCredentials: string;
}

export interface ProfileFormTitleTranslations {
  register: string;
}

export interface ProfileFormTranslations {
  houseNumberLabel: string;
  apartmentNumberLabel: string;
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

export interface RegisterRootTranslations {
  seoDescription: string;
  hero: RegisterHeroTranslations;
}

export interface RegisterHeroTranslations {
  subtitle: string;
}

export interface EditProfileSeoTranslations {
  description: string;
}

export interface EditProfileHeroTranslations {
  subtitle: string;
}

export interface EditProfileTabsTranslations {
  profile: string;
  gmProfile: string;
  gmAvailability: string;
}

export interface GmProfileFormTranslations {
  displayNameLabel: string;
  experienceLabel: string;
  experienceRangeLabel: string;
  quoteLabel: string;
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

export interface GmSessionsTranslations {
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
  previousDayLabel: string;
  nextDayLabel: string;
  saveLabel: string;
}

export interface GmAvailabilityFormTranslations {
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
  lockedPreviousMonthTitle: string;
  lockedPreviousMonthDescription: string;
}

export interface MyWorkLogActionsTranslations {
  addRangeLabel: string;
  resetChangesLabel: string;
}

export interface MyWorkLogFormTranslations {
  chaoticThursdayTooltip: string;
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
  emptyStateTitle: string;
  emptyStateDescription: string;
  emptyUserTitle: string;
  emptyUserDescription: string;
}

export interface WorkLogOverviewActionsTranslations {
  exportCsvLabel: string;
  exportXlsLabel: string;
}

export interface WorkLogOverviewToastTranslations {
  loadFailedSummary: string;
  loadFailedDetail: string;
}

export interface UserMenuTranslations {
  greeting: string;
  accountSectionTitle: string;
  coworkerSectionTitle: string;
  gmZoneSectionTitle: string;
  administrationSectionTitle: string;
  myWorkLogLabel: string;
  gmAvailabilityOverviewLabel: string;
  workLogOverviewLabel: string;
  adminOffersLabel: string;
}
