import type { CommercialProductFieldKey } from '../commercial-page-builder';
import type { DurationTranslations } from '../duration-format';
import type {
  NumberRangeTranslations,
  PluralNumberTranslations,
} from '../number-format';

export type CommercialPageLabelsTranslations = {
  effectiveFrom: string;
};

export type CommercialProductValueTranslations = NumberRangeTranslations & {
  duration: DurationTranslations;
  sessions: {
    count: PluralNumberTranslations;
    perMonth: string;
  };
};

export type CommercialProductFieldLabelsTranslations = Record<
  CommercialProductFieldKey,
  string
>;
