export type CommonCtaTranslations = {
  contactUs: string;
  joinProgram: string;
  offerIndividual: string;
  offerBusiness: string;
  chaoticThursdays: string;
  checkDetails: string;
  seeProgram: string;
  learnMore: string;
  seeOffer: string;
  seePricing: string;
  bookSession: string;
  signUp: string;
  sendMessage: string;
  goBack: string;
  goHome: string;
  viewAll: string;
  viewLess: string;
  showMore: string;
  showLess: string;
};

export type CommonActionsTranslations = {
  close: string;
  cancel: string;
  confirm: string;
  save: string;
  edit: string;
  delete: string;
  copy: string;
  refresh: string;
  retry: string;
  add: string;
  remove: string;
  clear: string;
  next: string;
  previous: string;
  submit: string;
  ok: string;
  logout: string;
};

export type CommonNavTranslations = {
  home: string;
  about: string;
  offer: string;
  individualOffer: string;
  businessOffer: string;
  institutionOffer: string;
  eventOffer: string;
  programs: string;
  join: string;
  chaoticThursdays: string;
  contact: string;
  faq: string;
  pricing: string;
  blog: string;
  standardsAndLogistics: string;
};

export type CommonSocialTranslations = {
  facebook: string;
  instagram: string;
  discord: string;
};

export type CommonLegalTranslations = {
  privacyPolicy: string;
  terms: string;
  cookies: string;
};

export type CommonAccessibilityTranslations = {
  openMenu: string;
  closeMenu: string;
  skipToContent: string;
  sendMail: string;
  callMe: string;
};

export type CommonFooterTranslations = {
  brandAlt: string;
  description: string;
  socialAriaLabel: string;
  shortcutTitle: string;
  contactTitle: string;
  legalAriaLabel: string;
  copyrightSuffix: string;
  phoneLabel: string;
  phoneValue: string;
  phoneHref: string;
  emailLabel: string;
  emailValue: string;
  emailHref: string;
};

export type CommonStatusTranslations = {
  loading: string;
  saving: string;
  sending: string;
  success: string;
  done: string;
};

export type CommonEmptyTranslations = {
  title: string;
  description: string;
};

export type CommonInfoTranslations = {
  outOfOrder: string;
};

export type CommonErrorsTranslations = {
  generic: string;
  network: string;
  notFound: string;
  forbidden: string;
  unauthorized: string;
  timeout: string;
  server: string;
};

export type CommonSeoTranslations = {
  defaultTitle: string;
  defaultDescription: string;
};

export type CommonFootnotesTranslations = {
  net: string;
  gross: string;
  both: string;
};

export type CommonFormConsentTranslations = {
  label: string;
  required: string;
};

export type CommonFormFileUploadTranslations = {
  chooseImage: string;
  dropImage: string;
  imageFormats: string;
  imagePreviewAlt: string;
};

export type CommonFormTranslations = {
  required: string;
  invalidEmail: string;
  minLength: string;
  maxLength: string;
  invalid: string;
  invalidSummary: string;
  consent: CommonFormConsentTranslations;
  fileUpload: CommonFormFileUploadTranslations;
};

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
  playersHeaderLabel: string;
  minAgeHeaderLabel: string;
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

export interface SessionFormTranslations {
  titleLabel: string;
  systemLabel: string;
  descriptionLabel: string;
  difficultyLabel: string;
  minPlayersLabel: string;
  maxPlayersLabel: string;
  minAgeLabel: string;
  sortOrderLabel: string;
  stylesLabel: string;
  triggersLabel: string;
  playersRangeLabel: string;
  minAgeRangeLabel: string;
  sortOrderRangeLabel: string;
}

export interface SessionDifficultyTranslations {
  beginner: string;
  intermediate: string;
  advanced: string;
}

export interface SessionErrorsTranslations {
  invalidPlayersRange: string;
}

export interface OurTeamPageTranslations {
  title: string;
  subtitle: string;
}

export interface OurTeamSeoTranslations {
  title: string;
  description: string;
}

export interface OurTeamCardTranslations {
  imageAltPrefix: string;
}

export interface OurTeamPageTranslations {
  title: string;
  subtitle: string;
}

export interface OurTeamSeoTranslations {
  title: string;
  description: string;
}

export interface OurTeamCardTranslations {
  imageAltPrefix: string;
}

export interface OurTeamDialogTranslations {
  profileTabLabel: string;
  sessionsTabLabel: string;
  experienceLabel: string;
  quoteLabel: string;
  descriptionLabel: string;
  systemsLabel: string;
  stylesLabel: string;
  languagesLabel: string;
  yearsSuffix: string;
  noData: string;
}