export interface AdminContentArticlesPageTranslations {
  subtitle: string;
  emptyDescription: string;
  errorTitle: string;
}

export interface AdminContentArticleEditorPageTranslations {
  title: string;
  subtitle: string;
}

export interface AdminContentArticlesTableTranslations {
  thumbnail: string;
  updatedAt: string;
  untitledDraft: string;
  thumbnailAlt: string;
}

export interface AdminContentArticlesActionsTranslations {
  createArticle: string;
}

export interface AdminContentArticleEditorActionsTranslations {
  addImageBlock: string;
  removeBlock: string;
  moveSectionUp: string;
  moveSectionDown: string;
}

export interface AdminContentArticleEditorFieldsTranslations {
  mainSectionTitle: string;
  bodySectionTitle: string;
  heroImageAlt: string;
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
  internalLinkHint: string;
  invalidInternalLink: string;
}

export interface AdminContentArticleEditorUploadTranslations {
  cropHint: string;
}

export interface AdminContentArticlesToastTranslations {
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
  loadFailedDetail: string;
  saveSuccessSummary: string;
  saveFailedSummary: string;
  invalidSummary: string;
  invalidDetail: string;
  uploadFailedSummary: string;
  uploadFailedDetail: string;
}

export type AdminContentArticleStatusLabelTranslations = {
  draft: string;
};
