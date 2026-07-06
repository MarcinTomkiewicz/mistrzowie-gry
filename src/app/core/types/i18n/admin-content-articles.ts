import { ContentArticleStatus } from '../content-article';

export interface AdminContentArticlesPageTranslations {
  title: string;
  subtitle: string;
  emptyTitle: string;
  emptyDescription: string;
  errorTitle: string;
}

export interface AdminContentArticleEditorPageTranslations {
  title: string;
  subtitle: string;
  loadErrorTitle: string;
  notFoundTitle: string;
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
  editArticle: string;
  publishArticle: string;
  archiveArticle: string;
}

export interface AdminContentArticleEditorActionsTranslations {
  addTextSection: string;
  addImageBlock: string;
  removeBlock: string;
  moveSectionUp: string;
  moveSectionDown: string;
}

export interface AdminContentArticleEditorFieldsTranslations {
  mainSectionTitle: string;
  seoSectionTitle: string;
  bodySectionTitle: string;
  title: string;
  slug: string;
  excerpt: string;
  heroImageAlt: string;
  seoTitle: string;
  seoDescription: string;
  heading: string;
  body: string;
  imageAlt: string;
  caption: string;
  heroPreviewAlt: string;
  imagePreviewAlt: string;
}

export interface AdminContentArticleEditorValidationTranslations {
  headingWithoutBody: string;
  imageWithoutPath: string;
  emptyBlocksNotice: string;
}

export interface AdminContentArticleEditorUploadTranslations {
  cropHint: string;
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

export interface AdminContentArticlePublicationValidationTranslations {
  summary: string;
  missingPrefix: string;
  title: string;
  slug: string;
  excerpt: string;
  heroImagePath: string;
  heroImageAlt: string;
  textSectionBody: string;
  imageAlt: string;
}

export interface AdminContentArticleEditorToastTranslations {
  loadFailedSummary: string;
  loadFailedDetail: string;
  saveSuccessSummary: string;
  saveSuccessDetail: string;
  saveFailedSummary: string;
  saveFailedDetail: string;
  invalidSummary: string;
  invalidDetail: string;
  uploadFailedSummary: string;
  uploadFailedDetail: string;
}

export type AdminContentArticleStatusLabelTranslations = Record<
  ContentArticleStatus,
  string
>;
