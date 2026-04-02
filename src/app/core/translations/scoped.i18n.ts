import { computed, Signal } from '@angular/core';
import { translateObjectSignal } from '@jsverse/transloco';

export function createScopedObjectI18n<T>(
  scope: string,
  key: string,
): Signal<T> {
  const dict = translateObjectSignal(key, {}, { scope });

  return computed(() => dict() as T);
}

type ScopedSectionSignals<TSections extends Record<string, unknown>> = {
  [K in keyof TSections]: Signal<TSections[K]>;
};

export function createScopedSectionsI18n<
  TSections extends Record<string, unknown>,
>(
  scope: string,
  keys: { [K in keyof TSections]: string },
): ScopedSectionSignals<TSections> {
  const entries = Object.entries(keys) as [keyof TSections, string][];
  const translations = translateObjectSignal(
    entries.map(([, key]) => key),
    {},
    { scope },
  );

  return entries.reduce(
    (acc, [name], index) => {
      acc[name] = computed(
        () => (translations()[index] ?? {}) as TSections[typeof name],
      );
      return acc;
    },
    {} as ScopedSectionSignals<TSections>,
  );
}
