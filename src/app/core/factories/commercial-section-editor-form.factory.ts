import { FormArray, FormControl, FormGroup } from '@angular/forms';

import type { CommercialBuilderSection } from '../types/commercial-page-builder';
import type { CommercialSectionEditorForm } from '../types/commercial-page-editor-form';
import { normalizeText } from '../utils/normalize-text';
import { createCommercialBlockEditorForm } from './commercial-block-editor-form.factory';
import { mapCommercialPageBlockEditorForm } from './commercial-block-editor-form.mapper';

export function createCommercialSectionEditorForm(
  section: CommercialBuilderSection | null = null,
): CommercialSectionEditorForm {
  return new FormGroup({
    id: new FormControl(section?.id ?? crypto.randomUUID(), {
      nonNullable: true,
    }),
    heading: new FormControl(section?.heading ?? '', { nonNullable: true }),
    lead: new FormControl(section?.lead ?? '', { nonNullable: true }),
    surface: new FormControl(section?.presentation.surface ?? 'plain', {
      nonNullable: true,
    }),
    textAlign: new FormControl(section?.presentation.textAlign ?? 'left', {
      nonNullable: true,
    }),
    blocks: new FormArray(
      section
        ? [...section.blocks]
            .sort(byPosition)
            .map(createCommercialBlockEditorForm)
        : [],
    ),
  });
}

export function mapCommercialSectionEditorForm(
  form: CommercialSectionEditorForm,
  position: number,
): CommercialBuilderSection {
  const value = form.getRawValue();

  return {
    id: value.id,
    position,
    heading: normalizeText(value.heading),
    lead: normalizeText(value.lead),
    presentation: {
      surface: value.surface,
      textAlign: value.textAlign,
    },
    blocks: form.controls.blocks.controls.map((block, index) =>
      mapCommercialPageBlockEditorForm(block, (index + 1) * 10),
    ),
  };
}

function byPosition(
  left: { position: number },
  right: { position: number },
): number {
  return left.position - right.position;
}
