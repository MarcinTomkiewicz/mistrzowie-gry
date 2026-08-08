import type { FormControl, FormGroup } from '@angular/forms';

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

export type CommercialPageEditorForm = FormGroup<{
  metadata: CommercialPageMetadataEditorForm;
  seo: CommercialPageSeoEditorForm;
}>;
