import { ContentArticleStatus } from '../types/content-article';

export interface IContentArticleListItem {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  heroImagePath: string;
  heroImageAlt: string;
  publishedAt: string;
  updatedAt: string;
}

export interface IContentArticleDetail extends IContentArticleListItem {
  seoTitle: string | null;
  seoDescription: string | null;
  blocks: Array<IContentArticleTextSectionBlock | IContentArticleImageBlock>;
}

export interface IAdminContentArticleListItem {
  id: string;
  slug: string | null;
  title: string | null;
  excerpt: string | null;
  heroImagePath: string | null;
  heroImageAlt: string | null;
  status: ContentArticleStatus;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface IAdminContentArticleDetail
  extends IAdminContentArticleListItem {
  seoTitle: string | null;
  seoDescription: string | null;
  blocks: Array<IContentArticleTextSectionBlock | IContentArticleImageBlock>;
}

export interface IContentArticleTextSectionBlock {
  id: string;
  kind: 'text_section';
  heading: string | null;
  body: string;
  sortOrder: number;
}

export interface IContentArticleImageBlock {
  id: string;
  kind: 'image';
  imagePath: string;
  imageAlt: string;
  caption: string | null;
  sortOrder: number;
}

export interface ISaveContentArticlePayload {
  id: string;
  slug: string | null;
  title: string | null;
  excerpt: string | null;
  heroImagePath: string | null;
  heroImageAlt: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  blocks: Array<
    ISaveContentArticleTextSectionBlock | ISaveContentArticleImageBlock
  >;
}

export interface ISaveContentArticleTextSectionBlock {
  kind: 'text_section';
  heading: string | null;
  body: string;
}

export interface ISaveContentArticleImageBlock {
  kind: 'image';
  imagePath: string;
  imageAlt: string | null;
  caption: string | null;
}

