import type { CommercialProductPrice } from './commercial-product';
import type { Price } from './price';
import type { RichContent } from './rich-content';

export type CommercialProductFieldPresentation =
  | { type: 'text'; value: string }
  | { type: 'rich_content'; value: RichContent }
  | { type: 'price'; value: Price }
  | { type: 'prices'; value: CommercialProductPrice[] };
