export function recordValuesSortedBy<T>(
  record: Record<string, T> | null | undefined,
  getOrder: (item: T, key: string) => number,
): T[] {
  if (!record) return [];

  return Object.entries(record)
    .sort(([leftKey, left], [rightKey, right]) =>
      getOrder(left, leftKey) - getOrder(right, rightKey),
    )
    .map(([, item]) => item);
}

export function numberedRecordToStringArray(
  record: Record<string, unknown> | null | undefined,
): string[] {
  if (!record) return [];

  return Object.entries(record)
    .map(([key, value]) => ({ key: Number(key), value: String(value ?? '') }))
    .filter(({ key }) => Number.isFinite(key))
    .sort((left, right) => left.key - right.key)
    .map(({ value }) => value);
}
