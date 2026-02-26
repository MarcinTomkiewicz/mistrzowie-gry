import { AnyDict } from "../types/any-dict";
import { DisplayFaqItem } from "../types/faq-items";

export function normalizeDisplayItems<T>(itemsUnknown: unknown): T[] {
  if (!itemsUnknown) return [];
  if (Array.isArray(itemsUnknown)) return itemsUnknown as T[];

  if (typeof itemsUnknown === 'object') {
    return Object.values(itemsUnknown as AnyDict) as T[];
  }

  return [];
}

export function normalizeFaqItems(itemsUnknown: unknown): DisplayFaqItem[] {
  return normalizeDisplayItems<DisplayFaqItem>(itemsUnknown);
}