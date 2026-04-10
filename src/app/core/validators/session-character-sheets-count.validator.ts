import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export function sessionCharacterSheetsCountValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const hasReadyCharacterSheets = control.get('hasReadyCharacterSheets')?.value;
    const maxPlayers = control.get('maxPlayers')?.value;
    const characterSheetsCount = control.get('characterSheetsCount')?.value;

    if (!hasReadyCharacterSheets) {
      return null;
    }

    if (
      typeof maxPlayers !== 'number' ||
      typeof characterSheetsCount !== 'number' ||
      characterSheetsCount >= maxPlayers
    ) {
      return null;
    }

    return { invalidCharacterSheetsCount: true };
  };
}
