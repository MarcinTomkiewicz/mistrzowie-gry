import { IAdminContentArticleDetail } from '../../../core/interfaces/i-content-article';
import {
  ContentArticlePublicationIssue,
  ContentArticleStatus,
} from '../../../core/types/content-article';
import { normalizeText } from '../../../core/utils/normalize-text';

const CONTENT_ARTICLE_STATUS_BADGE_CLASS: Record<
  ContentArticleStatus,
  string
> = {
  draft: 'tag-badge tag-badge--info',
  published: 'tag-badge tag-badge--success',
  archived: 'tag-badge tag-badge--muted',
};

export function getContentArticleStatusBadgeClass(
  status: ContentArticleStatus,
): string {
  return CONTENT_ARTICLE_STATUS_BADGE_CLASS[status];
}

export function getContentArticlePublicationIssues(
  article: IAdminContentArticleDetail,
): ContentArticlePublicationIssue[] {
  const issues: ContentArticlePublicationIssue[] = [];

  if (!normalizeText(article.title)) issues.push('title');
  if (!normalizeText(article.slug)) issues.push('slug');
  if (!normalizeText(article.excerpt)) issues.push('excerpt');
  if (!normalizeText(article.heroImagePath)) issues.push('heroImagePath');
  if (!normalizeText(article.heroImageAlt)) issues.push('heroImageAlt');
  if (
    !article.blocks.some(
      (block) =>
        block.kind === 'text_section' && !!normalizeText(block.body),
    )
  ) {
    issues.push('textSectionBody');
  }
  if (
    article.blocks.some(
      (block) => block.kind === 'image' && !normalizeText(block.imageAlt),
    )
  ) {
    issues.push('imageAlt');
  }

  return issues;
}
