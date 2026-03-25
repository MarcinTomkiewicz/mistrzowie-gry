import { FormBuilder, Validators } from '@angular/forms';

import {
  GmProfileFormGroup,
  IGmProfileFormFactoryOptions,
} from '../interfaces/i-gm-form';
import { IGmProfileFormData } from '../interfaces/i-gm-profile';
import { normalizeText } from '../utils/normalize-text';

export function createGmProfileForm(
  fb: FormBuilder,
  options?: IGmProfileFormFactoryOptions,
): GmProfileFormGroup {
  const initial = options?.initial;

  return fb.group({
    experience: fb.control<number | null>(initial?.experience ?? null, {
      validators: [Validators.min(0), Validators.max(40)],
    }),
    description: fb.control<string | null>(initial?.description ?? null),
    image: fb.control<string | null>(initial?.image ?? null),
    quote: fb.control<string | null>(initial?.quote ?? null, {
      validators: [Validators.maxLength(255)],
    }),
    gmStyleIds: fb.nonNullable.control<string[]>(initial?.gmStyleIds ?? []),
  });
}

export function mapGmProfileFormToPayload(
  form: GmProfileFormGroup,
): IGmProfileFormData {
  const value = form.getRawValue();

  return {
    experience: value.experience ?? null,
    description: normalizeText(value.description),
    image: normalizeText(value.image),
    quote: normalizeText(value.quote),
    gmStyleIds: [...new Set((value.gmStyleIds ?? []).filter(Boolean))],
  };
}