import { FormControl, FormGroup } from '@angular/forms';

import type { CommercialProductPrice } from '../types/commercial-product';
import type { CommercialProductPriceEditorForm } from '../types/commercial-page-editor-form';
import { normalizeText } from '../utils/normalize-text';
import {
  createPriceEditorForm,
  mapPriceEditorForm,
} from './price-editor-form.factory';

export function createCommercialProductPriceEditorForm(
  value: CommercialProductPrice | null = null,
  primary = false,
): CommercialProductPriceEditorForm {
  return new FormGroup({
    price: createPriceEditorForm(value?.price ?? null),
    label: new FormControl(value?.label ?? '', { nonNullable: true }),
    primary: new FormControl(value?.primary ?? primary, { nonNullable: true }),
  });
}

export function mapCommercialProductPriceEditorForm(
  form: CommercialProductPriceEditorForm,
): CommercialProductPrice {
  const value = form.getRawValue();

  return {
    price: mapPriceEditorForm(form.controls.price),
    label: normalizeText(value.label),
    primary: value.primary,
  };
}
