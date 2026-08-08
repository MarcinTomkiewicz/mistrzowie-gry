import { FormArray, FormControl, FormGroup, Validators } from '@angular/forms';

import type {
  CommercialSharedSource,
  StoredCommercialSharedSection,
} from '../types/commercial-page';
import type {
  CommercialPageAdminSection,
  CommercialPageAdminSharedCardGridSection,
  CommercialPageAdminSharedLogisticsSection,
} from '../types/commercial-page-admin';
import type {
  CommercialSharedReferenceEditorForm,
  CommercialSharedSectionEditorForm,
} from '../types/commercial-page-editor-form';
import { createCommercialPricedItemEditorForm } from './commercial-item-editor-form.factory';

type CommercialPageAdminSharedSection =
  | CommercialPageAdminSharedCardGridSection
  | CommercialPageAdminSharedLogisticsSection;

type StoredSharedReference =
  | StoredCommercialSharedSection<'card_grid'>
  | StoredCommercialSharedSection<'logistics_fees'>;

type SectionBaseControls = {
  id: FormControl<string>;
  heading: FormControl<string>;
  lead: FormControl<string>;
};

export function isCommercialPageAdminSharedSection(
  section: CommercialPageAdminSection,
): section is CommercialPageAdminSharedSection {
  return 'sharedSource' in section &&
    !!section.sharedSource &&
    'items' in section;
}

export function isStoredCommercialSharedReference(
  section: CommercialPageAdminSection,
): section is StoredSharedReference {
  return 'sharedSource' in section &&
    !!section.sharedSource &&
    !('items' in section);
}

export function createCommercialSharedSectionEditorForm(
  section: CommercialPageAdminSharedSection,
  base: SectionBaseControls,
): CommercialSharedSectionEditorForm {
  if (section.type === 'card_grid') {
    return new FormGroup({
      ...base,
      type: literalControl(section.type),
      items: requiredItems(
        section.items.map((item) =>
          createCommercialPricedItemEditorForm(item),
        ),
      ),
      sharedSource: new FormControl(section.sharedSource, {
        nonNullable: true,
      }),
    });
  }

  return new FormGroup({
    ...base,
    type: literalControl(section.type),
    items: requiredItems(
      section.items.map((item) =>
        createCommercialPricedItemEditorForm(item, true),
      ),
    ),
    sharedSource: new FormControl(section.sharedSource, {
      nonNullable: true,
    }),
  });
}

export function createNewCommercialSharedSectionEditorForm(
  source: CommercialSharedSource,
  base: SectionBaseControls,
): CommercialSharedSectionEditorForm {
  if (source.sectionType === 'card_grid') {
    return new FormGroup({
      ...base,
      type: literalControl(source.sectionType),
      items: requiredItems([createCommercialPricedItemEditorForm()]),
      sharedSource: new FormControl(source, { nonNullable: true }),
    });
  }

  return new FormGroup({
    ...base,
    type: literalControl(source.sectionType),
    items: requiredItems([createCommercialPricedItemEditorForm(null, true)]),
    sharedSource: new FormControl(source, { nonNullable: true }),
  });
}

export function createCommercialSharedReferenceEditorForm(
  id: string,
  source: CommercialSharedSource,
): CommercialSharedReferenceEditorForm {
  if (source.sectionType === 'card_grid') {
    return new FormGroup({
      id: new FormControl(id, { nonNullable: true }),
      type: literalControl(source.sectionType),
      sharedSource: new FormControl(source, { nonNullable: true }),
    });
  }

  return new FormGroup({
    id: new FormControl(id, { nonNullable: true }),
    type: literalControl(source.sectionType),
    sharedSource: new FormControl(source, { nonNullable: true }),
  });
}

function requiredItems(
  controls: ReturnType<typeof createCommercialPricedItemEditorForm>[],
) {
  return new FormArray(controls, { validators: [Validators.required] });
}

function literalControl<TValue extends string>(value: TValue) {
  return new FormControl(value, { nonNullable: true });
}
