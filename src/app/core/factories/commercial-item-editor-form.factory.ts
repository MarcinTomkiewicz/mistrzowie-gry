import { FormControl, FormGroup } from '@angular/forms';

import type {
  CommercialAction,
  CommercialCardItem,
  CommercialFaqItem,
  CommercialPricingItem,
  CommercialProcessItem,
} from '../types/commercial-page';
import type {
  CommercialActionEditorForm,
  CommercialFaqItemEditorForm,
  CommercialPricedItemEditorForm,
  CommercialProcessItemEditorForm,
} from '../types/commercial-page-editor-form';
import { normalizeText } from '../utils/normalize-text';
import { requiredTrimmedValidator } from '../validators/required-trimmed.validator';
import { commercialInternalRouteValidator } from '../validators/commercial-page-editor.validator';
import {
  createCommercialCapacityEditorForm,
  createCommercialPriceEditorForm,
  createCommercialScheduleEditorForm,
  mapCommercialCapacityEditorForm,
  mapCommercialPriceEditorForm,
  mapCommercialScheduleEditorForm,
} from './commercial-price-editor-form.factory';

const requiredTextValidators = [requiredTrimmedValidator()];

export function createCommercialActionEditorForm(
  action: CommercialAction | null = null,
  enabled = true,
): CommercialActionEditorForm {
  const form = new FormGroup({
    label: new FormControl(action?.label ?? '', {
      nonNullable: true,
      validators: requiredTextValidators,
    }),
    route: new FormControl(action?.route ?? '', {
      nonNullable: true,
      validators: [
        requiredTrimmedValidator(),
        commercialInternalRouteValidator,
      ],
    }),
    appearance: new FormControl(action?.appearance ?? 'primary', {
      nonNullable: true,
    }),
  });

  if (!enabled) form.disable({ emitEvent: false });

  return form;
}

export function createCommercialPricedItemEditorForm(
  item: CommercialCardItem | CommercialPricingItem | null = null,
  priceRequired = false,
): CommercialPricedItemEditorForm {
  const hasPrice = priceRequired || item?.price !== null && !!item;
  const hasCapacity = item?.capacity !== null && !!item;
  const hasSchedule = item?.schedule !== null && !!item;
  const price = createCommercialPriceEditorForm(item?.price ?? null);
  const capacity = createCommercialCapacityEditorForm(item?.capacity ?? null);
  const schedule = createCommercialScheduleEditorForm(item?.schedule ?? null);

  if (!hasPrice) price.disable({ emitEvent: false });
  if (!hasCapacity) capacity.disable({ emitEvent: false });
  if (!hasSchedule) schedule.disable({ emitEvent: false });

  return new FormGroup({
    id: new FormControl(item?.id ?? crypto.randomUUID(), {
      nonNullable: true,
    }),
    title: new FormControl(item?.title ?? '', {
      nonNullable: true,
      validators: requiredTextValidators,
    }),
    body: new FormControl(item?.body ?? '', { nonNullable: true }),
    hasPrice: new FormControl(hasPrice, { nonNullable: true }),
    price,
    hasCapacity: new FormControl(hasCapacity, { nonNullable: true }),
    capacity,
    hasSchedule: new FormControl(hasSchedule, { nonNullable: true }),
    schedule,
  });
}

export function createCommercialProcessItemEditorForm(
  item: CommercialProcessItem | null = null,
): CommercialProcessItemEditorForm {
  return new FormGroup({
    id: new FormControl(item?.id ?? crypto.randomUUID(), {
      nonNullable: true,
    }),
    title: new FormControl(item?.title ?? '', {
      nonNullable: true,
      validators: requiredTextValidators,
    }),
    body: new FormControl(item?.body ?? '', {
      nonNullable: true,
      validators: requiredTextValidators,
    }),
  });
}

export function createCommercialFaqItemEditorForm(
  item: CommercialFaqItem | null = null,
): CommercialFaqItemEditorForm {
  return new FormGroup({
    id: new FormControl(item?.id ?? crypto.randomUUID(), {
      nonNullable: true,
    }),
    question: new FormControl(item?.question ?? '', {
      nonNullable: true,
      validators: requiredTextValidators,
    }),
    answer: new FormControl(item?.answer ?? '', {
      nonNullable: true,
      validators: requiredTextValidators,
    }),
  });
}

export function mapCommercialActionEditorForm(
  form: CommercialActionEditorForm,
): CommercialAction {
  const value = form.getRawValue();

  return {
    label: value.label.trim(),
    route: value.route.trim(),
    appearance: value.appearance,
  };
}

export function mapCommercialCardItemEditorForm(
  form: CommercialPricedItemEditorForm,
  position: number,
): CommercialCardItem {
  const value = form.getRawValue();

  return {
    ...mapCommercialPricedItemBase(form, position),
    price: value.hasPrice ? mapCommercialPriceEditorForm(form.controls.price) : null,
  };
}

export function mapCommercialPricingItemEditorForm(
  form: CommercialPricedItemEditorForm,
  position: number,
): CommercialPricingItem {
  return {
    ...mapCommercialPricedItemBase(form, position),
    price: mapCommercialPriceEditorForm(form.controls.price),
  };
}

export function mapCommercialProcessItemEditorForm(
  form: CommercialProcessItemEditorForm,
  position: number,
): CommercialProcessItem {
  const value = form.getRawValue();

  return {
    id: value.id,
    position,
    title: value.title.trim(),
    body: value.body.trim(),
  };
}

export function mapCommercialFaqItemEditorForm(
  form: CommercialFaqItemEditorForm,
  position: number,
): CommercialFaqItem {
  const value = form.getRawValue();

  return {
    id: value.id,
    position,
    question: value.question.trim(),
    answer: value.answer.trim(),
  };
}

function mapCommercialPricedItemBase(
  form: CommercialPricedItemEditorForm,
  position: number,
) {
  const value = form.getRawValue();

  return {
    id: value.id,
    position,
    title: value.title.trim(),
    body: normalizeText(value.body),
    capacity: value.hasCapacity
      ? mapCommercialCapacityEditorForm(form.controls.capacity)
      : null,
    schedule: value.hasSchedule
      ? mapCommercialScheduleEditorForm(form.controls.schedule)
      : null,
  };
}
