import type {
  CommercialActionAppearance,
  CommercialPage,
} from './commercial-page';
import type { CommercialIconKey } from './commercial-icon';
import type {
  CommercialProductFieldKey,
  CommercialRenderProduct,
} from './commercial-product';
import type { Price } from './price';
import type { RichContent } from './rich-content';

export type { CommercialIconKey } from './commercial-icon';
export type {
  CommercialCooperationLength,
  CommercialEditorDuration,
  CommercialEditorParticipants,
  CommercialEditorProduct,
  CommercialFrequency,
  CommercialIncludedAddon,
  CommercialProductFieldKey,
  CommercialProductKind,
  CommercialProductPrice,
  CommercialRenderDuration,
  CommercialRenderParticipants,
  CommercialRenderProduct,
  CommercialSessionCount,
} from './commercial-product';

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
  price: Price | null;
};

export type CommercialProductLabelOverride = {
  productId: string;
  label: string;
};

export type CommercialProductField = CommercialPositionedItem & {
  key: CommercialProductFieldKey;
  label: string | null;
  productIds: string[] | null;
  labelOverrides: CommercialProductLabelOverride[];
};

export type CommercialTableColumn = CommercialPositionedItem & {
  label: string;
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
  answer: string;
};

export type CommercialRichTextBlock =
  CommercialBlockBase<'rich_text'> & {
    content: RichContent;
  };

export type CommercialButtonsBlock = CommercialBlockBase<'buttons'> & {
  presentation: {
    layout: CommercialButtonLayout;
    align: CommercialTextAlign;
  };
  buttons: CommercialButton[];
};

export type CommercialCardsBlock = CommercialBlockBase<'cards'> & {
  presentation: {
    orientation: CommercialCardOrientation;
    columns: 1 | 2 | 3;
  };
  items: CommercialCard[];
};

type CommercialProductCollectionBlockBase =
  CommercialBlockBase<'product_collection'> & {
    productIds: string[];
    fields: CommercialProductField[];
  };

export type CommercialProductCollectionCardsBlock =
  CommercialProductCollectionBlockBase & {
    presentation: {
      type: 'cards';
      orientation: CommercialCardOrientation;
      columns: 1 | 2 | 3;
    };
  };

export type CommercialProductCollectionTableBlock =
  CommercialProductCollectionBlockBase & {
    presentation: { type: 'table' };
  };

export type CommercialComparisonSection = CommercialPositionedItem & {
  heading: string | null;
  rows: CommercialComparisonRow[];
};

export type CommercialComparisonRow = CommercialPositionedItem & {
  label: string;
  fieldIds: string[];
};

export type CommercialProductCollectionComparisonTableBlock =
  CommercialProductCollectionBlockBase & {
    presentation: {
      type: 'comparison_table';
      sections: CommercialComparisonSection[];
    };
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

type CommercialMaterializedConstant =
  | {
      token: string;
      valueType: 'duration' | 'integer';
      value: number;
    }
  | {
      token: string;
      valueType: 'text';
      value: string;
    };

export type CommercialMaterializedConstants =
  readonly CommercialMaterializedConstant[];

export type CommercialPageBuilderDocument = {
  page: CommercialPage;
  constants: CommercialMaterializedConstants;
  products: CommercialRenderProduct[];
  sections: CommercialBuilderSection[];
};
