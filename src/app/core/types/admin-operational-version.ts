import type { AppRole } from './app-role';
import type { CoworkerMalwareScanStatus } from './coworker-document';
import type {
  CoworkerOperationalAction,
  CoworkerOperationalActionMode,
  CoworkerOperationalVersionStatus,
} from './coworker-operational-document';
import type { AdminOperationalUploadMimeType } from './admin-operational-upload';

export const ADMIN_OPERATIONAL_TARGET_KINDS = [
  'all_active_coworkers',
  'app_role',
  'user',
  'event_definition',
] as const;

export const ADMIN_OPERATIONAL_UNPUBLISHED_STATUSES = [
  'reserved',
  'uploaded',
  'ready',
  'failed',
] as const satisfies readonly CoworkerOperationalVersionStatus[];

export type AdminOperationalTargetKind =
  (typeof ADMIN_OPERATIONAL_TARGET_KINDS)[number];
export type AdminOperationalUnpublishedVersionStatus =
  (typeof ADMIN_OPERATIONAL_UNPUBLISHED_STATUSES)[number];

type AdminOperationalTargetBase = {
  readonly id: string;
  readonly createdAt: string;
};

export type AdminOperationalTarget = AdminOperationalTargetBase & (
  | {
      readonly targetKind: 'all_active_coworkers';
      readonly appRole: null;
      readonly userId: null;
      readonly eventDefinitionId: null;
    }
  | {
      readonly targetKind: 'app_role';
      readonly appRole: AppRole;
      readonly userId: null;
      readonly eventDefinitionId: null;
    }
  | {
      readonly targetKind: 'user';
      readonly appRole: null;
      readonly userId: string;
      readonly eventDefinitionId: null;
    }
  | {
      readonly targetKind: 'event_definition';
      readonly appRole: null;
      readonly userId: null;
      readonly eventDefinitionId: string;
    }
);

export type AdminOperationalTargetKeySource = {
  readonly targetKind: AdminOperationalTargetKind;
  readonly appRole: AppRole | null;
  readonly userId: string | null;
  readonly eventDefinitionId: string | null;
};

export type AdminOperationalStatement = {
  readonly id: string;
  readonly action: CoworkerOperationalAction;
  readonly statementVersion: number;
  readonly text: string;
  readonly sha256Base64: string;
  readonly createdAt: string;
  readonly updatedAt: string;
};

export type AdminOperationalAssignmentSummary = {
  readonly total: number;
  readonly available: number;
  readonly pending: number;
  readonly acknowledged: number;
  readonly accepted: number;
  readonly declined: number;
};

export type AdminOperationalVersionStorage = {
  readonly bucket: string;
  readonly path: string;
  readonly objectEtag: string | null;
};

export type AdminOperationalVersionFile<
  TStorage extends AdminOperationalVersionStorage | null,
> = {
  readonly originalFilename: string;
  readonly storedFilename: string;
  readonly fileExtension: string;
  readonly declaredMimeType: AdminOperationalUploadMimeType;
  readonly detectedMimeType: AdminOperationalUploadMimeType | null;
  readonly expectedSizeBytes: number;
  readonly sizeBytes: number | null;
  readonly contentSha256Base64: string | null;
  readonly malwareScanStatus: CoworkerMalwareScanStatus;
  readonly storage: TStorage;
};

export type AdminOperationalDocumentVersion<
  TStorage extends AdminOperationalVersionStorage | null,
  TStatus extends CoworkerOperationalVersionStatus =
    CoworkerOperationalVersionStatus,
> = {
  readonly id: string;
  readonly documentId: string;
  readonly versionNumber: number;
  readonly status: TStatus;
  readonly title: string;
  readonly summary: string | null;
  readonly actionMode: CoworkerOperationalActionMode;
  readonly requiresReacceptance: boolean;
  readonly statementVersion: number;
  readonly actionDueAt: string | null;
  readonly file: AdminOperationalVersionFile<TStorage>;
  readonly targets: readonly AdminOperationalTarget[];
  readonly statements: readonly AdminOperationalStatement[];
  readonly assignmentSummary: AdminOperationalAssignmentSummary;
  readonly uploadedAt: string | null;
  readonly finalizedAt: string | null;
  readonly publishedAt: string | null;
  readonly supersededAt: string | null;
  readonly archivedAt: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
};

export type AdminOperationalStoredVersion =
  AdminOperationalDocumentVersion<AdminOperationalVersionStorage>;

export type AdminOperationalUnpublishedVersion =
  AdminOperationalDocumentVersion<
    null,
    AdminOperationalUnpublishedVersionStatus
  >;

export type ConfigureAdminOperationalTarget =
  | {
      readonly targetKind: 'all_active_coworkers';
      readonly appRole: null;
      readonly userId: null;
      readonly eventDefinitionId: null;
    }
  | {
      readonly targetKind: 'app_role';
      readonly appRole: AppRole;
      readonly userId: null;
      readonly eventDefinitionId: null;
    }
  | {
      readonly targetKind: 'user';
      readonly appRole: null;
      readonly userId: string;
      readonly eventDefinitionId: null;
    }
  | {
      readonly targetKind: 'event_definition';
      readonly appRole: null;
      readonly userId: null;
      readonly eventDefinitionId: string;
    };

export type ConfigureAdminOperationalStatement = {
  readonly action: CoworkerOperationalAction;
  readonly text: string;
};

export type ConfigureAdminOperationalVersionPayload = {
  readonly documentVersionId: string;
  readonly title: string;
  readonly summary: string | null;
  readonly actionMode: CoworkerOperationalActionMode;
  readonly requiresReacceptance: boolean;
  readonly statementVersion: number;
  readonly actionDueAt: string | null;
  readonly targets: readonly ConfigureAdminOperationalTarget[];
  readonly statements: readonly ConfigureAdminOperationalStatement[];
};
