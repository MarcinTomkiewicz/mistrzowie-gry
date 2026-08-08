import type { CommercialPageAdminSection } from '../types/commercial-page-admin';
import type {
  CommercialCardGridSectionEditorForm,
  CommercialCtaSectionEditorForm,
  CommercialEditablePricedSectionEditorForm,
  CommercialFaqSectionEditorForm,
  CommercialHeroSectionEditorForm,
  CommercialLocalPricedSectionEditorForm,
  CommercialPricingTableSectionEditorForm,
  CommercialProcessSectionEditorForm,
  CommercialRichTextSectionEditorForm,
  CommercialSectionEditorForm,
  CommercialSharedCardGridSectionEditorForm,
  CommercialSharedCardGridReferenceEditorForm,
  CommercialSharedLogisticsSectionEditorForm,
  CommercialSharedLogisticsReferenceEditorForm,
  CommercialSharedReferenceEditorForm,
  CommercialSharedSectionEditorForm,
} from '../types/commercial-page-editor-form';
import { setControlEnabled } from '../utils/form-controls';
import { normalizeText } from '../utils/normalize-text';
import {
  mapCommercialActionEditorForm,
  mapCommercialCardItemEditorForm,
  mapCommercialFaqItemEditorForm,
  mapCommercialPricingItemEditorForm,
  mapCommercialProcessItemEditorForm,
} from './commercial-item-editor-form.factory';
import { syncCommercialScheduleDurationControl } from './commercial-price-editor-form.factory';

export function mapCommercialSectionEditorForm(
  form: CommercialSectionEditorForm,
  position: number,
): CommercialPageAdminSection {
  if (isCommercialSharedCardGridReferenceEditorForm(form)) {
    return {
      id: form.controls.id.getRawValue(),
      type: 'card_grid',
      position,
      sharedSource: form.controls.sharedSource.getRawValue(),
    };
  }

  if (isCommercialSharedLogisticsReferenceEditorForm(form)) {
    return {
      id: form.controls.id.getRawValue(),
      type: 'logistics_fees',
      position,
      sharedSource: form.controls.sharedSource.getRawValue(),
    };
  }

  const base = mapSectionBase(form, position);

  if (isCommercialHeroSectionEditorForm(form)) {
    return {
      ...base,
      type: 'hero',
      body: normalizeText(form.controls.body.getRawValue()),
      action: form.controls.hasAction.getRawValue()
        ? mapCommercialActionEditorForm(form.controls.action)
        : null,
    };
  }

  if (isCommercialRichTextSectionEditorForm(form)) {
    return {
      ...base,
      type: 'rich_text',
      body: form.controls.body.getRawValue().trim(),
    };
  }

  if (
    isCommercialSharedCardGridSectionEditorForm(form) ||
    isCommercialCardGridSectionEditorForm(form)
  ) {
    const items = form.controls.items.controls.map((item, index) =>
      mapCommercialCardItemEditorForm(item, positionFor(index)),
    );

    return isCommercialSharedCardGridSectionEditorForm(form)
      ? {
          ...base,
          type: 'card_grid',
          items,
          sharedSource: form.controls.sharedSource.getRawValue(),
        }
      : { ...base, type: 'card_grid', items };
  }

  if (isCommercialPricingTableSectionEditorForm(form)) {
    return {
      ...base,
      type: 'pricing_table',
      items: form.controls.items.controls.map((item, index) =>
        mapCommercialPricingItemEditorForm(item, positionFor(index)),
      ),
    };
  }

  if (isCommercialProcessSectionEditorForm(form)) {
    return {
      ...base,
      type: 'process',
      items: form.controls.items.controls.map((item, index) =>
        mapCommercialProcessItemEditorForm(item, positionFor(index)),
      ),
    };
  }

  if (isCommercialFaqSectionEditorForm(form)) {
    return {
      ...base,
      type: 'faq',
      items: form.controls.items.controls.map((item, index) =>
        mapCommercialFaqItemEditorForm(item, positionFor(index)),
      ),
    };
  }

  if (isCommercialCtaSectionEditorForm(form)) {
    return {
      ...base,
      type: 'cta',
      body: normalizeText(form.controls.body.getRawValue()),
      action: mapCommercialActionEditorForm(form.controls.action),
    };
  }

  if (isCommercialSharedLogisticsSectionEditorForm(form)) {
    return {
      ...base,
      type: 'logistics_fees',
      items: form.controls.items.controls.map((item, index) =>
        mapCommercialPricingItemEditorForm(item, positionFor(index)),
      ),
      sharedSource: form.controls.sharedSource.getRawValue(),
    };
  }

  throw new Error('Unsupported commercial section editor form.');
}

export function isCommercialSharedSectionEditorForm(
  form: CommercialSectionEditorForm,
): form is CommercialSharedSectionEditorForm {
  return 'sharedSource' in form.controls && 'items' in form.controls;
}

export function isCommercialSharedReferenceEditorForm(
  form: CommercialSectionEditorForm,
): form is CommercialSharedReferenceEditorForm {
  return 'sharedSource' in form.controls && !('items' in form.controls);
}

export function isCommercialHeroSectionEditorForm(
  form: CommercialSectionEditorForm,
): form is CommercialHeroSectionEditorForm {
  return form.controls.type.value === 'hero';
}

export function isCommercialRichTextSectionEditorForm(
  form: CommercialSectionEditorForm,
): form is CommercialRichTextSectionEditorForm {
  return form.controls.type.value === 'rich_text';
}

function isCommercialCardGridSectionEditorForm(
  form: CommercialSectionEditorForm,
): form is CommercialCardGridSectionEditorForm {
  return form.controls.type.value === 'card_grid' &&
    !('sharedSource' in form.controls);
}

function isCommercialPricingTableSectionEditorForm(
  form: CommercialSectionEditorForm,
): form is CommercialPricingTableSectionEditorForm {
  return form.controls.type.value === 'pricing_table';
}

export function isCommercialProcessSectionEditorForm(
  form: CommercialSectionEditorForm,
): form is CommercialProcessSectionEditorForm {
  return form.controls.type.value === 'process';
}

export function isCommercialFaqSectionEditorForm(
  form: CommercialSectionEditorForm,
): form is CommercialFaqSectionEditorForm {
  return form.controls.type.value === 'faq';
}

export function isCommercialCtaSectionEditorForm(
  form: CommercialSectionEditorForm,
): form is CommercialCtaSectionEditorForm {
  return form.controls.type.value === 'cta';
}

function isCommercialLocalPricedSectionEditorForm(
  form: CommercialSectionEditorForm,
): form is CommercialLocalPricedSectionEditorForm {
  return isCommercialCardGridSectionEditorForm(form) ||
    isCommercialPricingTableSectionEditorForm(form);
}

export function isCommercialEditablePricedSectionEditorForm(
  form: CommercialSectionEditorForm,
): form is CommercialEditablePricedSectionEditorForm {
  return isCommercialLocalPricedSectionEditorForm(form) ||
    isCommercialSharedSectionEditorForm(form);
}

export function syncCommercialSectionEditorOptionalControls(
  form: CommercialSectionEditorForm,
): void {
  if (isCommercialHeroSectionEditorForm(form)) {
    setControlEnabled(
      form.controls.action,
      form.controls.hasAction.getRawValue(),
    );
    return;
  }

  if (!isCommercialEditablePricedSectionEditorForm(form)) return;

  for (const item of form.controls.items.controls) {
    const value = item.getRawValue();

    setControlEnabled(item.controls.price, value.hasPrice);
    setControlEnabled(item.controls.capacity, value.hasCapacity);
    setControlEnabled(item.controls.schedule, value.hasSchedule);

    if (value.hasSchedule) {
      syncCommercialScheduleDurationControl(item.controls.schedule);
    }
  }
}

function isCommercialSharedCardGridSectionEditorForm(
  form: CommercialSectionEditorForm,
): form is CommercialSharedCardGridSectionEditorForm {
  return isCommercialSharedSectionEditorForm(form) &&
    form.controls.type.value === 'card_grid';
}

function isCommercialSharedLogisticsSectionEditorForm(
  form: CommercialSectionEditorForm,
): form is CommercialSharedLogisticsSectionEditorForm {
  return isCommercialSharedSectionEditorForm(form) &&
    form.controls.type.value === 'logistics_fees';
}

function isCommercialSharedCardGridReferenceEditorForm(
  form: CommercialSectionEditorForm,
): form is CommercialSharedCardGridReferenceEditorForm {
  return isCommercialSharedReferenceEditorForm(form) &&
    form.controls.type.value === 'card_grid';
}

function isCommercialSharedLogisticsReferenceEditorForm(
  form: CommercialSectionEditorForm,
): form is CommercialSharedLogisticsReferenceEditorForm {
  return isCommercialSharedReferenceEditorForm(form) &&
    form.controls.type.value === 'logistics_fees';
}

function mapSectionBase(
  form: Exclude<CommercialSectionEditorForm, CommercialSharedReferenceEditorForm>,
  position: number,
) {
  return {
    id: form.controls.id.getRawValue(),
    position,
    heading: normalizeText(form.controls.heading.getRawValue()),
    lead: normalizeText(form.controls.lead.getRawValue()),
  };
}

function positionFor(index: number): number {
  return (index + 1) * 10;
}
