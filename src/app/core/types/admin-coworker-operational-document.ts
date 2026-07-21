import { FormControl, FormGroup } from '@angular/forms';

import {
  CoworkerOperationalVersionStatus,
} from './coworker-operational-document';

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

export const ADMIN_OPERATIONAL_EDGE_ACTION = {
  getDocumentDetail: 'getDocumentDetail',
  saveDocument: 'saveDocument',
} as const;

export const ADMIN_OPERATIONAL_ERROR_CODE = {
  notFound: 'OPERATIONAL_DOCUMENT_NOT_FOUND',
  conflict: 'OPERATIONAL_DOCUMENT_CONFLICT',
  invalidState: 'OPERATIONAL_DOCUMENT_STATE_INVALID',
} as const;

export type AdminOperationalTargetKind =
  (typeof ADMIN_OPERATIONAL_TARGET_KINDS)[number];
export type AdminOperationalUnpublishedVersionStatus =
  (typeof ADMIN_OPERATIONAL_UNPUBLISHED_STATUSES)[number];

export type SaveAdminOperationalDocumentPayload = {
  readonly id: string | null;
  readonly code: string;
  readonly title: string;
  readonly description: string | null;
  readonly category: string;
};

export type AdminOperationalRequest =
  | {
      readonly action:
        typeof ADMIN_OPERATIONAL_EDGE_ACTION.getDocumentDetail;
      readonly documentId: string;
    }
  | {
      readonly action: typeof ADMIN_OPERATIONAL_EDGE_ACTION.saveDocument;
      readonly document: SaveAdminOperationalDocumentPayload;
    };

export type AdminOperationalDocumentForm = FormGroup<{
  code: FormControl<string>;
  title: FormControl<string>;
  description: FormControl<string>;
  category: FormControl<string>;
}>;
