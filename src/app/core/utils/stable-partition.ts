export function stablePartition<T>(
  items: readonly T[],
  predicate: (item: T) => boolean,
): T[] {
  const matching: T[] = [];
  const remaining: T[] = [];

  for (const item of items) {
    if (predicate(item)) {
      matching.push(item);
    } else {
      remaining.push(item);
    }
  }

  return [...matching, ...remaining];
}
