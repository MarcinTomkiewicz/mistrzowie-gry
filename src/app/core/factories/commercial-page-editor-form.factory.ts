import { FormControl, FormGroup, Validators } from '@angular/forms';

import type { StoredCommercialPageDocument } from '../types/commercial-page';
import type { CommercialPageEditorForm } from '../types/commercial-page-editor-form';
import { normalizeText } from '../utils/normalize-text';
import { requiredTrimmedValidator } from '../validators/required-trimmed.validator';

const requiredTextValidators = [
  Validators.required,
  requiredTrimmedValidator(),
];

export function createCommercialPageEditorForm(): CommercialPageEditorForm {
  return new FormGroup({
    metadata: new FormGroup({
      heading: new FormControl('', {
        nonNullable: true,
        validators: requiredTextValidators,
      }),
      lead: new FormControl('', { nonNullable: true }),
    }),
    seo: new FormGroup({
      title: new FormControl('', {
        nonNullable: true,
        validators: requiredTextValidators,
      }),
      description: new FormControl('', {
        nonNullable: true,
        validators: requiredTextValidators,
      }),
      ogTitle: new FormControl('', { nonNullable: true }),
      ogDescription: new FormControl('', { nonNullable: true }),
      canonicalUrl: new FormControl('', { nonNullable: true }),
    }),
  });
}

export function resetCommercialPageEditorForm(
  form: CommercialPageEditorForm,
  document: StoredCommercialPageDocument,
): void {
  form.reset(
    {
      metadata: {
        heading: document.heading,
        lead: document.lead ?? '',
      },
      seo: {
        title: document.seo.title,
        description: document.seo.description,
        ogTitle: document.seo.ogTitle ?? '',
        ogDescription: document.seo.ogDescription ?? '',
        canonicalUrl: document.seo.canonicalUrl ?? '',
      },
    },
    { emitEvent: false },
  );
}

export function mapCommercialPageEditorFormToDocument(
  form: CommercialPageEditorForm,
  document: StoredCommercialPageDocument,
): StoredCommercialPageDocument {
  const value = form.getRawValue();

  return {
    ...document,
    heading: value.metadata.heading.trim(),
    lead: normalizeText(value.metadata.lead),
    seo: {
      title: value.seo.title.trim(),
      description: value.seo.description.trim(),
      ogTitle: normalizeText(value.seo.ogTitle),
      ogDescription: normalizeText(value.seo.ogDescription),
      canonicalUrl: normalizeText(value.seo.canonicalUrl),
    },
  };
}
