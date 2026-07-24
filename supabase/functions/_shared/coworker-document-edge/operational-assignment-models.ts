export const OPERATIONAL_ACTIONS = [
  "acknowledged",
  "accepted",
  "declined",
] as const;

export const OPERATIONAL_ACTION_MODES = [
  "information_only",
  "acknowledgement_required",
  "acceptance_required",
] as const;

export const OPERATIONAL_ASSIGNMENT_STATUSES = [
  "available",
  "pending",
  "acknowledged",
  "accepted",
  "declined",
  "waived",
  "expired",
] as const;

export const OPERATIONAL_ASSIGNMENT_SOURCES = [
  "target_sync",
  "admin_manual",
  "system",
  "migration",
] as const;

export const OPERATIONAL_DOCUMENT_STATUSES = [
  "draft",
  "published",
  "archived",
] as const;

export const OPERATIONAL_VERSION_STATUSES = [
  "reserved",
  "uploaded",
  "ready",
  "published",
  "superseded",
  "archived",
  "failed",
  "deleted",
] as const;

export const OPERATIONAL_ACTION_SOURCES = [
  "web",
  "admin",
  "system",
  "migration",
] as const;

export const OPERATIONAL_SHA256_BASE64_PATTERN = /^[A-Za-z0-9+/]{43}=$/;

export type OperationalAction = typeof OPERATIONAL_ACTIONS[number];
export type OperationalActionMode = typeof OPERATIONAL_ACTION_MODES[number];
export type OperationalAssignmentStatus =
  typeof OPERATIONAL_ASSIGNMENT_STATUSES[number];
export type OperationalAssignmentSource =
  typeof OPERATIONAL_ASSIGNMENT_SOURCES[number];
export type OperationalDocumentStatus =
  typeof OPERATIONAL_DOCUMENT_STATUSES[number];
export type OperationalVersionStatus =
  typeof OPERATIONAL_VERSION_STATUSES[number];
export type OperationalActionSource = typeof OPERATIONAL_ACTION_SOURCES[number];

export interface OperationalDocumentSummary {
  id: string;
  code: string;
  title: string;
  description: string | null;
  category: string;
  status: OperationalDocumentStatus;
  currentPublishedVersionId: string | null;
}

export interface OperationalFile {
  originalFilename: string;
  declaredMimeType: string;
  detectedMimeType: string | null;
  sizeBytes: number | null;
  contentSha256Base64: string | null;
}

export interface OperationalVersionSummary {
  id: string;
  versionNumber: number;
  status: OperationalVersionStatus;
  title: string;
  summary: string | null;
  actionMode: OperationalActionMode;
  requiresReacceptance: boolean;
  statementVersion: number;
  actionDueAt: string | null;
  publishedAt: string | null;
  file: OperationalFile;
}

export interface OperationalStatement {
  id: string;
  action: OperationalAction;
  statementVersion: number;
  text: string;
  sha256Base64: string;
}

export interface OperationalCurrentAction {
  id: string;
  action: OperationalAction;
  statementId: string;
  statementVersion: number;
  statementSha256Base64: string;
  statementText: string;
  declineReason: string | null;
  source: OperationalActionSource;
  actorUserId: string;
  actedAt: string;
}

export interface OperationalInheritedAssignment {
  assignmentId: string;
  documentVersionId: string;
  versionNumber: number;
  status: OperationalAssignmentStatus;
  acknowledgedAt: string | null;
  acceptedAt: string | null;
}

export interface OperationalAssignmentBase {
  id: string;
  userId: string;
  documentId: string;
  documentVersionId: string;
  assignmentSource: OperationalAssignmentSource;
  assignedAt: string;
  dueAt: string | null;
  acknowledgedAt: string | null;
  acceptedAt: string | null;
  declinedAt: string | null;
  declineReason: string | null;
  waivedAt: string | null;
  waiverReason: string | null;
  satisfiedByAssignmentId: string | null;
  satisfiedByPreviousVersion: boolean;
  document: OperationalDocumentSummary;
  version: OperationalVersionSummary;
  statements: OperationalStatement[];
  currentAction: OperationalCurrentAction | null;
  inheritedFrom: OperationalInheritedAssignment | null;
  isCurrentPublishedVersion: boolean;
  canAct: boolean;
  downloadAvailable: boolean;
  createdAt: string;
  updatedAt: string;
}

export type OperationalAssignment =
  & OperationalAssignmentBase
  & (
    | {
      actionMode: "information_only";
      status: "available" | "waived" | "expired";
    }
    | {
      actionMode: "acknowledgement_required";
      status: "pending" | "acknowledged" | "waived" | "expired";
    }
    | {
      actionMode: "acceptance_required";
      status: "pending" | "accepted" | "declined" | "waived" | "expired";
    }
  );
