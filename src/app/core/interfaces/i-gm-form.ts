import { FormControl, FormGroup } from '@angular/forms';

import { IGmProfileFormData } from './i-gm-profile';

export interface IGmProfileFormFactoryOptions {
  initial?: Partial<IGmProfileFormData>;
}

export type GmProfileFormGroup = FormGroup<{
  experience: FormControl<number | null>;
  description: FormControl<string | null>;
  image: FormControl<string | null>;
  quote: FormControl<string | null>;
  gmStyleIds: FormControl<string[]>;
  languageIds: FormControl<string[]>;
}>;