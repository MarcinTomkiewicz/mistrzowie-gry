import {
  type AbstractControlOptions,
  type ValidatorFn,
  Validators,
} from '@angular/forms';

import { matchingControlsValidator } from '../validators/form-value.validator';
import { AUTH_PASSWORD_MIN_LENGTH } from './auth.config';

export const RESET_PASSWORD_FORM_CONFIG = {
  controls: {
    password: [
      '',
      [Validators.required, Validators.minLength(AUTH_PASSWORD_MIN_LENGTH)],
    ] as [string, ValidatorFn[]],
    passwordConfirmation: [
      '',
      [Validators.required, Validators.minLength(AUTH_PASSWORD_MIN_LENGTH)],
    ] as [string, ValidatorFn[]],
  },
  options: {
    validators: matchingControlsValidator(
      'password',
      'passwordConfirmation',
      'passwordMismatch',
    ),
  } satisfies AbstractControlOptions,
};
