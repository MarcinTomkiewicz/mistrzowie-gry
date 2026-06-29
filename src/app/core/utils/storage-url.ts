import { IPublicStorageUrlResolver } from '../interfaces/i-storage';
import { normalizeText } from './normalize-text';

export function resolvePublicStorageUrl(
  storage: IPublicStorageUrlResolver,
  pathOrUrl: string | null | undefined,
  bucket = 'images',
): string | null {
  const normalized = normalizeText(pathOrUrl);

  if (!normalized) {
    return null;
  }

  if (/^https?:\/\//i.test(normalized)) {
    return normalized;
  }

  return storage.getPublicUrl(normalized, bucket);
}
