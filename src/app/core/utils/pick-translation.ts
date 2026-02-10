// path: src/app/core/utils/i18n/pick-translations.ts
import { Signal, computed } from '@angular/core';

type Picked<K extends readonly string[]> = { [P in K[number]]: string };

export function pickTranslations<
  TDict extends Record<string, unknown>,
  const K extends readonly (keyof TDict & string)[],
>(
  dictSignal: Signal<TDict>,
  keys: K,
): Signal<Picked<K>> {
  return computed(() => {
    const dict = dictSignal();
    const out = {} as Picked<K>;

    for (const key of keys) {
      // key is K[number], not plain string
      out[key] = String(dict[key] ?? '');
    }

    return out;
  });
}
