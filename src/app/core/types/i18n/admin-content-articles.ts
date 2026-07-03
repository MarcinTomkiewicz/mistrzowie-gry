import { ContentArticleStatus } from '../content-article';

export interface AdminContentArticlesPageTranslations {
  title: string;
  subtitle: string;
  emptyTitle: string;
  emptyDescription: string;
  errorTitle: string;
}

export interface AdminContentArticlesTableTranslations {
  thumbnail: string;
  title: string;
  slug: string;
  status: string;
  publishedAt: string;
  updatedAt: string;
  actions: string;
  notAvailable: string;
  untitledDraft: string;
  thumbnailAlt: string;
}

export interface AdminContentArticlesActionsTranslations {
  createArticle: string;
  publishArticle: string;
  archiveArticle: string;
}

export interface AdminContentArticlesToastTranslations {
  loadFailedSummary: string;
  loadFailedDetail: string;
  createFailedSummary: string;
  createFailedDetail: string;
  publishSuccessSummary: string;
  publishSuccessDetail: string;
  publishFailedSummary: string;
  publishFailedDetail: string;
  archiveSuccessSummary: string;
  archiveSuccessDetail: string;
  archiveFailedSummary: string;
  archiveFailedDetail: string;
}

export type AdminContentArticleStatusLabelTranslations = Record<
  ContentArticleStatus,
  string
>;
