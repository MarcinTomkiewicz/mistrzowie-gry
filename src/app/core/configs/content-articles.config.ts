export const CONTENT_ARTICLE_RPC = {
  getPublicArticleList: 'get_public_content_article_list',
  getPublicArticleBySlug: 'get_public_content_article_by_slug',
  getAdminArticleList: 'get_admin_content_article_list',
  getAdminArticleDetail: 'get_admin_content_article_detail',
  createAdminArticleDraft: 'create_admin_content_article_draft',
  saveAdminArticle: 'save_admin_content_article',
  publishAdminArticle: 'publish_admin_content_article',
  archiveAdminArticle: 'archive_admin_content_article',
} as const;
