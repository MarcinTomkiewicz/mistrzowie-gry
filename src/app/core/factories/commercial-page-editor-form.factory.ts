import { FormArray, FormControl, FormGroup, Validators } from '@angular/forms';

import type { CommercialPageEditorDocument } from '../types/commercial-page-builder';
import type {
  CommercialPageEditorForm,
  CommercialProductEditorForm,
  CommercialSectionEditorForm,
} from '../types/commercial-page-editor-form';
import { compareByPosition } from '../utils/compare-by-position';
import { normalizeText } from '../utils/normalize-text';
import { commercialProductsValidator } from '../validators/commercial-builder-editor.validator';
import { requiredTrimmedValidator } from '../validators/required-trimmed.validator';
import {
  createCommercialProductEditorForm,
  mapCommercialProductEditorForm,
  syncCommercialProductEditorControls,
} from './commercial-product-editor-form.factory';
import {
  createCommercialSectionEditorForm,
  mapCommercialSectionEditorForm,
} from './commercial-section-editor-form.factory';
import {
  isCommercialCardsBlockEditorForm,
  isCommercialProductCollectionBlockEditorForm,
} from './commercial-block-editor-form.mapper';
import {
  syncCommercialCardPriceControl,
} from './commercial-block-item-editor-form.factory';
import {
  syncCommercialProductCollectionPresentationControls,
} from './commercial-block-editor-form.factory';

export function createCommercialPageEditorForm(): CommercialPageEditorForm {
  return new FormGroup({
    metadata: new FormGroup({
      heading: requiredTextControl(),
      lead: new FormControl('', { nonNullable: true }),
    }),
    seo: new FormGroup({
      title: requiredTextControl(),
      description: requiredTextControl(),
      ogTitle: new FormControl('', { nonNullable: true }),
      ogDescription: new FormControl('', { nonNullable: true }),
      canonicalUrl: new FormControl('', { nonNullable: true }),
    }),
    products: new FormArray<CommercialProductEditorForm>([], {
      validators: [commercialProductsValidator],
    }),
    sections: new FormArray<CommercialSectionEditorForm>([]),
  });
}

export function resetCommercialPageEditorForm(
  form: CommercialPageEditorForm,
  document: CommercialPageEditorDocument,
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

  form.controls.products.clear({ emitEvent: false });
  for (const product of [...document.products].sort(compareByPosition)) {
    form.controls.products.push(createCommercialProductEditorForm(product), {
      emitEvent: false,
    });
  }

  form.controls.sections.clear({ emitEvent: false });
  for (const section of [...document.sections].sort(compareByPosition)) {
    form.controls.sections.push(createCommercialSectionEditorForm(section), {
      emitEvent: false,
    });
  }

  syncCommercialPageEditorOptionalControls(form);
  form.markAsPristine();
  form.markAsUntouched();
}

export function mapCommercialPageEditorFormToDocument(
  form: CommercialPageEditorForm,
): CommercialPageEditorDocument {
  const value = form.getRawValue();

  return {
    heading: value.metadata.heading.trim(),
    lead: normalizeText(value.metadata.lead),
    seo: {
      title: value.seo.title.trim(),
      description: value.seo.description.trim(),
      ogTitle: normalizeText(value.seo.ogTitle),
      ogDescription: normalizeText(value.seo.ogDescription),
      canonicalUrl: normalizeText(value.seo.canonicalUrl),
    },
    products: form.controls.products.controls.map((product, index) =>
      mapCommercialProductEditorForm(product, (index + 1) * 10),
    ),
    sections: form.controls.sections.controls.map((section, index) =>
      mapCommercialSectionEditorForm(section, (index + 1) * 10),
    ),
  };
}

export function syncCommercialPageEditorOptionalControls(
  form: CommercialPageEditorForm,
): void {
  for (const product of form.controls.products.controls) {
    syncCommercialProductEditorControls(product);
  }

  for (const section of form.controls.sections.controls) {
    for (const block of section.controls.blocks.controls) {
      if (isCommercialCardsBlockEditorForm(block)) {
        for (const card of block.controls.items.controls) {
          syncCommercialCardPriceControl(card);
        }
      } else if (isCommercialProductCollectionBlockEditorForm(block)) {
        syncCommercialProductCollectionPresentationControls(block);
      }
    }
  }
}

function requiredTextControl(): FormControl<string> {
  return new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, requiredTrimmedValidator()],
  });
}
