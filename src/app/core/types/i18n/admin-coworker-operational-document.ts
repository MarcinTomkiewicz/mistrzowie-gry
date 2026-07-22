import { AppRoleLabels } from '../app-role';
import {
  AdminOperationalCleanupStatus,
  AdminOperationalUploadSessionStatus,
} from '../admin-operational-upload';
import { AdminOperationalTargetKind } from '../admin-operational-version';
import {
  CoworkerOperationalAction,
  CoworkerOperationalActionMode,
  CoworkerOperationalDocumentStatus,
  CoworkerOperationalVersionStatus,
} from '../coworker-operational-document';
import { CoworkerMalwareScanStatus } from '../coworker-document';

export type AdminOperationalCopy = {
  page: {
    title: string;
    subtitle: string;
    editorCreateTitle: string;
    editorEditTitle: string;
    editorSubtitle: string;
    loadErrorTitle: string;
  };
  process: {
    title: string;
    shellTitle: string;
    shellDescription: string;
    versionsTitle: string;
    versionsDescription: string;
    nextStepsTitle: string;
    nextStepsDescription: string;
  };
  sections: {
    documentsTitle: string;
    documentsDescription: string;
    editorTitle: string;
    editorDescription: string;
    versionsTitle: string;
    versionsDescription: string;
    currentVersion: string;
    historicalVersions: string;
    versionDetails: string;
    file: string;
    targets: string;
    statements: string;
    assignmentSummary: string;
    versionEditorTitle: string;
    versionEditorDescription: string;
    versionMetadata: string;
    versionFile: string;
    uploadRecovery: string;
  };
  fields: {
    code: string;
    title: string;
    description: string;
    category: string;
    status: string;
    revision: string;
    currentVersion: string;
    unpublishedVersion: string;
    version: string;
    versionStatus: string;
    actionMode: string;
    requiresReacceptance: string;
    statementVersion: string;
    actionDueAt: string;
    fileName: string;
    storedFileName: string;
    fileExtension: string;
    mimeType: string;
    detectedMimeType: string;
    expectedSize: string;
    actualSize: string;
    malwareStatus: string;
    storageBucket: string;
    storagePath: string;
    totalAssignments: string;
    availableAssignments: string;
    pendingAssignments: string;
    acknowledgedAssignments: string;
    acceptedAssignments: string;
    declinedAssignments: string;
    publishedAt: string;
    updatedAt: string;
    versionTitle: string;
    summary: string;
    targetKind: string;
    targetValue: string;
    uploadSessionStatus: string;
    expiresAt: string;
    cleanupStatus: string;
  };
  actions: {
    createDocument: string;
    editDocument: string;
    viewDocument: string;
    backToList: string;
    reload: string;
    showExplanation: string;
    chooseFile: string;
    finalizeUpload: string;
    cancelReservation: string;
    configureVersion: string;
    addTarget: string;
    removeTarget: string;
  };
  tooltips: {
    pagePurpose: string;
    documents: string;
    documentCode: string;
    documentTitle: string;
    documentDescription: string;
    documentCategory: string;
    documentStatus: string;
    versions: string;
    actionMode: string;
    requiresReacceptance: string;
    targets: string;
    statements: string;
    assignmentSummary: string;
    versionEditor: string;
  };
  statuses: {
    documents: Record<CoworkerOperationalDocumentStatus, string>;
    versions: Record<CoworkerOperationalVersionStatus, string>;
    actionModes: Record<CoworkerOperationalActionMode, string>;
    targetKinds: Record<AdminOperationalTargetKind, string>;
    appRoles: AppRoleLabels;
    malware: Record<CoworkerMalwareScanStatus, string>;
    statementActions: Record<CoworkerOperationalAction, string>;
    uploadSessions: Record<AdminOperationalUploadSessionStatus, string>;
    cleanup: Record<AdminOperationalCleanupStatus, string>;
    versionActions: {
      reserving: string;
      uploading: string;
      finalizing: string;
      cancelling: string;
    };
    yes: string;
    no: string;
    notProvided: string;
  };
  messages: {
    emptyDocuments: string;
    emptyVersions: string;
    noCurrentVersion: string;
    noHistoricalVersions: string;
    noTargets: string;
    noStatements: string;
    storageUnavailable: string;
    savedSummary: string;
    created: string;
    updated: string;
    reloadAfterConflict: string;
    archivedReadOnly: string;
    targetRequired: string;
    statementsNotRequired: string;
    readyVersion: string;
    dropFile: string;
    uploadRecovery: string;
    uploadExpired: string;
    versionSavedSummary: string;
    uploadCompleted: string;
    reservationCancelled: string;
    configurationSaved: string;
    reservationCancelledCleanupFailed: string;
    cancelReservationConfirmation: string;
  };
  errors: {
    load: string;
    save: string;
    unauthorized: string;
    forbidden: string;
    notFound: string;
    conflict: string;
    invalidState: string;
    invalidResponse: string;
    codeLabel: string;
    statusLabel: string;
    reasonLabel: string;
    versionAction: string;
    reserve: string;
    upload: string;
    finalize: string;
    cancel: string;
    configure: string;
    uploadedFile: string;
    storage: string;
    cleanup: string;
    fileType: string;
    fileSize: string;
    storageConfiguration: string;
  };
  validation: {
    codePattern: string;
    duplicateTarget: string;
    inactiveCoworkerTarget: string;
  };
};

export type AdminOperationalTableCopy = Pick<
  AdminOperationalCopy,
  'fields' | 'actions' | 'tooltips' | 'statuses'
> & {
  contextHelpLabel(subject: string): string;
};
