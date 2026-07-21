import { AppRole } from '../types/app-role';
import {
  AdminOperationalTargetKind,
  AdminOperationalUnpublishedVersionStatus,
} from '../types/admin-coworker-operational-document';
import { CoworkerMalwareScanStatus } from '../types/coworker-document';
import {
  CoworkerOperationalAction,
  CoworkerOperationalActionMode,
  CoworkerOperationalDocumentStatus,
  CoworkerOperationalVersionStatus,
} from '../types/coworker-operational-document';

export interface IAdminOperationalCoworkerOption {
  readonly userId: string;
  readonly email: string;
  readonly firstName: string | null;
  readonly appRole: AppRole;
  readonly accessEnabled: boolean;
}

export interface IAdminOperationalEventOption {
  readonly id: string;
  readonly key: string;
  readonly name: string;
  readonly isActive: boolean;
}

export interface IAdminOperationalStorageCatalog {
  readonly bucket: string;
  readonly public: boolean | null;
  readonly fileSizeLimit: number | null;
  readonly allowedMimeTypes: readonly string[] | null;
}

export interface IAdminOperationalCatalog {
  readonly actionModes: readonly CoworkerOperationalActionMode[];
  readonly targetKinds: readonly AdminOperationalTargetKind[];
  readonly appRoles: readonly AppRole[];
  readonly coworkers: readonly IAdminOperationalCoworkerOption[];
  readonly eventDefinitions: readonly IAdminOperationalEventOption[];
  readonly storage: IAdminOperationalStorageCatalog | null;
}

export interface IAdminOperationalVersionStorage {
  readonly bucket: string;
  readonly path: string;
  readonly objectEtag: string | null;
}

export interface IAdminOperationalVersionFile<
  TStorage extends IAdminOperationalVersionStorage | null,
> {
  readonly originalFilename: string;
  readonly storedFilename: string;
  readonly fileExtension: string;
  readonly declaredMimeType: string;
  readonly detectedMimeType: string | null;
  readonly expectedSizeBytes: number;
  readonly sizeBytes: number | null;
  readonly contentSha256Base64: string | null;
  readonly malwareScanStatus: CoworkerMalwareScanStatus;
  readonly storage: TStorage;
}

export interface IAdminOperationalTargetBase {
  readonly id: string;
  readonly targetKind: AdminOperationalTargetKind;
  readonly createdAt: string;
}

export interface IAdminOperationalAllCoworkersTarget
  extends IAdminOperationalTargetBase {
  readonly targetKind: 'all_active_coworkers';
  readonly appRole: null;
  readonly userId: null;
  readonly eventDefinitionId: null;
}

export interface IAdminOperationalAppRoleTarget
  extends IAdminOperationalTargetBase {
  readonly targetKind: 'app_role';
  readonly appRole: AppRole;
  readonly userId: null;
  readonly eventDefinitionId: null;
}

export interface IAdminOperationalUserTarget
  extends IAdminOperationalTargetBase {
  readonly targetKind: 'user';
  readonly appRole: null;
  readonly userId: string;
  readonly eventDefinitionId: null;
}

export interface IAdminOperationalEventTarget
  extends IAdminOperationalTargetBase {
  readonly targetKind: 'event_definition';
  readonly appRole: null;
  readonly userId: null;
  readonly eventDefinitionId: string;
}

export type IAdminOperationalTarget =
  | IAdminOperationalAllCoworkersTarget
  | IAdminOperationalAppRoleTarget
  | IAdminOperationalUserTarget
  | IAdminOperationalEventTarget;

export interface IAdminOperationalStatement {
  readonly id: string;
  readonly action: CoworkerOperationalAction;
  readonly statementVersion: number;
  readonly text: string;
  readonly sha256Base64: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface IAdminOperationalAssignmentSummary {
  readonly total: number;
  readonly available: number;
  readonly pending: number;
  readonly acknowledged: number;
  readonly accepted: number;
  readonly declined: number;
}

export interface IAdminOperationalDocumentVersion<
  TStorage extends IAdminOperationalVersionStorage | null,
  TStatus extends CoworkerOperationalVersionStatus =
    CoworkerOperationalVersionStatus,
> {
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
  readonly file: IAdminOperationalVersionFile<TStorage>;
  readonly targets: readonly IAdminOperationalTarget[];
  readonly statements: readonly IAdminOperationalStatement[];
  readonly assignmentSummary: IAdminOperationalAssignmentSummary;
  readonly uploadedAt: string | null;
  readonly finalizedAt: string | null;
  readonly publishedAt: string | null;
  readonly supersededAt: string | null;
  readonly archivedAt: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export type IAdminOperationalStoredVersion =
  IAdminOperationalDocumentVersion<IAdminOperationalVersionStorage>;

export type IAdminOperationalUnpublishedVersion =
  IAdminOperationalDocumentVersion<null, AdminOperationalUnpublishedVersionStatus>;

export interface IAdminOperationalDocumentListItem {
  readonly id: string;
  readonly code: string;
  readonly title: string;
  readonly description: string | null;
  readonly category: string;
  readonly status: CoworkerOperationalDocumentStatus;
  readonly currentPublishedVersionId: string | null;
  readonly currentPublishedVersionNumber: number | null;
  readonly currentActionMode: CoworkerOperationalActionMode | null;
  readonly currentPublishedAt: string | null;
  readonly unpublishedVersion: IAdminOperationalUnpublishedVersion | null;
  readonly revision: number;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface IAdminOperationalDocumentDetail {
  readonly id: string;
  readonly code: string;
  readonly title: string;
  readonly description: string | null;
  readonly category: string;
  readonly status: CoworkerOperationalDocumentStatus;
  readonly currentPublishedVersionId: string | null;
  readonly currentPublishedVersion: IAdminOperationalStoredVersion | null;
  readonly versions: readonly IAdminOperationalStoredVersion[];
  readonly revision: number;
  readonly publishedAt: string | null;
  readonly archivedAt: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface IAdminOperationalDashboard {
  readonly catalog: IAdminOperationalCatalog;
  readonly documents: readonly IAdminOperationalDocumentListItem[];
}
