import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export function sessionPlayersRangeValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const minPlayers = Number(control.get('minPlayers')?.value);
    const maxPlayers = Number(control.get('maxPlayers')?.value);

    if (Number.isNaN(minPlayers) || Number.isNaN(maxPlayers)) {
      return null;
    }

    return minPlayers <= maxPlayers ? null : { invalidPlayersRange: true };
  };
}