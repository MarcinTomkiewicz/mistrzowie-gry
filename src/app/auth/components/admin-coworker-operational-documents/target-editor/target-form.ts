import {
  AbstractControl,
  FormArray,
  FormControl,
  FormGroup,
  ValidationErrors,
  ValidatorFn,
} from '@angular/forms';

import { targetKey } from '../../../../core/contracts/admin-operational-documents/targets.contract';
import type { IAdminOperationalCatalog } from '../../../../core/interfaces/i-admin-operational-catalog';
import type { AdminOperationalTargetForm } from '../../../../core/types/admin-operational-forms';
import {
  type AdminOperationalTarget,
  type ConfigureAdminOperationalTarget,
} from '../../../../core/types/admin-operational-version';

export function activeAdminOperationalCoworkerIds(
  catalog: IAdminOperationalCatalog,
): ReadonlySet<string> {
  return new Set(
    catalog.coworkers
      .filter((coworker) => coworker.accessEnabled)
      .map((coworker) => coworker.userId),
  );
}

export function createAdminOperationalTargetForm(
  target: AdminOperationalTarget | null,
  activeCoworkerIds: ReadonlySet<string>,
): AdminOperationalTargetForm {
  return new FormGroup(
    {
      targetKind: new FormControl(target?.targetKind ?? 'all_active_coworkers', {
        nonNullable: true,
      }),
      appRole: new FormControl(target?.appRole ?? null),
      userId: new FormControl(target?.userId ?? null, {
        validators: activeCoworkerValidator(activeCoworkerIds),
      }),
      eventDefinitionId: new FormControl(target?.eventDefinitionId ?? null),
    },
    { validators: targetSelectorValidator() },
  );
}

export function refreshTargetCoworkerValidators(
  targets: FormArray<AdminOperationalTargetForm>,
  catalog: IAdminOperationalCatalog,
): void {
  const activeCoworkerIds = activeAdminOperationalCoworkerIds(catalog);
  targets.controls.forEach((target) => {
    target.controls.userId.setValidators(
      activeCoworkerValidator(activeCoworkerIds),
    );
    target.controls.userId.updateValueAndValidity({ emitEvent: false });
  });
  targets.updateValueAndValidity({ emitEvent: false });
}

export function resetAdminOperationalTargetSelector(
  form: AdminOperationalTargetForm,
): void {
  form.patchValue(
    { appRole: null, userId: null, eventDefinitionId: null },
    { emitEvent: false },
  );
  form.updateValueAndValidity();
}

export function mapAdminOperationalTarget(
  target: ReturnType<AdminOperationalTargetForm['getRawValue']>,
): ConfigureAdminOperationalTarget {
  switch (target.targetKind) {
    case 'all_active_coworkers':
      return {
        targetKind: target.targetKind,
        appRole: null,
        userId: null,
        eventDefinitionId: null,
      };
    case 'app_role':
      return {
        targetKind: target.targetKind,
        appRole: requiredSelector(target.appRole),
        userId: null,
        eventDefinitionId: null,
      };
    case 'user':
      return {
        targetKind: target.targetKind,
        appRole: null,
        userId: requiredSelector(target.userId),
        eventDefinitionId: null,
      };
    case 'event_definition':
      return {
        targetKind: target.targetKind,
        appRole: null,
        userId: null,
        eventDefinitionId: requiredSelector(target.eventDefinitionId),
      };
  }
}

export function uniqueAdminOperationalTargetsValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!(control instanceof FormArray)) return null;
    const keys = control.controls.map((target) =>
      targetKey(target.getRawValue()),
    );
    return new Set(keys).size === keys.length ? null : { uniqueTargets: true };
  };
}

function targetSelectorValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const kind: unknown = control.get('targetKind')?.value;
    const appRole = control.get('appRole')?.value;
    const userId = control.get('userId')?.value;
    const eventDefinitionId = control.get('eventDefinitionId')?.value;
    const valid =
      (kind === 'all_active_coworkers' && appRole === null && userId === null && eventDefinitionId === null) ||
      (kind === 'app_role' && appRole !== null && userId === null && eventDefinitionId === null) ||
      (kind === 'user' && appRole === null && userId !== null && eventDefinitionId === null) ||
      (kind === 'event_definition' && appRole === null && userId === null && eventDefinitionId !== null);
    return valid ? null : { targetSelector: true };
  };
}

function activeCoworkerValidator(
  activeCoworkerIds: ReadonlySet<string>,
): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value: unknown = control.value;
    return value === null ||
      (typeof value === 'string' && activeCoworkerIds.has(value))
      ? null
      : { activeCoworker: true };
  };
}

function requiredSelector<T>(value: T | null): T {
  if (value === null) {
    throw new Error('A target selector is required for the selected target kind.');
  }
  return value;
}
