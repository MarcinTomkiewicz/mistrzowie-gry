import type { FormArray, FormControl, FormGroup } from '@angular/forms';

import type { AppRole } from './app-role';
import type { SaveAdminOperationalDocumentPayload } from './admin-operational-document';
import type {
  CoworkerOperationalAction,
  CoworkerOperationalActionMode,
} from './coworker-operational-document';
import type { AdminOperationalTargetKind } from './admin-operational-version';

export type AdminOperationalDocumentForm = FormGroup<{
  code: FormControl<string>;
  title: FormControl<string>;
  description: FormControl<string>;
  category: FormControl<string>;
}>;

export type AdminOperationalDocumentFormSubmission = {
  readonly document: SaveAdminOperationalDocumentPayload;
  readonly revision: number | null;
};

export type AdminOperationalVersionMetadataForm = FormGroup<{
  title: FormControl<string>;
  summary: FormControl<string>;
  actionMode: FormControl<CoworkerOperationalActionMode>;
  requiresReacceptance: FormControl<boolean>;
  statementVersion: FormControl<number>;
  actionDueAt: FormControl<Date | null>;
}>;

export type AdminOperationalTargetForm = FormGroup<{
  targetKind: FormControl<AdminOperationalTargetKind>;
  appRole: FormControl<AppRole | null>;
  userId: FormControl<string | null>;
  eventDefinitionId: FormControl<string | null>;
}>;

export type AdminOperationalStatementForm = FormGroup<{
  action: FormControl<CoworkerOperationalAction>;
  text: FormControl<string>;
}>;

export type AdminOperationalVersionForm = FormGroup<{
  metadata: AdminOperationalVersionMetadataForm;
  targets: FormArray<AdminOperationalTargetForm>;
  statements: FormArray<AdminOperationalStatementForm>;
}>;

export type AdminOperationalWaiverForm = FormGroup<{
  reason: FormControl<string>;
}>;
