import {
  AdminCoworkerReviewDecision,
  AdminSignatureVerificationStatus,
} from '../admin-coworker-document';
import {
  CoworkerAutomaticVerificationMode,
  CoworkerDocumentOrigin,
  CoworkerDocumentRequirementStatus,
  CoworkerDocumentStatus,
  CoworkerDocumentVersionStatus,
  CoworkerMalwareScanStatus,
  CoworkerSignatureDeclarationType,
  CoworkerSignatureVerificationMethod,
  CoworkerSignatureVerificationStatus,
  CoworkerVerifiedSignatureType,
} from '../coworker-document';

export type AdminCoworkerDocReviewCopy = {
  page: {
    title: string;
    subtitle: string;
  };
  process: {
    title: string;
    start: string;
    inspect: string;
    signature: string;
    decision: string;
  };
  sections: {
    queueTitle: string;
    queueSubtitle: string;
    queueEmpty: string;
    summary: string;
    versions: string;
    submittedVersionEmpty: string;
    versionHistory: string;
    signatureVerification: string;
    signatureHistory: string;
    signatureHistoryEmpty: string;
    decision: string;
    decisionHistory: string;
    decisionHistoryEmpty: string;
  };
  fields: {
    coworker: string;
    email: string;
    appRole: string;
    documentDefinition: string;
    documentTitle: string;
    category: string;
    origin: string;
    documentStatus: string;
    requirementStatus: string;
    required: string;
    dueAt: string;
    versionNumber: string;
    documentVersion: string;
    submittedVersionId: string;
    versionStatus: string;
    sizeBytes: string;
    declaredMimeType: string;
    detectedMimeType: string;
    signatureDeclaration: string;
    malwareScan: string;
    latestSignatureVerification: string;
    verificationStatus: string;
    verificationReason: string;
    verificationType: string;
    verificationMethod: string;
    provider: string;
    providerReference: string;
    actorUserId: string;
    reviewedBy: string;
    reviewedAt: string;
    signatureVerificationId: string;
    note: string;
    rejectionReason: string;
    submittedAt: string;
    reviewStartedAt: string;
    signatureRequired: string;
    allowedSignatureTypes: string;
    manualSignatureReview: string;
    automaticVerificationMode: string;
    actions: string;
  };
  actions: {
    backToDocuments: string;
    openReview: string;
    startReview: string;
    download: string;
    verifySignature: string;
    acceptDocument: string;
    rejectDocument: string;
  };
  tooltips: {
    queue: string;
    queueStatus: string;
    summary: string;
    documentStatus: string;
    requirementStatus: string;
    versionStatus: string;
    signatureDeclaration: string;
    malwareScan: string;
    latestSignatureVerification: string;
    automaticVerificationMode: string;
    versions: string;
    download: string;
    signatureVerification: string;
    verificationStatus: string;
    verificationReason: string;
    startReview: string;
    decision: string;
    decisionNote: string;
    rejectionReason: string;
    acceptDocument: string;
    rejectDocument: string;
    signatureHistory: string;
    decisionHistory: string;
  };
  options: {
    selectVerificationStatus: string;
    signatureVerificationStatuses: Record<
      AdminSignatureVerificationStatus,
      string
    >;
  };
  statuses: {
    documents: Record<CoworkerDocumentStatus, string>;
    origins: Record<CoworkerDocumentOrigin, string>;
    requirements: Record<CoworkerDocumentRequirementStatus, string>;
    versions: Record<CoworkerDocumentVersionStatus, string>;
    malware: Record<CoworkerMalwareScanStatus, string>;
    signatureDeclarations: Record<CoworkerSignatureDeclarationType, string>;
    verificationMethods: Record<CoworkerSignatureVerificationMethod, string>;
    verificationStatuses: Record<CoworkerSignatureVerificationStatus, string>;
    verifiedSignatureTypes: Record<CoworkerVerifiedSignatureType, string>;
    decisions: Record<AdminCoworkerReviewDecision, string>;
    automaticVerificationModes: Record<
      CoworkerAutomaticVerificationMode,
      string
    >;
    required: string;
    optional: string;
    submittedVersion: string;
    currentVersion: string;
    historicalVersion: string;
    noRequirement: string;
  };
  messages: {
    startReviewConfirmation: string;
    acceptConfirmation: string;
    rejectConfirmation: string;
    startReviewSuccess: string;
    signatureVerified: string;
    documentAccepted: string;
    documentRejected: string;
  };
  errors: {
    load: string;
    startReview: string;
    verifySignature: string;
    acceptDocument: string;
    rejectDocument: string;
    download: string;
  };
};
