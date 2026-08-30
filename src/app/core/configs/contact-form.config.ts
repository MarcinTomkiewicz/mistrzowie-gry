import { type ValidatorFn, Validators } from '@angular/forms';

export const CONTACT_FORM_CONFIG = {
  topic: ['business', Validators.required] as [string, ValidatorFn],
  topicCustom: '',
  firstName: ['', Validators.required] as [string, ValidatorFn],
  lastName: ['', Validators.required] as [string, ValidatorFn],
  companyName: '',
  email: ['', [Validators.required, Validators.email]] as [
    string,
    ValidatorFn[],
  ],
  phone: '',
  message: ['', [Validators.required, Validators.minLength(20)]] as [
    string,
    ValidatorFn[],
  ],
  website: '',
};
