import type { FormControl, FormGroup } from '@angular/forms';

export type PrivateDocumentRowForm = FormGroup<{
  preset: FormControl<string | null>;
  title: FormControl<string>;
  requires_signed_upload: FormControl<boolean>;
  file: FormControl<File | null>;
}>;
