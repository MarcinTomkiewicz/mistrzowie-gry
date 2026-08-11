import type { CommercialPageIdentity } from './commercial-page';
import type {
  CommercialPageBuilderDocument,
  CommercialPageEditorDocument,
} from './commercial-page-builder';

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
  draft: CommercialPageEditorDocument;
  draftRevision: number;
  previewedRevision: number | null;
  hasDraftChanges: boolean;
  draftUpdatedAt: string;
  draftUpdatedBy: string | null;
  publishedAt: string | null;
  publishedBy: string | null;
  effectiveFrom: string | null;
};

export type CommercialPageAdminSavePayload = {
  p_page_id: string;
  p_locale: string;
  p_document: CommercialPageEditorDocument;
};

export type CommercialPageAdminUnsavedPreviewPayload = {
  p_page_id: string;
  p_locale: string;
  p_document: CommercialPageEditorDocument;
};

export type CommercialPagePublicationIssueCode =
  | 'required'
  | 'duplicate_section_position'
  | 'duplicate_block_position'
  | 'duplicate_product_position'
  | 'duplicate_item_position'
  | 'invalid_section_presentation'
  | 'invalid_block_type'
  | 'invalid_rich_content'
  | 'invalid_action'
  | 'invalid_action_route'
  | 'invalid_icon'
  | 'invalid_price'
  | 'invalid_price_range'
  | 'invalid_percentage'
  | 'invalid_duration'
  | 'invalid_participants'
  | 'invalid_product_reference'
  | 'invalid_product_collection'
  | 'invalid_table'
  | 'unknown_token'
  | 'constant_unpublished'
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
      document: CommercialPageBuilderDocument;
    }
  | {
      published: false;
      issues: CommercialPagePublicationIssue[];
      document: null;
    };
