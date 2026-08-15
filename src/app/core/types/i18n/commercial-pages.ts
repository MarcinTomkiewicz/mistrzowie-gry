import type { CommercialProductFieldKey } from '../commercial-page-builder';
import type { DurationTranslations } from '../duration-format';
import type { PluralNumberTranslations } from '../number-format';

export type CommercialPageLabelsTranslations = {
  effectiveFrom: string;
};

export type CommercialProductValueTranslations = {
  duration: DurationTranslations;
  sessions: {
    count: PluralNumberTranslations;
    perMonth: string;
  };
};

export type CommercialProductFieldLabelsTranslations = Record<
  Exclude<
    CommercialProductFieldKey,
    | 'name'
    | 'description'
    | 'price'
    | 'duration'
    | 'participants'
    | 'facilitatorCount'
    | 'tableCount'
  >,
  string
>;
