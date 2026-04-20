import { Signal } from '@angular/core';
import { IMenu } from '../../interfaces/i-menu';

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
  nextProfile: string;
  previousProfile: string;
  submit: string;
  ok: string;
  logout: string;
  yes: string;
  no: string;
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

export type CommonFormConsentTranslations = {
  label: string;
  required: string;
};

export type CommonLegalNoticeTranslations = {
  prefix: string;
  privacyPolicyLabel: string;
};
export type CommonFormFileUploadTranslations = {
  chooseImage: string;
  dropImage: string;
  imageFormats: string;
  imagePreviewAlt: string;
  cropTitle: string;
  cropConfirm: string;
  cropFrameAriaLabel: string;
  zoomLabel: string;
  cropProcessingLabel: string;
  cropPreviewLabel: string;
  cropPreviewLandscapeLabel: string;
  cropPreviewCircleLabel: string;
  cropPreviewSquareLabel: string;
  gmCropHint: string;
  sessionCropHint: string;
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

export type CommonQuestionsTranslations = {
  contact: string;
  sure: string;
};

export type CommonStatusPageTranslations = {
  seoTitle: string;
  seoDescription: string;
  badge: string;
  title: string;
  description: string;
  hint: string;
  imageAlt: string;
};

export type CommonStatusPagesTranslations = {
  notFound: CommonStatusPageTranslations;
  notAuthorized: CommonStatusPageTranslations;
};

export type SessionDialogI18n = {
  actions: Signal<CommonActionsTranslations>;
};

export type CommonNavMenuItem = IMenu & {
  label: string;
  children?: CommonNavMenuItem[];
};
