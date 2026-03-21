import { AbstractControl, ValidationErrors, ValidatorFn } from "@angular/forms";
import { normalizeText } from "../utils/normalize-text";

export function profileIdentityValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const firstName = normalizeText(control.get('firstName')?.value);
    const nickname = normalizeText(control.get('nickname')?.value);

    return firstName || nickname ? null : { displayNameRequired: true };
  };
}