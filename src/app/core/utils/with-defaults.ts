export function withDefaults<T extends Record<string, any>>(
  input: T | undefined,
  defaults: Required<T>,
): Required<T> {
  return { ...defaults, ...(input ?? {}) };
}
