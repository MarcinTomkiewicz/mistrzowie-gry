import type { FormArray, FormControl, FormGroup } from '@angular/forms';

import type {
  CommercialActionAppearance,
  CommercialDurationMode,
  CommercialSectionType,
  CommercialSharedSource,
} from './commercial-page';
import type {
  CommercialActualCostBasis,
  CommercialBillingUnit,
  CommercialPercentageBasis,
  CommercialPriceType,
} from './commercial-price';

export type CommercialPageMetadataEditorForm = FormGroup<{
  heading: FormControl<string>;
  lead: FormControl<string>;
}>;

export type CommercialPageSeoEditorForm = FormGroup<{
  title: FormControl<string>;
  description: FormControl<string>;
  ogTitle: FormControl<string>;
  ogDescription: FormControl<string>;
  canonicalUrl: FormControl<string>;
}>;

export type CommercialActionEditorForm = FormGroup<{
  label: FormControl<string>;
  route: FormControl<string>;
  appearance: FormControl<CommercialActionAppearance>;
}>;

export type CommercialPriceEditorForm = FormGroup<{
  type: FormControl<CommercialPriceType>;
  amount: FormControl<number | null>;
  minAmount: FormControl<number | null>;
  maxAmount: FormControl<number | null>;
  unit: FormControl<CommercialBillingUnit>;
  value: FormControl<number | null>;
  minValue: FormControl<number | null>;
  maxValue: FormControl<number | null>;
  percentageBasis: FormControl<CommercialPercentageBasis>;
  actualCostBasis: FormControl<CommercialActualCostBasis>;
  note: FormControl<string>;
}>;

export type CommercialCapacityEditorForm = FormGroup<{
  participantsMin: FormControl<number | null>;
  participantsMax: FormControl<number | null>;
  participantsPerFacilitatorMax: FormControl<number | null>;
  facilitatorCount: FormControl<number | null>;
  tableCount: FormControl<number | null>;
}>;

export type CommercialScheduleEditorForm = FormGroup<{
  durationMode: FormControl<CommercialDurationMode>;
  durationMinutes: FormControl<number | null>;
  sessionCount: FormControl<number | null>;
  sessionsPerMonth: FormControl<number | null>;
  meetingCountMin: FormControl<number | null>;
  meetingCountMax: FormControl<number | null>;
}>;

export type CommercialPricedItemEditorForm = FormGroup<{
  id: FormControl<string>;
  title: FormControl<string>;
  body: FormControl<string>;
  hasPrice: FormControl<boolean>;
  price: CommercialPriceEditorForm;
  hasCapacity: FormControl<boolean>;
  capacity: CommercialCapacityEditorForm;
  hasSchedule: FormControl<boolean>;
  schedule: CommercialScheduleEditorForm;
}>;

export type CommercialProcessItemEditorForm = FormGroup<{
  id: FormControl<string>;
  title: FormControl<string>;
  body: FormControl<string>;
}>;

export type CommercialFaqItemEditorForm = FormGroup<{
  id: FormControl<string>;
  question: FormControl<string>;
  answer: FormControl<string>;
}>;

type CommercialSectionBaseEditorControls<
  TType extends CommercialSectionType,
> = {
  id: FormControl<string>;
  type: FormControl<TType>;
  heading: FormControl<string>;
  lead: FormControl<string>;
};

export type CommercialHeroSectionEditorForm = FormGroup<
  CommercialSectionBaseEditorControls<'hero'> & {
    body: FormControl<string>;
    hasAction: FormControl<boolean>;
    action: CommercialActionEditorForm;
  }
>;

export type CommercialRichTextSectionEditorForm = FormGroup<
  CommercialSectionBaseEditorControls<'rich_text'> & {
    body: FormControl<string>;
  }
>;

export type CommercialCardGridSectionEditorForm = FormGroup<
  CommercialSectionBaseEditorControls<'card_grid'> & {
    items: FormArray<CommercialPricedItemEditorForm>;
  }
>;

export type CommercialPricingTableSectionEditorForm = FormGroup<
  CommercialSectionBaseEditorControls<'pricing_table'> & {
    items: FormArray<CommercialPricedItemEditorForm>;
  }
>;

export type CommercialProcessSectionEditorForm = FormGroup<
  CommercialSectionBaseEditorControls<'process'> & {
    items: FormArray<CommercialProcessItemEditorForm>;
  }
>;

export type CommercialFaqSectionEditorForm = FormGroup<
  CommercialSectionBaseEditorControls<'faq'> & {
    items: FormArray<CommercialFaqItemEditorForm>;
  }
>;

export type CommercialCtaSectionEditorForm = FormGroup<
  CommercialSectionBaseEditorControls<'cta'> & {
    body: FormControl<string>;
    action: CommercialActionEditorForm;
  }
>;

export type CommercialSharedCardGridSectionEditorForm = FormGroup<
  CommercialSectionBaseEditorControls<'card_grid'> & {
    items: FormArray<CommercialPricedItemEditorForm>;
    sharedSource: FormControl<
      Extract<CommercialSharedSource, { sectionType: 'card_grid' }>
    >;
  }
>;

export type CommercialSharedLogisticsSectionEditorForm = FormGroup<
  CommercialSectionBaseEditorControls<'logistics_fees'> & {
    items: FormArray<CommercialPricedItemEditorForm>;
    sharedSource: FormControl<
      Extract<CommercialSharedSource, { sectionType: 'logistics_fees' }>
    >;
  }
>;

export type CommercialSharedCardGridReferenceEditorForm = FormGroup<{
  id: FormControl<string>;
  type: FormControl<'card_grid'>;
  sharedSource: FormControl<
    Extract<CommercialSharedSource, { sectionType: 'card_grid' }>
  >;
}>;

export type CommercialSharedLogisticsReferenceEditorForm = FormGroup<{
  id: FormControl<string>;
  type: FormControl<'logistics_fees'>;
  sharedSource: FormControl<
    Extract<CommercialSharedSource, { sectionType: 'logistics_fees' }>
  >;
}>;

export type CommercialSharedSectionEditorForm =
  | CommercialSharedCardGridSectionEditorForm
  | CommercialSharedLogisticsSectionEditorForm;

export type CommercialSharedReferenceEditorForm =
  | CommercialSharedCardGridReferenceEditorForm
  | CommercialSharedLogisticsReferenceEditorForm;

export type CommercialLocalPricedSectionEditorForm =
  | CommercialCardGridSectionEditorForm
  | CommercialPricingTableSectionEditorForm;

export type CommercialEditablePricedSectionEditorForm =
  | CommercialLocalPricedSectionEditorForm
  | CommercialSharedSectionEditorForm;

export type CommercialSectionEditorForm =
  | CommercialHeroSectionEditorForm
  | CommercialRichTextSectionEditorForm
  | CommercialCardGridSectionEditorForm
  | CommercialPricingTableSectionEditorForm
  | CommercialProcessSectionEditorForm
  | CommercialFaqSectionEditorForm
  | CommercialCtaSectionEditorForm
  | CommercialSharedSectionEditorForm
  | CommercialSharedReferenceEditorForm;

export type CommercialSectionsEditorForm =
  FormArray<CommercialSectionEditorForm>;

export type CommercialPageEditorForm = FormGroup<{
  metadata: CommercialPageMetadataEditorForm;
  seo: CommercialPageSeoEditorForm;
  sections: CommercialSectionsEditorForm;
}>;
