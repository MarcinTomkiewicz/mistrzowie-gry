import type { FormControl, FormGroup } from '@angular/forms';
import type { CoworkerDocumentRequiredAction } from './coworker-onboarding';

export type PrivateDocumentRowForm = FormGroup<{
  preset: FormControl<string | null>;
  title: FormControl<string>;
  required_action: FormControl<CoworkerDocumentRequiredAction>;
  file: FormControl<File | null>;
}>;
