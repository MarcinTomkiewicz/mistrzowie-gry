export function toCamelCase<T>(value: unknown): T {
  if (Array.isArray(value)) {
    return value.map((item) => toCamelCase<unknown>(item)) as T;
  }

  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [
        key.replace(/_([a-z])/g, (_, char: string) => char.toUpperCase()),
        toCamelCase<unknown>(item),
      ]),
    ) as T;
  }

  return value as T;
}

export function toSnakeCase<T>(value: unknown): T {
  if (Array.isArray(value)) {
    return value.map((item) => toSnakeCase<unknown>(item)) as T;
  }

  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [
        toSnakeKey(key),
        toSnakeCase<unknown>(item),
      ]),
    ) as T;
  }

  return value as T;
}

export function toSnakeKey(key: string): string {
  return key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}
