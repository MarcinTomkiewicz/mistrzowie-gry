import {
  AbstractControl,
  FormArray,
  FormControl,
  FormGroup,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';

import {
  COWORKER_DOCUMENT_DEFINITION_LIMITS,
  COWORKER_DOCUMENTS_STORAGE,
} from '../../../../core/configs/coworker-documents.config';
import { ICoworkerDocumentDefinition } from '../../../../core/interfaces/i-coworker-document';
import {
  AdminCoworkerDocumentArrayField,
  AdminCoworkerDocumentDefinitionForm,
  AdminCoworkerDocumentDefinitionPayload,
} from '../../../../core/types/admin-coworker-document';
import {
  COWORKER_DOCUMENT_MULTIPLICITIES,
  COWORKER_DOCUMENT_ORIGIN_POLICIES,
  CoworkerDocumentMultiplicity,
  CoworkerDocumentOriginPolicy,
} from '../../../../core/types/coworker-document';
import { normalizeText } from '../../../../core/utils/normalize-text';
import {
  dateTimeRangeValidator,
  integerValidator,
  validDateValidator,
} from '../../../../core/validators/form-value.validator';
import { requiredTrimmedValidator } from '../../../../core/validators/required-trimmed.validator';

const CODE_PATTERN = /^[a-z0-9][a-z0-9_-]*$/i;
const MIME_PATTERN =
  /^[a-z0-9][a-z0-9.+-]*\/[a-z0-9][a-z0-9.+-]*$/i;
const EXTENSION_PATTERN = /^[a-z0-9]+$/i;

export const ACTIVE_DATE_RANGE_ERROR = 'activeDateRange';

export function createDocumentDefinitionForm():
  AdminCoworkerDocumentDefinitionForm {
  return new FormGroup(
    {
      code: new FormControl('', {
        nonNullable: true,
        validators: [
          requiredTrimmedValidator(),
          Validators.maxLength(COWORKER_DOCUMENT_DEFINITION_LIMITS.codeLength),
          normalizedPatternValidator(normalizeLowercase, CODE_PATTERN),
        ],
      }),
      title: new FormControl('', {
        nonNullable: true,
        validators: [
          requiredTrimmedValidator(),
          Validators.maxLength(COWORKER_DOCUMENT_DEFINITION_LIMITS.titleLength),
        ],
      }),
      description: new FormControl('', {
        nonNullable: true,
        validators: [
          Validators.maxLength(
            COWORKER_DOCUMENT_DEFINITION_LIMITS.descriptionLength,
          ),
        ],
      }),
      category: new FormControl('', {
        nonNullable: true,
        validators: [
          requiredTrimmedValidator(),
          Validators.maxLength(
            COWORKER_DOCUMENT_DEFINITION_LIMITS.categoryLength,
          ),
        ],
      }),
      originPolicy: new FormControl<CoworkerDocumentOriginPolicy>(
        COWORKER_DOCUMENT_ORIGIN_POLICIES[0],
        { nonNullable: true },
      ),
      multiplicity: new FormControl<CoworkerDocumentMultiplicity>(
        COWORKER_DOCUMENT_MULTIPLICITIES[0],
        { nonNullable: true },
      ),
      isRequiredByDefault: new FormControl(false, { nonNullable: true }),
      signaturePolicyCode: new FormControl('', {
        nonNullable: true,
        validators: [
          Validators.required,
          Validators.maxLength(
            COWORKER_DOCUMENT_DEFINITION_LIMITS.signaturePolicyCodeLength,
          ),
        ],
      }),
      allowedMimeTypes: createDefinitionArray('allowedMimeTypes'),
      allowedExtensions: createDefinitionArray('allowedExtensions'),
      maxSizeBytes: new FormControl(
        COWORKER_DOCUMENTS_STORAGE.maxFileSizeBytes,
        {
          nonNullable: true,
          validators: [
            Validators.required,
            integerValidator(),
            Validators.min(1),
            Validators.max(COWORKER_DOCUMENTS_STORAGE.maxFileSizeBytes),
          ],
        },
      ),
      retentionDays: new FormControl<number | null>(null, {
        validators: [
          integerValidator(),
          Validators.min(0),
          Validators.max(COWORKER_DOCUMENT_DEFINITION_LIMITS.retentionDays),
        ],
      }),
      isActive: new FormControl(true, { nonNullable: true }),
      activeFrom: new FormControl<Date | null>(null, {
        validators: [validDateValidator()],
      }),
      activeUntil: new FormControl<Date | null>(null, {
        validators: [validDateValidator()],
      }),
    },
    {
      validators: [
        dateTimeRangeValidator(
          'activeFrom',
          'activeUntil',
          ACTIVE_DATE_RANGE_ERROR,
        ),
      ],
    },
  );
}

export function addDocumentDefinitionArrayItem(
  form: AdminCoworkerDocumentDefinitionForm,
  field: AdminCoworkerDocumentArrayField,
): void {
  form.controls[field].push(createDefinitionArrayItem(field, ''));
}

export function populateDocumentDefinitionForm(
  form: AdminCoworkerDocumentDefinitionForm,
  definition: ICoworkerDocumentDefinition | null,
): void {
  form.reset(
    {
      code: definition?.code ?? '',
      title: definition?.title ?? '',
      description: definition?.description ?? '',
      category: definition?.category ?? '',
      originPolicy:
        definition?.originPolicy ?? COWORKER_DOCUMENT_ORIGIN_POLICIES[0],
      multiplicity:
        definition?.multiplicity ?? COWORKER_DOCUMENT_MULTIPLICITIES[0],
      isRequiredByDefault: definition?.isRequiredByDefault ?? false,
      signaturePolicyCode: definition?.signaturePolicy.code ?? '',
      maxSizeBytes:
        definition?.maxSizeBytes ?? COWORKER_DOCUMENTS_STORAGE.maxFileSizeBytes,
      retentionDays: definition?.retentionDays ?? null,
      isActive: definition?.isActive ?? true,
      activeFrom: definition?.activeFrom ? new Date(definition.activeFrom) : null,
      activeUntil: definition?.activeUntil ? new Date(definition.activeUntil) : null,
    },
    { emitEvent: false },
  );
  resetDefinitionArray(
    form.controls.allowedMimeTypes,
    'allowedMimeTypes',
    definition?.allowedMimeTypes ?? [],
  );
  resetDefinitionArray(
    form.controls.allowedExtensions,
    'allowedExtensions',
    definition?.allowedExtensions ?? [],
  );
  form.updateValueAndValidity({ emitEvent: false });
  form.markAsPristine();
  form.markAsUntouched();
}

export function mapDocumentDefinitionFormToPayload(
  form: AdminCoworkerDocumentDefinitionForm,
  id: string | null,
): AdminCoworkerDocumentDefinitionPayload {
  const value = form.getRawValue();

  return {
    id,
    code: normalizeLowercase(value.code),
    title: value.title.trim(),
    description: normalizeText(value.description),
    category: value.category.trim(),
    originPolicy: value.originPolicy,
    multiplicity: value.multiplicity,
    isRequiredByDefault: value.isRequiredByDefault,
    signaturePolicyCode: normalizeLowercase(value.signaturePolicyCode),
    allowedMimeTypes: value.allowedMimeTypes.map(normalizeLowercase),
    allowedExtensions: value.allowedExtensions.map(normalizeExtension),
    maxSizeBytes: value.maxSizeBytes,
    retentionDays: value.retentionDays,
    isActive: value.isActive,
    activeFrom: value.activeFrom?.toISOString() ?? null,
    activeUntil: value.activeUntil?.toISOString() ?? null,
  };
}

function createDefinitionArray(
  field: AdminCoworkerDocumentArrayField,
): FormArray<FormControl<string>> {
  return new FormArray<FormControl<string>>(
    [],
    [
      Validators.required,
      Validators.maxLength(
        COWORKER_DOCUMENT_DEFINITION_LIMITS.allowedItemCount,
      ),
      uniqueNormalizedItemsValidator(
        field === 'allowedMimeTypes' ? normalizeLowercase : normalizeExtension,
      ),
    ],
  );
}

function createDefinitionArrayItem(
  field: AdminCoworkerDocumentArrayField,
  value: string,
): FormControl<string> {
  const mimeType = field === 'allowedMimeTypes';

  return new FormControl(value, {
    nonNullable: true,
    validators: [
      requiredTrimmedValidator(),
      Validators.maxLength(
        mimeType
          ? COWORKER_DOCUMENT_DEFINITION_LIMITS.mimeTypeLength
          : COWORKER_DOCUMENT_DEFINITION_LIMITS.extensionLength,
      ),
      normalizedPatternValidator(
        mimeType ? normalizeLowercase : normalizeExtension,
        mimeType ? MIME_PATTERN : EXTENSION_PATTERN,
      ),
    ],
  });
}

function resetDefinitionArray(
  control: FormArray<FormControl<string>>,
  field: AdminCoworkerDocumentArrayField,
  values: readonly string[],
): void {
  control.clear({ emitEvent: false });
  values.forEach((value) =>
    control.push(createDefinitionArrayItem(field, value), {
      emitEvent: false,
    }),
  );
}

function normalizedPatternValidator(
  normalize: (value: string) => string,
  pattern: RegExp,
): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    if (typeof value !== 'string' || normalize(value) === '') return null;

    return pattern.test(normalize(value)) ? null : { pattern: true };
  };
}

function uniqueNormalizedItemsValidator(
  normalize: (value: string) => string,
): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value: unknown = control.value;
    if (!Array.isArray(value)) return null;

    const normalized = value
      .filter((item): item is string => typeof item === 'string')
      .map(normalize)
      .filter((item) => item !== '');

    return new Set(normalized).size === normalized.length
      ? null
      : { uniqueItems: true };
  };
}

function normalizeLowercase(value: string): string {
  return value.trim().toLowerCase();
}

function normalizeExtension(value: string): string {
  return normalizeLowercase(value).replace(/^\./, '');
}
