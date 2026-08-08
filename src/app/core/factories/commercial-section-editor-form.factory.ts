import { FormArray, FormControl, FormGroup, Validators } from '@angular/forms';

import type {
  CommercialPageKey,
  CommercialSectionType,
} from '../types/commercial-page';
import type { CommercialPageAdminSection } from '../types/commercial-page-admin';
import type {
  CommercialLocalPricedSectionEditorForm,
  CommercialSectionEditorForm,
} from '../types/commercial-page-editor-form';
import { requiredTrimmedValidator } from '../validators/required-trimmed.validator';
import {
  createCommercialActionEditorForm,
  createCommercialFaqItemEditorForm,
  createCommercialPricedItemEditorForm,
  createCommercialProcessItemEditorForm,
} from './commercial-item-editor-form.factory';
import {
  createCommercialSharedReferenceEditorForm,
  createCommercialSharedSectionEditorForm,
  createNewCommercialSharedSectionEditorForm,
  isCommercialPageAdminSharedSection,
  isStoredCommercialSharedReference,
} from './commercial-shared-section-editor-form.factory';

const requiredTextValidators = [requiredTrimmedValidator()];

export function createCommercialSectionEditorForm(
  section: CommercialPageAdminSection,
): CommercialSectionEditorForm {
  if (isCommercialPageAdminSharedSection(section)) {
    return createCommercialSharedSectionEditorForm(
      section,
      createSectionBaseControls(section),
    );
  }

  if (isStoredCommercialSharedReference(section)) {
    return createCommercialSharedReferenceEditorForm(
      section.id,
      section.sharedSource,
    );
  }

  const base = createSectionBaseControls(section);

  switch (section.type) {
    case 'hero': {
      const action = createCommercialActionEditorForm(
        section.action,
        !!section.action,
      );

      return new FormGroup({
        ...base,
        type: literalControl('hero'),
        body: textControl(section.body),
        hasAction: new FormControl(!!section.action, { nonNullable: true }),
        action,
      });
    }
    case 'rich_text':
      return new FormGroup({
        ...base,
        type: literalControl('rich_text'),
        body: requiredTextControl(section.body),
      });
    case 'card_grid':
      return new FormGroup({
        ...base,
        type: literalControl('card_grid'),
        items: new FormArray(
          section.items.map((item) =>
            createCommercialPricedItemEditorForm(item),
          ),
          { validators: [Validators.required] },
        ),
      });
    case 'pricing_table':
      return new FormGroup({
        ...base,
        type: literalControl('pricing_table'),
        items: new FormArray(
          section.items.map((item) =>
            createCommercialPricedItemEditorForm(item, true),
          ),
          { validators: [Validators.required] },
        ),
      });
    case 'process':
      return new FormGroup({
        ...base,
        type: literalControl('process'),
        items: new FormArray(
          section.items.map(createCommercialProcessItemEditorForm),
          { validators: [Validators.required] },
        ),
      });
    case 'faq':
      return new FormGroup({
        ...base,
        type: literalControl('faq'),
        items: new FormArray(
          section.items.map(createCommercialFaqItemEditorForm),
          { validators: [Validators.required] },
        ),
      });
    case 'cta':
      return new FormGroup({
        ...base,
        type: literalControl('cta'),
        body: textControl(section.body),
        action: createCommercialActionEditorForm(section.action),
      });
  }
}

export function createNewCommercialSectionEditorForm(
  type: CommercialSectionType,
  pageKey: CommercialPageKey,
  locale: string,
): CommercialSectionEditorForm {
  if (type === 'logistics_fees' && pageKey !== 'standards-logistics') {
    throw new Error(
      'logistics_fees can only be created for standards-logistics.',
    );
  }

  const id = crypto.randomUUID();

  if (pageKey === 'standards-logistics' && type === 'card_grid') {
    return createNewCommercialSharedSectionEditorForm(
      { key: 'standards', locale, sectionType: type },
      createSectionBaseControls({ id }),
    );
  }

  if (type === 'logistics_fees') {
    const source = { key: 'logistics', locale, sectionType: type } as const;

    return createNewCommercialSharedSectionEditorForm(
      source,
      createSectionBaseControls({ id }),
    );
  }

  const base = createSectionBaseControls({ id });

  switch (type) {
    case 'hero':
      return new FormGroup({
        ...base,
        type: literalControl(type),
        body: textControl(null),
        hasAction: new FormControl(false, { nonNullable: true }),
        action: createCommercialActionEditorForm(null, false),
      });
    case 'rich_text':
      return new FormGroup({
        ...base,
        type: literalControl(type),
        body: requiredTextControl(''),
      });
    case 'card_grid':
      return createNewPricedSectionForm(type, base, false);
    case 'pricing_table':
      return createNewPricedSectionForm(type, base, true);
    case 'process':
      return new FormGroup({
        ...base,
        type: literalControl(type),
        items: requiredItems([createCommercialProcessItemEditorForm()]),
      });
    case 'faq':
      return new FormGroup({
        ...base,
        type: literalControl(type),
        items: requiredItems([createCommercialFaqItemEditorForm()]),
      });
    case 'cta':
      return new FormGroup({
        ...base,
        type: literalControl(type),
        body: textControl(null),
        action: createCommercialActionEditorForm(),
      });
  }
}

function createSectionBaseControls(section: {
  id: string;
  heading?: string | null;
  lead?: string | null;
}) {
  return {
    id: new FormControl(section.id, { nonNullable: true }),
    heading: textControl(section.heading ?? null),
    lead: textControl(section.lead ?? null),
  };
}

function createNewPricedSectionForm(
  type: 'card_grid' | 'pricing_table',
  base: ReturnType<typeof createSectionBaseControls>,
  priceRequired: boolean,
): CommercialLocalPricedSectionEditorForm {
  const items = requiredItems([
    createCommercialPricedItemEditorForm(null, priceRequired),
  ]);

  switch (type) {
    case 'card_grid':
      return new FormGroup({ ...base, type: literalControl(type), items });
    case 'pricing_table':
      return new FormGroup({ ...base, type: literalControl(type), items });
  }
}

function requiredItems<TControl extends FormGroup>(controls: TControl[]) {
  return new FormArray(controls, { validators: [Validators.required] });
}

function literalControl<TValue extends string>(value: TValue) {
  return new FormControl(value, { nonNullable: true });
}

function textControl(value: string | null) {
  return new FormControl(value ?? '', { nonNullable: true });
}

function requiredTextControl(value: string) {
  return new FormControl(value, {
    nonNullable: true,
    validators: requiredTextValidators,
  });
}
