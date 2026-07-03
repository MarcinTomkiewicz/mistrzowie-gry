import { CONTENT_ARTICLE_STATUS_BADGE_CLASS } from '../configs/content-articles.config';
import { ContentArticleStatus } from '../types/content-article';

export function getContentArticleStatusBadgeClass(
  status: ContentArticleStatus,
): string {
  return CONTENT_ARTICLE_STATUS_BADGE_CLASS[status];
}
