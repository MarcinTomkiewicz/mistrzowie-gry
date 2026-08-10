import type { CommercialPrice } from './commercial-price';
import type {
  CommercialActionAppearance,
  CommercialPage,
  CommercialPageSeo,
} from './commercial-page';
import type { RichContent } from './rich-content';

export type CommercialSectionSurface = 'plain' | 'card';
export type CommercialTextAlign = 'left' | 'center' | 'right';
export type CommercialBlockType =
  | 'rich_text'
  | 'buttons'
  | 'cards'
  | 'product_collection'
  | 'table'
  | 'faq';

export type CommercialButtonLayout = 'horizontal' | 'vertical';
export type CommercialCardOrientation = 'vertical' | 'horizontal';
export type CommercialProductFieldKey =
  | 'name'
  | 'description'
  | 'price'
  | 'duration'
  | 'participants'
  | 'participantsPerFacilitatorMax'
  | 'sessions'
  | 'sessionsPerMonth'
  | 'meetingCount'
  | 'facilitatorCount'
  | 'tableCount';
export type CommercialIconKey = 'message' | 'users';

export type CommercialSectionPresentation = {
  surface: CommercialSectionSurface;
  textAlign: CommercialTextAlign;
};

type CommercialPositionedItem = {
  id: string;
  position: number;
};

type CommercialBlockBase<TType extends CommercialBlockType> =
  CommercialPositionedItem & {
    type: TType;
  };

export type CommercialButton = CommercialPositionedItem & {
  label: string;
  route: string;
  appearance: CommercialActionAppearance;
  iconKey: CommercialIconKey | null;
};

export type CommercialCard = CommercialPositionedItem & {
  title: string;
  body: RichContent | null;
  price: CommercialPrice | null;
};

export type CommercialProductField = CommercialPositionedItem & {
  key: CommercialProductFieldKey;
  label: string;
  productIds: string[];
  labelOverrides: Record<string, string>;
};

export type CommercialTableColumn = CommercialPositionedItem & {
  heading: RichContent;
};

export type CommercialTableCell = {
  columnId: string;
  content: RichContent;
};

export type CommercialTableRow = CommercialPositionedItem & {
  cells: CommercialTableCell[];
};

export type CommercialFaqEntry = CommercialPositionedItem & {
  question: string;
  answer: RichContent;
};

export type CommercialRichTextBlock =
  CommercialBlockBase<'rich_text'> & {
    content: RichContent;
  };

export type CommercialButtonsBlock = CommercialBlockBase<'buttons'> & {
  layout: CommercialButtonLayout;
  align: CommercialTextAlign;
  buttons: CommercialButton[];
};

export type CommercialCardsBlock = CommercialBlockBase<'cards'> & {
  orientation: CommercialCardOrientation;
  columns: 1 | 2 | 3 | 4;
  cards: CommercialCard[];
};

type CommercialProductCollectionBlockBase =
  CommercialBlockBase<'product_collection'> & {
    productIds: string[];
    fields: CommercialProductField[];
  };

export type CommercialProductCollectionCardsBlock =
  CommercialProductCollectionBlockBase & {
    presentation: 'cards';
    cardOrientation: CommercialCardOrientation;
    columns: 1 | 2 | 3;
  };

export type CommercialProductCollectionTableBlock =
  CommercialProductCollectionBlockBase & {
    presentation: 'table';
  };

export type CommercialProductCollectionComparisonTableBlock =
  CommercialProductCollectionBlockBase & {
    presentation: 'comparison_table';
  };

export type CommercialProductCollectionBlock =
  | CommercialProductCollectionCardsBlock
  | CommercialProductCollectionTableBlock
  | CommercialProductCollectionComparisonTableBlock;

export type CommercialTableBlock = CommercialBlockBase<'table'> & {
  columns: CommercialTableColumn[];
  rows: CommercialTableRow[];
};

export type CommercialFaqBlock = CommercialBlockBase<'faq'> & {
  items: CommercialFaqEntry[];
};

export type CommercialPageBlock =
  | CommercialRichTextBlock
  | CommercialButtonsBlock
  | CommercialCardsBlock
  | CommercialProductCollectionBlock
  | CommercialTableBlock
  | CommercialFaqBlock;

export type CommercialBuilderSection = CommercialPositionedItem & {
  heading: string | null;
  lead: string | null;
  presentation: CommercialSectionPresentation;
  blocks: CommercialPageBlock[];
};

export type CommercialEditorDuration =
  | { mode: 'standard'; minutes: null }
  | { mode: 'custom'; minutes: number }
  | { mode: 'not_applicable'; minutes: null };

export type CommercialRenderDuration =
  | { mode: 'standard'; minutes: number }
  | { mode: 'custom'; minutes: number }
  | { mode: 'not_applicable'; minutes: null };

export type CommercialEditorParticipants =
  | {
      mode: 'standard';
      min: null;
      max: null;
      perFacilitatorMax: null;
    }
  | {
      mode: 'custom';
      min: number;
      max: number;
      perFacilitatorMax: number | null;
    }
  | {
      mode: 'not_applicable';
      min: null;
      max: null;
      perFacilitatorMax: null;
    };

export type CommercialRenderParticipants =
  | {
      mode: 'standard';
      min: number;
      max: number;
      perFacilitatorMax: null;
    }
  | {
      mode: 'custom';
      min: number;
      max: number;
      perFacilitatorMax: number | null;
    }
  | {
      mode: 'not_applicable';
      min: null;
      max: null;
      perFacilitatorMax: null;
    };

type CommercialProductBase<
  TDuration extends CommercialEditorDuration | CommercialRenderDuration,
  TParticipants extends
    | CommercialEditorParticipants
    | CommercialRenderParticipants,
> = CommercialPositionedItem & {
  name: string;
  description: RichContent | null;
  price: CommercialPrice;
  duration: TDuration;
  participants: TParticipants;
  sessions: number | null;
  sessionsPerMonth: number | null;
  meetingCountMin: number | null;
  meetingCountMax: number | null;
  facilitatorCount: number | null;
  tableCount: number | null;
};

export type CommercialEditorProduct = CommercialProductBase<
  CommercialEditorDuration,
  CommercialEditorParticipants
>;

export type CommercialRenderProduct = CommercialProductBase<
  CommercialRenderDuration,
  CommercialRenderParticipants
>;

export type CommercialPageEditorDocument = {
  heading: string;
  lead: string | null;
  seo: CommercialPageSeo;
  products: CommercialEditorProduct[];
  sections: CommercialBuilderSection[];
};

export type CommercialMaterializedConstants = Readonly<
  Record<string, string | number>
>;

export type CommercialPageBuilderDocument = {
  page: CommercialPage;
  constants: CommercialMaterializedConstants;
  products: CommercialRenderProduct[];
  sections: CommercialBuilderSection[];
};
