import type { AppRole } from '../types/app-role';
import type { AdminOperationalUploadMimeType } from '../types/admin-operational-upload';
import type { AdminOperationalTargetKind } from '../types/admin-operational-version';
import type { CoworkerOperationalActionMode } from '../types/coworker-operational-document';

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
  readonly public: false;
  readonly fileSizeLimit: number;
  readonly allowedMimeTypes: readonly AdminOperationalUploadMimeType[];
}

export interface IAdminOperationalCatalog {
  readonly actionModes: readonly CoworkerOperationalActionMode[];
  readonly targetKinds: readonly AdminOperationalTargetKind[];
  readonly appRoles: readonly AppRole[];
  readonly coworkers: readonly IAdminOperationalCoworkerOption[];
  readonly eventDefinitions: readonly IAdminOperationalEventOption[];
  readonly storage: IAdminOperationalStorageCatalog | null;
}
