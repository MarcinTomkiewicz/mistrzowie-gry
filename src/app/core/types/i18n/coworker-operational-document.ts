import {
  CoworkerOperationalAction,
  CoworkerOperationalActionMode,
  CoworkerOperationalActionSource,
  CoworkerOperationalAssignmentSource,
  CoworkerOperationalAssignmentStatus,
  CoworkerOperationalDocumentStatus,
  CoworkerOperationalVersionStatus,
} from '../coworker-operational-document';
import { CoworkerNotificationCopy } from './coworker-notification';

export type CoworkerOperationalCopy = {
  page: {
    title: string;
    subtitle: string;
  };
  process: {
    title: string;
    description: string;
    readTitle: string;
    readDescription: string;
    downloadTitle: string;
    downloadDescription: string;
    decisionTitle: string;
    decisionDescription: string;
    evidenceTitle: string;
    evidenceDescription: string;
  };
  sections: {
    currentTitle: string;
    currentDescription: string;
    currentEmpty: string;
    historyTitle: string;
    historyDescription: string;
    historyEmpty: string;
    documentDetails: string;
    file: string;
    evidence: string;
    inherited: string;
  };
  fields: {
    assignmentStatus: string;
    assignmentActionMode: string;
    versionActionMode: string;
    documentStatus: string;
    versionStatus: string;
    category: string;
    assignedAt: string;
    dueAt: string;
    version: string;
    fileName: string;
    mimeType: string;
    fileSize: string;
    assignmentSource: string;
    currentAction: string;
    actionAt: string;
    actionSource: string;
    exactStatement: string;
    declineReason: string;
    waivedAt: string;
    waiverReason: string;
    inheritedVersion: string;
    requiresReacceptance: string;
    currentVersion: string;
    historicalVersion: string;
  };
  actions: {
    download: string;
    acknowledged: string;
    accepted: string;
    declined: string;
    close: string;
    reload: string;
    showExplanation: string;
  };
  tooltips: {
    currentAssignments: string;
    historicalAssignments: string;
    assignmentStatus: string;
    actionMode: string;
    dueAt: string;
    download: string;
    acknowledged: string;
    accepted: string;
    declined: string;
    evidence: string;
    inherited: string;
    exactStatement: string;
    declineReason: string;
  };
  statuses: {
    assignments: Record<CoworkerOperationalAssignmentStatus, string>;
    actionModes: Record<CoworkerOperationalActionMode, string>;
    assignmentSources: Record<CoworkerOperationalAssignmentSource, string>;
    documents: Record<CoworkerOperationalDocumentStatus, string>;
    versions: Record<CoworkerOperationalVersionStatus, string>;
    actions: Record<CoworkerOperationalAction, string>;
    actionSources: Record<CoworkerOperationalActionSource, string>;
    yes: string;
    no: string;
    notProvided: string;
  };
  messages: {
    informationOnly: string;
    noAction: string;
    historicalNoAction: string;
    inheritedDescription: string;
    actionSuccessSummary: string;
    acknowledgedSuccess: string;
    acceptedSuccess: string;
    declinedSuccess: string;
  };
  dialog: {
    description: string;
    titles: Record<CoworkerOperationalAction, string>;
    consequences: Record<CoworkerOperationalAction, string>;
    declineReasonRequired: string;
    statementMissing: string;
  };
  errors: {
    loadTitle: string;
    loadDescription: string;
    sessionTitle: string;
    sessionDescription: string;
    unauthorizedTitle: string;
    unauthorizedDescription: string;
    actionTitle: string;
    actionDescription: string;
    conflictDescription: string;
    notFoundDescription: string;
    stateInvalidDescription: string;
    downloadTitle: string;
    downloadDescription: string;
    storageDescription: string;
    invalidDownloadResponse: string;
    notificationTitle: string;
    notificationDescription: string;
    unexpectedDescription: string;
    codeLabel: string;
    statusLabel: string;
  };
  notifications: CoworkerNotificationCopy;
};
