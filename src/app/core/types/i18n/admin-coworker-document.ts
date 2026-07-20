import {
  CoworkerActiveOnboardingStatus,
  CoworkerDocumentMultiplicity,
  CoworkerDocumentOriginPolicy,
} from '../coworker-document';

export type AdminCoworkerDocPageCopy = {
  title: string;
  subtitle: string;
  reviewQueueLabel: string;
  loadErrorTitle: string;
};

export type AdminCoworkerDocSectionCopy = {
  definitionsTitle: string;
  definitionsSubtitle: string;
  coworkerTitle: string;
  coworkerSubtitle: string;
  onboardingTitle: string;
  onboardingEmpty: string;
  requirementTitle: string;
  requirementSubtitle: string;
};

export type AdminCoworkerDocFieldCopy = {
  code: string;
  title: string;
  description: string;
  category: string;
  originPolicy: string;
  multiplicity: string;
  defaultRequired: string;
  signaturePolicy: string;
  allowedMimeTypes: string;
  allowedExtensions: string;
  maxSizeBytes: string;
  retentionDays: string;
  active: string;
  activeFrom: string;
  activeUntil: string;
  coworker: string;
  documentDefinition: string;
  required: string;
  dueAt: string;
};

export type AdminCoworkerDocActionCopy = {
  newDefinition: string;
  ensureOnboarding: string;
  seedDefaults: string;
  assignRequirement: string;
  addMimeType: string;
  addExtension: string;
};

export type AdminCoworkerDocStatusCopy = {
  active: string;
  inactive: string;
  accessEnabled: string;
  accessDisabled: string;
  onboardingCreated: string;
  onboardingExisting: string;
  onboardingStatuses: Record<CoworkerActiveOnboardingStatus, string>;
};

export type AdminCoworkerDocOptionCopy = {
  originPolicies: Record<CoworkerDocumentOriginPolicy, string>;
  multiplicities: Record<CoworkerDocumentMultiplicity, string>;
};

export type AdminCoworkerDocMessageCopy = {
  seedConfirmation: string;
  definitionSaved: string;
  onboardingEnsured: string;
  defaultsSeeded: string;
  requirementsInserted: string;
  requirementAssigned: string;
  actionSuccessSummary: string;
};

export type AdminCoworkerDocErrorCopy = {
  load: string;
  unauthorized: string;
  forbidden: string;
  notFound: string;
  conflict: string;
  documentConflict: string;
  invalidResponse: string;
  unexpected: string;
  saveDefinition: string;
  ensureOnboarding: string;
  seedDefaults: string;
  assignRequirement: string;
  diagnosticStatus: string;
  diagnosticCode: string;
  diagnosticMessage: string;
};
