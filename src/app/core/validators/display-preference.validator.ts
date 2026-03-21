import { AbstractControl, ValidationErrors, ValidatorFn } from "@angular/forms";
import { normalizeText } from "../utils/normalize-text";

export function displayPreferenceValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const firstName = normalizeText(control.get('firstName')?.value);
    const nickname = normalizeText(control.get('nickname')?.value);
    const useNickname = !!control.get('useNickname')?.value;

    if (useNickname && !nickname) {
      return { invalidDisplayPreference: true };
    }

    if (!useNickname && !!nickname && !firstName) {
      return { invalidDisplayPreference: true };
    }

    return null;
  };
}