import { SITE_URL } from '../../config/site';
import { assertEdgeContract, readEdgeString } from '../../utils/edge-contract';
import { createStrictEdgeObjectReader } from '../../utils/strict-edge-contract';

const readRedirect = createStrictEdgeObjectReader({ path: readEdgeString });

export function readPublicContentArticleRedirect(
  value: unknown,
  requestedSlug: string,
): string | null {
  if (value === null) return null;

  const { path } = readRedirect(value, 'articleRedirect');
  const target = new URL(path, SITE_URL);
  assertEdgeContract(
    target.origin === SITE_URL && target.pathname === path &&
      /^\/artykuly\/[a-z0-9]+(?:-+[a-z0-9]+)*$/.test(path) &&
      path !== `/artykuly/${requestedSlug}`,
    'articleRedirect.path',
    'a safe article path different from the requested path',
  );
  return path;
}
