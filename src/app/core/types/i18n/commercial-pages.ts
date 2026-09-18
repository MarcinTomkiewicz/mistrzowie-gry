import type { CommercialProductFieldKey } from '../commercial-product';
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
  frequency: {
    oneTime: string;
    weeklyOnce: string;
    weeklyMany: string;
    monthlyOnce: string;
    monthlyMany: string;
  };
  cooperationLength: {
    oneTime: string;
    minimum: string;
    semesters: PluralNumberTranslations;
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
