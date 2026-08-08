import type {
  CommercialCardGridSection,
  CommercialLogisticsFeesSection,
  CommercialPageDocument,
  CommercialPageIdentity,
  CommercialSectionType,
  CommercialSharedSource,
  StoredCommercialPageDocument,
  StoredCommercialSection,
} from './commercial-page';

export type CommercialPageAdminSharedCardGridSection =
  CommercialCardGridSection & {
    sharedSource: Extract<CommercialSharedSource, { sectionType: 'card_grid' }>;
  };

export type CommercialPageAdminSharedLogisticsSection =
  CommercialLogisticsFeesSection & {
    sharedSource: Extract<
      CommercialSharedSource,
      { sectionType: 'logistics_fees' }
    >;
  };

export type CommercialPageAdminSection =
  | StoredCommercialSection
  | CommercialPageAdminSharedCardGridSection
  | CommercialPageAdminSharedLogisticsSection;

export type CommercialPageAdminDocument = Omit<
  StoredCommercialPageDocument,
  'sections'
> & {
  sections: CommercialPageAdminSection[];
};

export type CommercialPageAdminListItem = CommercialPageIdentity & {
  heading: string;
  hasDraftChanges: boolean;
  draftRevision: number;
  previewedRevision: number | null;
  draftUpdatedAt: string;
  publishedAt: string | null;
  effectiveFrom: string | null;
  publishedBy: string | null;
};

export type CommercialPageAdminDetail = {
  page: CommercialPageIdentity;
  draft: CommercialPageAdminDocument;
  draftRevision: number;
  previewedRevision: number | null;
  hasDraftChanges: boolean;
  draftUpdatedAt: string;
  draftUpdatedBy: string | null;
  publishedAt: string | null;
  publishedBy: string | null;
  effectiveFrom: string | null;
  allowedSectionTypes: CommercialSectionType[];
};

export type CommercialPageAdminSavePayload = {
  p_page_id: string;
  p_locale: string;
  p_document: CommercialPageAdminDocument;
};

export type CommercialPagePublicationIssueCode =
  | 'required'
  | 'invalid_section_type'
  | 'duplicate_section_position'
  | 'duplicate_item_position'
  | 'invalid_action'
  | 'invalid_action_route'
  | 'invalid_price'
  | 'invalid_price_range'
  | 'invalid_percentage'
  | 'invalid_capacity'
  | 'invalid_schedule'
  | 'shared_source_missing'
  | 'placeholder_present'
  | 'preview_required';

export type CommercialPagePublicationIssue = {
  code: CommercialPagePublicationIssueCode;
  path: string;
  messageKey: string;
};

export type CommercialPagePublishResult =
  | {
      published: true;
      issues: [];
      document: CommercialPageDocument;
    }
  | {
      published: false;
      issues: CommercialPagePublicationIssue[];
      document: null;
    };
