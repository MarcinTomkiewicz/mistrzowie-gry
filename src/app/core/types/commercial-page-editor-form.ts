import type { FormArray, FormControl, FormGroup } from '@angular/forms';

import type { CommercialPageBlockEditorForm } from './commercial-builder-block-editor-form';
import type {
  CommercialSectionSurface,
  CommercialTextAlign,
} from './commercial-page-builder';
import type {
  CommercialCooperationLength,
  CommercialEditorDuration,
  CommercialEditorParticipants,
  CommercialFrequency,
  CommercialProductKind,
  CommercialSessionCount,
} from './commercial-product';
import type { PriceEditorForm } from './price-editor-form';
import type { RichContentEditorControl } from './rich-content-editor';

export type CommercialPageMetadataEditorForm = FormGroup<{
  slug: FormControl<string>;
  heading: FormControl<string>;
  lead: FormControl<string>;
}>;

export type CommercialPageSeoEditorForm = FormGroup<{
  title: FormControl<string>;
  description: FormControl<string>;
  ogTitle: FormControl<string>;
  ogDescription: FormControl<string>;
}>;

export type CommercialProductPriceEditorForm = FormGroup<{
  price: PriceEditorForm;
  label: FormControl<string>;
  primary: FormControl<boolean>;
}>;

export type CommercialProductEditorForm = FormGroup<{
  id: FormControl<string>;
  kind: FormControl<CommercialProductKind>;
  name: FormControl<string>;
  description: RichContentEditorControl;
  prices: FormArray<CommercialProductPriceEditorForm>;
  settlement: FormControl<string>;
  durationMode: FormControl<CommercialEditorDuration['mode']>;
  durationMinutes: FormControl<number | null>;
  participantsMode: FormControl<CommercialEditorParticipants['mode']>;
  participantsMin: FormControl<number | null>;
  participantsMax: FormControl<number | null>;
  participantsPerFacilitatorMax: FormControl<number | null>;
  sessionsMode: FormControl<CommercialSessionCount['mode']>;
  sessionsCount: FormControl<number | null>;
  frequencyMode: FormControl<CommercialFrequency['mode']>;
  frequencyCount: FormControl<number | null>;
  cooperationLengthMode: FormControl<CommercialCooperationLength['mode']>;
  cooperationLengthSemesters: FormControl<number | null>;
  meetingCountMin: FormControl<number | null>;
  meetingCountMax: FormControl<number | null>;
  facilitatorCount: FormControl<number | null>;
  tableCount: FormControl<number | null>;
  includedAddonIds: FormControl<string[]>;
}>;

export type CommercialSectionEditorForm = FormGroup<{
  id: FormControl<string>;
  heading: FormControl<string>;
  lead: FormControl<string>;
  surface: FormControl<CommercialSectionSurface>;
  textAlign: FormControl<CommercialTextAlign>;
  blocks: FormArray<CommercialPageBlockEditorForm>;
}>;

export type CommercialPageEditorForm = FormGroup<{
  metadata: CommercialPageMetadataEditorForm;
  seo: CommercialPageSeoEditorForm;
  products: FormArray<CommercialProductEditorForm>;
  sections: FormArray<CommercialSectionEditorForm>;
}>;
