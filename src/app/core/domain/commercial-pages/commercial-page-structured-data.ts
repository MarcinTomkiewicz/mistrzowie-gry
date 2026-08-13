import type { ISeoStructuredDataNode } from '../../interfaces/i-seo';
import type { CommercialPageBuilderDocument } from '../../types/commercial-page-builder';
import { createPageStructuredData } from '../../utils/structured-data';

export function createCommercialPageStructuredData(
  document: CommercialPageBuilderDocument,
  canonicalUrl: string,
): ISeoStructuredDataNode {
  return createPageStructuredData({
    type: document.page.kind === 'offer' ? 'CollectionPage' : 'WebPage',
    id: `${canonicalUrl}#webpage`,
    url: canonicalUrl,
    name: document.page.seo.title,
    description: document.page.seo.description,
  });
}
