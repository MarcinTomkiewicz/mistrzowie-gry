export function withDefaults<T extends Record<string, unknown>>(
  input: T | undefined,
  defaults: Required<T>,
): Required<T> {
  return { ...defaults, ...(input ?? {}) };
}
