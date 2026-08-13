import { FormControl } from '@angular/forms';

export function createUuidFormControl(
  value: string | null | undefined = null,
): FormControl<string> {
  return new FormControl(value ?? crypto.randomUUID(), { nonNullable: true });
}
