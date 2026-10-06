import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

import type { ISession } from '../interfaces/i-session';

export function sessionPlayersRangeValidator(baseSession?: Pick<ISession, 'minPlayers' | 'maxPlayers'>): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const minValue = control.get('minPlayers')?.value;
    const maxValue = control.get('maxPlayers')?.value;
    const minPlayers = Number(baseSession ? minValue ?? baseSession.minPlayers : minValue);
    const maxPlayers = Number(baseSession ? maxValue ?? baseSession.maxPlayers : maxValue);

    if (Number.isNaN(minPlayers) || Number.isNaN(maxPlayers)) {
      return null;
    }

    return minPlayers <= maxPlayers ? null : { invalidPlayersRange: true };
  };
}
