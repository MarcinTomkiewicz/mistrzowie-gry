import { Signal } from '@angular/core';
import { IMenu } from '../../interfaces/i-menu';

export type CommonCtaTranslations = {
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
  clear: string;
  next: string;
  previous: string;
  nextProfile: string;
  previousProfile: string;
  submit: string;
  ok: string;
  logout: string;
  publish: string;
  archive: string;
  select: string;
  saveDraft: string;
  addItem: string;
  addSection: string;
  preview: string;
  clearDay: string;
  moveItemUp: string;
  moveItemDown: string;
  removeItem: string;
};

export type CommonValuesTranslations = {
  yes: string;
  no: string;
  notProvided: string;
  notAvailable: string;
  notApplicable: string;
  active: string;
  published: string;
  archived: string;
};

export type CommonLabelsTranslations = {
  name: string;
  city: string;
  status: string;
  title: string;
  slug: string;
  price: string;
  description: string;
  date: string;
  comment: string;
  role: string;
  public: string;
  firstName: string;
  lastName: string;
  nickname: string;
  phoneNumber: string;
  street: string;
  postalCode: string;
  languages: string;
  facilitationStyles: string;
  totalHours: string;
  hourRanges: string;
  previousMonth: string;
  currentMonth: string;
  key: string;
  shortDescription: string;
  displayOrder: string;
  order: string;
  emailAddress: string;
  password: string;
  useNickname: string;
  age: string;
  publication: string;
  label: string;
  products: string;
  cards: string;
  table: string;
  duration: string;
  participants: string;
  facilitatorCount: string;
  tableCount: string;
  participantCount: string;
  event: string;
  forBeginners: string;
  amount: string;
  lead: string;
  sectionHeading: string;
  seo: string;
  seoTitle: string;
  seoDescription: string;
  publishedBy: string;
  publishedAt: string;
  gmProfile: string;
  rejectionReason: string;
  coworker: string;
  locality: string;
  pesel: string;
  basicInfo: string;
  additionalInfo: string;
  chaoticThursday: string;
  inBrief: string;
  brandName: string;
  contactDetails: string;
  rpgSystem: string;
  phone: string;
  email: string;
  from: string;
  to: string;
  fromLowercase: string;
  toLowercase: string;
  hours: string;
  item: string;
};

export type CommonTableTranslations = {
  actions: string;
};

export type CommonNavTranslations = {
  home: string;
  about: string;
  ourTeam: string;
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
  articles: string;
  blog: string;
  standardsAndLogistics: string;
  editProfile: string;
  coworkerRecords: string;
  eventSignup: string;
  gmSessions: string;
  contentManagement: string;
  eventsManagement: string;
  adminCoworkerRecords: string;
  usersManagement: string;
  sharedDocuments: string;
  privateDocuments: string;
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
  toggleTheme: string;
  selectTab: string;
};

export type CommonStatusTranslations = {
  loading: string;
  saving: string;
  sending: string;
  success: string;
  done: string;
  changesSaved: string;
};

export type CommonEmptyTranslations = {
  title: string;
  description: string;
  articles: string;
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
  articleLoadFailed: string;
  articlesLoadFailed: string;
  articleNotFound: string;
  eventsLoadFailed: string;
  concurrentModification: string;
  changesNotSaved: string;
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
