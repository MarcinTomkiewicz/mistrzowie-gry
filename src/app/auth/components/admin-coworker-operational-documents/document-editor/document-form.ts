import { FormControl, FormGroup, Validators } from '@angular/forms';

import {
  ADMIN_OPERATIONAL_DOCUMENT_CODE_PATTERN,
} from '../../../../core/configs/admin-coworker-operational-documents.config';
import { COWORKER_DOCUMENT_SHELL_LIMITS } from '../../../../core/configs/coworker-documents.config';
import { IAdminOperationalDocumentDetail } from '../../../../core/interfaces/i-admin-operational-document';
import { SaveAdminOperationalDocumentPayload } from '../../../../core/types/admin-operational-document';
import { AdminOperationalDocumentForm } from '../../../../core/types/admin-operational-forms';
import { normalizeText } from '../../../../core/utils/normalize-text';
import { requiredTrimmedValidator } from '../../../../core/validators/required-trimmed.validator';

export function createAdminOperationalDocumentForm():
  AdminOperationalDocumentForm {
  return new FormGroup({
    code: new FormControl('', {
      nonNullable: true,
      validators: [
        requiredTrimmedValidator(),
        Validators.maxLength(COWORKER_DOCUMENT_SHELL_LIMITS.codeLength),
        Validators.pattern(ADMIN_OPERATIONAL_DOCUMENT_CODE_PATTERN),
      ],
    }),
    title: new FormControl('', {
      nonNullable: true,
      validators: [
        requiredTrimmedValidator(),
        Validators.maxLength(COWORKER_DOCUMENT_SHELL_LIMITS.titleLength),
      ],
    }),
    description: new FormControl('', {
      nonNullable: true,
      validators: [
        Validators.maxLength(
          COWORKER_DOCUMENT_SHELL_LIMITS.descriptionLength,
        ),
      ],
    }),
    category: new FormControl('', {
      nonNullable: true,
      validators: [
        requiredTrimmedValidator(),
        Validators.maxLength(
          COWORKER_DOCUMENT_SHELL_LIMITS.categoryLength,
        ),
      ],
    }),
  });
}

export function populateAdminOperationalDocumentForm(
  form: AdminOperationalDocumentForm,
  document: IAdminOperationalDocumentDetail | null,
): void {
  form.reset(
    {
      code: document?.code ?? '',
      title: document?.title ?? '',
      description: document?.description ?? '',
      category: document?.category ?? '',
    },
    { emitEvent: false },
  );
  form.markAsPristine();
  form.markAsUntouched();
}

export function mapAdminOperationalDocumentForm(
  form: AdminOperationalDocumentForm,
  id: string | null,
): SaveAdminOperationalDocumentPayload {
  const value = form.getRawValue();
  return {
    id,
    code: value.code.trim(),
    title: value.title.trim(),
    description: normalizeText(value.description),
    category: value.category.trim(),
  };
}
