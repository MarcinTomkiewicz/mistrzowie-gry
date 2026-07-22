import {
  FormArray,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';

import { ADMIN_OPERATIONAL_VERSION_LIMITS } from '../../../../core/configs/admin-coworker-operational-documents.config';
import {
  IAdminOperationalCatalog,
} from '../../../../core/interfaces/i-admin-operational-catalog';
import { IAdminOperationalDocumentDetail } from '../../../../core/interfaces/i-admin-operational-document';
import {
  AdminOperationalStatementForm,
  AdminOperationalTargetForm,
  AdminOperationalVersionForm,
  AdminOperationalVersionMetadataForm,
} from '../../../../core/types/admin-operational-forms';
import {
  AdminOperationalUploadMimeType,
  ReserveAdminOperationalUploadPayload,
} from '../../../../core/types/admin-operational-upload';
import {
  AdminOperationalStoredVersion,
  ConfigureAdminOperationalStatement,
  ConfigureAdminOperationalVersionPayload,
} from '../../../../core/types/admin-operational-version';
import {
  CoworkerOperationalAction,
  CoworkerOperationalActionMode,
} from '../../../../core/types/coworker-operational-document';
import { normalizeText } from '../../../../core/utils/normalize-text';
import {
  futureDateValidator,
  integerValidator,
  validDateValidator,
} from '../../../../core/validators/form-value.validator';
import { requiredTrimmedValidator } from '../../../../core/validators/required-trimmed.validator';
import {
  activeAdminOperationalCoworkerIds,
  createAdminOperationalTargetForm,
  mapAdminOperationalTarget,
  uniqueAdminOperationalTargetsValidator,
} from '../target-editor/target-form';

export function createAdminOperationalVersionForm(): AdminOperationalVersionForm {
  const metadata = new FormGroup({
    title: new FormControl('', {
      nonNullable: true,
      validators: [
        requiredTrimmedValidator(),
        Validators.maxLength(ADMIN_OPERATIONAL_VERSION_LIMITS.titleLength),
      ],
    }),
    summary: new FormControl('', {
      nonNullable: true,
      validators: [
        Validators.maxLength(ADMIN_OPERATIONAL_VERSION_LIMITS.summaryLength),
      ],
    }),
    actionMode: new FormControl<CoworkerOperationalActionMode>(
      'information_only',
      { nonNullable: true },
    ),
    requiresReacceptance: new FormControl(false, { nonNullable: true }),
    statementVersion: new FormControl(1, {
      nonNullable: true,
      validators: [Validators.required, integerValidator(), Validators.min(1)],
    }),
    actionDueAt: new FormControl<Date | null>(null, {
      validators: [validDateValidator(), futureDateValidator()],
    }),
  });

  return new FormGroup({
    metadata,
    targets: new FormArray<AdminOperationalTargetForm>([], {
      validators: [
        Validators.required,
        Validators.maxLength(ADMIN_OPERATIONAL_VERSION_LIMITS.targetCount),
        uniqueAdminOperationalTargetsValidator(),
      ],
    }),
    statements: new FormArray<AdminOperationalStatementForm>([]),
  });
}

export function populateAdminOperationalVersionForm(
  form: AdminOperationalVersionForm,
  document: IAdminOperationalDocumentDetail,
  version: AdminOperationalStoredVersion | null,
  catalog: IAdminOperationalCatalog,
): void {
  form.controls.metadata.reset(
    {
      title: version?.title ?? document.title,
      summary: version?.summary ?? document.description ?? '',
      actionMode: version?.actionMode ?? 'information_only',
      requiresReacceptance: version?.requiresReacceptance ?? false,
      statementVersion: version?.statementVersion ?? 1,
      actionDueAt: version?.actionDueAt ? new Date(version.actionDueAt) : null,
    },
    { emitEvent: false },
  );

  form.controls.targets.clear({ emitEvent: false });
  const activeCoworkerIds = activeAdminOperationalCoworkerIds(catalog);
  version?.targets.forEach((target) =>
    form.controls.targets.push(createAdminOperationalTargetForm(
      target,
      activeCoworkerIds,
    ), {
      emitEvent: false,
    }),
  );
  setAdminOperationalStatements(
    form.controls.statements,
    form.controls.metadata.controls.actionMode.value,
    version?.statements ?? [],
  );
  form.updateValueAndValidity({ emitEvent: false });
  form.markAsPristine();
  form.markAsUntouched();
}

export function syncAdminOperationalStatements(
  form: AdminOperationalVersionForm,
): void {
  setAdminOperationalStatements(
    form.controls.statements,
    form.controls.metadata.controls.actionMode.value,
    form.controls.statements.getRawValue(),
  );
}

export function mapAdminOperationalReserveUpload(
  form: AdminOperationalVersionMetadataForm,
  documentId: string,
  file: File,
  originalFilename: string,
  declaredMimeType: AdminOperationalUploadMimeType,
): ReserveAdminOperationalUploadPayload {
  const value = form.getRawValue();
  return {
    documentId,
    title: value.title.trim(),
    summary: normalizeText(value.summary),
    actionMode: value.actionMode,
    requiresReacceptance: value.requiresReacceptance,
    statementVersion: value.statementVersion,
    actionDueAt: value.actionDueAt?.toISOString() ?? null,
    originalFilename,
    declaredMimeType,
    sizeBytes: file.size,
  };
}

export function mapAdminOperationalConfiguration(
  form: AdminOperationalVersionForm,
  documentVersionId: string,
): ConfigureAdminOperationalVersionPayload {
  const value = form.getRawValue();
  return {
    documentVersionId,
    title: value.metadata.title.trim(),
    summary: normalizeText(value.metadata.summary),
    actionMode: value.metadata.actionMode,
    requiresReacceptance: value.metadata.requiresReacceptance,
    statementVersion: value.metadata.statementVersion,
    actionDueAt: value.metadata.actionDueAt?.toISOString() ?? null,
    targets: value.targets.map(mapAdminOperationalTarget),
    statements: value.statements.map((statement) => ({
      action: statement.action,
      text: statement.text.trim(),
    })),
  };
}

function setAdminOperationalStatements(
  form: FormArray<AdminOperationalStatementForm>,
  mode: CoworkerOperationalActionMode,
  current: readonly ConfigureAdminOperationalStatement[],
): void {
  const values = new Map(current.map((statement) => [statement.action, statement.text]));
  const actions: readonly CoworkerOperationalAction[] =
    mode === 'information_only'
      ? []
      : mode === 'acknowledgement_required'
        ? ['acknowledged']
        : ['accepted', 'declined'];
  form.clear({ emitEvent: false });
  actions.forEach((action) =>
    form.push(
      new FormGroup({
        action: new FormControl(action, { nonNullable: true }),
        text: new FormControl(values.get(action) ?? '', {
          nonNullable: true,
          validators: [
            requiredTrimmedValidator(),
            Validators.maxLength(
              ADMIN_OPERATIONAL_VERSION_LIMITS.statementTextLength,
            ),
          ],
        }),
      }),
      { emitEvent: false },
    ),
  );
  form.updateValueAndValidity();
}
