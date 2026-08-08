import { FormArray, FormControl, FormGroup, Validators } from '@angular/forms';

import type { CommercialPageAdminDocument } from '../types/commercial-page-admin';
import type {
  CommercialPageEditorForm,
  CommercialSectionEditorForm,
} from '../types/commercial-page-editor-form';
import { normalizeText } from '../utils/normalize-text';
import { requiredTrimmedValidator } from '../validators/required-trimmed.validator';
import { createCommercialSectionEditorForm } from './commercial-section-editor-form.factory';
import {
  mapCommercialSectionEditorForm,
  syncCommercialSectionEditorOptionalControls,
} from './commercial-section-editor-form.mapper';

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
    sections: new FormArray<CommercialSectionEditorForm>([]),
  });
}

export function resetCommercialPageEditorForm(
  form: CommercialPageEditorForm,
  document: CommercialPageAdminDocument,
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

  form.controls.sections.clear({ emitEvent: false });
  for (const section of [...document.sections].sort(
    (left, right) => left.position - right.position,
  )) {
    form.controls.sections.push(
      createCommercialSectionEditorForm(section),
      { emitEvent: false },
    );
  }

  syncCommercialPageEditorOptionalControls(form);
}

export function mapCommercialPageEditorFormToDocument(
  form: CommercialPageEditorForm,
  document: CommercialPageAdminDocument,
): CommercialPageAdminDocument {
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
    sections: form.controls.sections.controls.map((section, index) =>
      mapCommercialSectionEditorForm(section, (index + 1) * 10),
    ),
  };
}

export function syncCommercialPageEditorOptionalControls(
  form: CommercialPageEditorForm,
): void {
  for (const section of form.controls.sections.controls) {
    syncCommercialSectionEditorOptionalControls(section);
  }
}
