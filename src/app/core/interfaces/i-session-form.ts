import { FormControl, FormGroup } from '@angular/forms';

import { ISessionFormData } from './i-session';
import { SessionDifficultyLevel } from '../types/sessions';

export interface ISessionFormFactoryOptions {
  initial?: Partial<ISessionFormData>;
}

export type SessionFormGroup = FormGroup<{
  systemId: FormControl<string | null>;
  title: FormControl<string | null>;
  description: FormControl<string | null>;
  image: FormControl<string | null>;
  difficultyLevel: FormControl<SessionDifficultyLevel | null>;
  minPlayers: FormControl<number | null>;
  maxPlayers: FormControl<number | null>;
  minAge: FormControl<number | null>;
  hasReadyCharacterSheets: FormControl<boolean>;
  allowsScenarioCustomization: FormControl<boolean>;
  languageIds: FormControl<string[]>;
  characterSheetsCount: FormControl<number | null>;
  triggerIds: FormControl<string[]>;
  gmStyleIds: FormControl<string[]>;
  sortOrder: FormControl<number | null>;
}>;
