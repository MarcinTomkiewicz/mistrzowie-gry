export const COMMERCIAL_PAGE_DEFAULT_LOCALE = 'pl';

export const COMMERCIAL_PAGE_RPC = {
  getPublicBySlug: 'get_public_commercial_page_by_slug',
  getAdminList: 'get_admin_commercial_page_list',
  getAdminDetail: 'get_admin_commercial_page_detail',
  saveAdminDraft: 'save_admin_commercial_page_draft',
  validateAdminDraft: 'validate_admin_commercial_page_draft',
  getAdminPreview: 'get_admin_commercial_page_preview',
  publishAdmin: 'publish_admin_commercial_page',
} as const;
