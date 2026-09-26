import type { InternalLinkMarkupLinkNode } from '../../types/internal-link';

export function parseRichContentLinkTarget(
  source: string,
): Pick<InternalLinkMarkupLinkNode, 'href' | 'external'> | null {
  const target = /^([^\s\[\]]+)(?: external=(true|false))?$/.exec(source);
  return target ? {
    href: target[1],
    ...(target[2] === undefined ? {} : { external: target[2] === 'true' }),
  } : null;
}

export function isValidRichContentLinkHref(href: string): boolean {
  return parseRichContentLinkTarget(href)?.href === href;
}
