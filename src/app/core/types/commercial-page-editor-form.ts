import type { FormArray, FormControl, FormGroup } from '@angular/forms';

import type { CommercialPageBlockEditorForm } from './commercial-builder-block-editor-form';
import type {
  CommercialEditorDuration,
  CommercialEditorParticipants,
  CommercialSectionSurface,
  CommercialTextAlign,
} from './commercial-page-builder';
import type { CommercialPriceEditorForm } from './commercial-price-editor-form';
import type { CommercialRichContentEditorControl } from './commercial-rich-content-editor-form';

export type CommercialPageMetadataEditorForm = FormGroup<{
  heading: FormControl<string>;
  lead: FormControl<string>;
}>;

export type CommercialPageSeoEditorForm = FormGroup<{
  title: FormControl<string>;
  description: FormControl<string>;
  ogTitle: FormControl<string>;
  ogDescription: FormControl<string>;
  canonicalUrl: FormControl<string>;
}>;

export type CommercialProductEditorForm = FormGroup<{
  id: FormControl<string>;
  name: FormControl<string>;
  description: CommercialRichContentEditorControl;
  price: CommercialPriceEditorForm;
  durationMode: FormControl<CommercialEditorDuration['mode']>;
  durationMinutes: FormControl<number | null>;
  participantsMode: FormControl<CommercialEditorParticipants['mode']>;
  participantsMin: FormControl<number | null>;
  participantsMax: FormControl<number | null>;
  participantsPerFacilitatorMax: FormControl<number | null>;
  sessions: FormControl<number | null>;
  sessionsPerMonth: FormControl<number | null>;
  meetingCountMin: FormControl<number | null>;
  meetingCountMax: FormControl<number | null>;
  facilitatorCount: FormControl<number | null>;
  tableCount: FormControl<number | null>;
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
