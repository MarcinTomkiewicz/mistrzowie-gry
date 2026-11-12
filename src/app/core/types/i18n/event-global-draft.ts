import type { AdminDatedTimeBlocks, AdminGlobalCalendarResult, AdminGlobalEventCityBlocker } from '../../interfaces/i-admin-global-event';
import type { AdminGlobalEventPageBlocker, AdminGlobalEventPageFieldError, AdminGlobalEventPagePreview } from '../../interfaces/i-admin-global-event-preview';
import type { AdminGlobalPublicationBlocker, AdminGlobalScopePublicationBlocker } from '../../interfaces/i-admin-global-event-publication';
import type { ParticipantSignupKind } from '../../enums/event';

export type EventGlobalSaveCopy = Record<'title' | 'action' | 'confirmQuestion' | 'confirm' | 'completed' | 'failed' | 'uncertain' |
  'retryRead' | 'localChanges' | 'saved' | 'discardConfirmQuestion' | 'discardConfirm' | 'checked' | 'checkChanges', string> & {
    dates: Record<'saved' | 'added' | 'retained' | 'removed' | 'outside' | 'protected' |
      'savedState' | 'newDateHint' | 'previewNeeded' | 'previewHint', string>;
  };

export type EventGlobalPublicationCopy = Record<
  'hint' | 'confirmQuestion' | 'confirm' | 'blocked' | 'uncertain' | 'readbackFailed' | 'verified' | 'alreadyReleased' |
  'affectedCities' | 'publishableOccurrences' | 'preservedPastDrafts' | 'policyDraft' | 'block', string
> & {
  blockers: Record<AdminGlobalPublicationBlocker['code'], string>;
  scope: Record<'title' | 'hint' | 'dates' | 'preview' | 'confirmQuestion' | 'confirm' | 'alreadyPublishedOccurrences' | 'legacyCapacityUpgrades' |
    'excludedSelections' | 'activateEditions' | 'selectionRequired' | 'ready' | 'revision' | 'publishedOccurrences' | 'activatedEditions' |
    'endReadback' | 'endReadbackQuestion' | 'endReadbackWarning' | 'readbackEnded', string> & {
      blockers: Record<AdminGlobalScopePublicationBlocker['code'], string>;
    };
};

export type EventMetadataCopy = {
  readOnly: string;
  operationBlocked: string;
  protected: string;
  conflict: string;
  uncertain: string;
  readbackFailed: string;
  reloadConfirm: string;
};

export type EventGlobalSavedSummaryCopy = {
  readFailed: string;
  calendarDraft: string;
  policyDraft: string;
  program: string;
  countsHint: string;
  pending: string;
  confirmed: string;
  unknown: string;
  noOccurrence: string;
  participation: Record<'included' | 'excluded' | 'unspecified' | 'unlinked' | 'missing', string>;
  calendarStatuses: Record<AdminGlobalCalendarResult['globalDates'][number]['status'], string>;
};

export type EventGlobalPagePreviewCopy = Record<'title' | 'hint' | 'failed' | 'unavailable', string>;

export type EventGlobalPriceCopy = {
  title: string;
  hint: string;
  amountHint: string;
  amountInvalid: string;
  basisRequired: string;
};

export type EventGlobalPolicyCopy = {
  title: string;
  rulesTitle: string;
  hint: string;
  compatibilityHint: string;
  capacityConflict: string;
  capacityInvalid: string;
  cityOverrides: string;
  overrideHint: string;
  signupOverride: string;
  sessionOverride: string;
  wholeOverride: string;
  protected: string;
  denied: string;
  otherOperation: string;
  unapplied: string;
  preview: string;
  previewReady: string;
  invalid: string;
  blocked: string;
  save: string;
  saveConfirm: string;
  saved: string;
  conflict: string;
  baselineChanged: string;
  readbackPending: string;
  refresh: string;
  discard: string;
  discardConfirm: string;
  leaveQuestion: string;
  leave: string;
};

export type EventGlobalBaseTimeBlocksCopy = {
  title: string;
  hint: string;
  otherOperation: string;
  preview: string;
  previewReady: string;
  save: string;
  saveConfirm: string;
  saved: string;
  unchanged: string;
  blocked: string;
  invalid: string;
  conflict: string;
  readbackPending: string;
  refresh: string;
  discard: string;
  discardConfirm: string;
  leaveQuestion: string;
  leave: string;
  gmRange: string;
  duration: string;
  preservedDateOverrides: string;
  preservedCityOverrides: string;
};

export type EventGlobalScheduleCopy = {
  blockers: Record<'protected' | 'active' | 'pendingDraft' | 'otherOperation', string>;
  staffingSource: string;
  staffingAction: string;
  hint: string;
  otherOperation: string;
  protected: string;
  offScope: string;
  historical: string;
  conflict: string;
  uncertain: string;
  readback: string;
  invalid: string;
  blocked: string;
  preview: string;
  saveDraft: string;
  draftSaved: string;
  apply: string;
  applyConfirm: string;
  applied: string;
  refresh: string;
  discard: string;
  discardConfirm: string;
  leaveQuestion: string;
  leave: string;
  added: string;
  retired: string;
  preserved: string;
  cities: string;
  exclusions: string;
};

export type EventGlobalDiagnosticsCopy = {
  action: string;
  title: string;
  checking: string;
  failed: string;
  savedDataOnly: string;
  readOnly: string;
  errorFields: Record<'code' | 'message' | 'details' | 'hint', string>;
  blockers: string;
  goToSection: string;
  fields: Record<AdminGlobalEventPageFieldError['field'], string>;
  statuses: Record<AdminGlobalEventPagePreview['status'], string>;
  messages: Record<AdminGlobalEventPageFieldError['code'] | AdminGlobalEventPageBlocker['code'], string>;
};

export type EventGlobalCityCopy = {
  blockers: Record<AdminGlobalEventCityBlocker | 'editing' | 'saving' | 'uncertain' | 'readback' | 'metadata' | 'schedule' | 'policy', string>;
  action: string;
  hint: string;
  uncertain: string;
  readbackFailed: string;
  saved: string;
  leaveConfirmationQuestion: string;
  leaveConfirmation: string;
  discard: string;
};

export type EventDatedBlocksCopy = {
  title: string;
  creationHint: string;
  recurrenceHint: string;
  dateInvalid: string;
  dateScope: string;
  mainCityScope: string;
  configure: string;
  restoreInheritance: string;
  fromDate: string;
  fromCore: string;
  cityOverride: string;
  sources: Record<AdminDatedTimeBlocks['source'], string>;
  blockRange: string;
  draftOnly: string;
  editTitle: string;
  scope: string;
  preview: string;
  previewReady: string;
  save: string;
  discard: string;
  discardPrompt: string;
  selectHint: string;
  readbackFailed: string;
  conflict: string;
  previewChanges: string;
  unchangedDates: string;
  noDates: string;
  current: string;
};

export type EventGlobalDraftCopy = {
  steps: Record<'event' | 'location' | 'schedule' | 'policy' | 'program' | 'summary', string>;
  programAfterSave: string;
  savedData: string;
  leaveConfirmationQuestion: string;
  leaveConfirmation: string;
  discardDraft: string;
  help: string;
  signupKindHint: string;
  signupKindDescriptions: Record<ParticipantSignupKind, string>;
  signupRequiredHint: string;
  mainCity: string;
  venueName: string;
  timezoneHint: string;
  facebookLink: string;
  facebookInvalid: string;
  schedule: string;
  dateInvalid: string;
  blocks: string;
  blocksHint: string;
  addBlock: string;
  blockLabel: string;
  requiredGmCount: string;
  requiredGmHint: string;
  timeInvalid: string;
  setTime: string;
  audience: string;
  registration: string;
  priceHint: string;
  sessionCapacityCeiling: string;
  wholeEventCapacity: string;
  sessionCapacityHint: string;
  wholeEventCapacityHint: string;
  uncertain: string;
  created: string;
  retryCreation: string;
  retryRead: string;
  readbackFailed: string;
  effectivePolicy: string;
  noAdditionalLimit: string;
  appliedToPublicEvent: string;
  appliedToRegistration: string;
};
