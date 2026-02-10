import { IconTech } from "../types/icon-tech";

type AnyDict = Record<string, any>;

export function dictToSortedArray<T>(
  dict: unknown,
  getId: (item: any, key: string) => number,
): T[] {
  if (!dict || typeof dict !== 'object') return [];

  return Object.entries(dict as AnyDict)
    .map(([key, item]) => ({ key, item }))
    .sort((a, b) => getId(a.item, a.key) - getId(b.item, b.key))
    .map(({ item }) => item as T);
}

export function numberedDictToStringArray(dict: unknown): string[] {
  if (!dict || typeof dict !== 'object') return [];

  return Object.entries(dict as AnyDict)
    .map(([k, v]) => ({ kNum: Number(k), v: String(v ?? '') }))
    .filter((x) => Number.isFinite(x.kNum))
    .sort((a, b) => a.kNum - b.kNum)
    .map((x) => x.v);
}


export function withIcons<T extends { id: number }>(
  list: T[],
  icons: readonly IconTech[],
): Array<T & { icon: string }> {
  const byId = new Map<number, string>(icons.map((x) => [x.id, x.icon]));
  return list
    .map((x) => {
      const icon = byId.get(Number((x as any)?.id ?? 0));
      if (!icon) return null;
      return { ...x, icon };
    })
    .filter((x): x is T & { icon: string } => !!x);
}