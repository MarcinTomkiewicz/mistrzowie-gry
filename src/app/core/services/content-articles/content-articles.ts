import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { CONTENT_ARTICLE_RPC } from '../../configs/content-articles.config';
import {
  IAdminContentArticleDetail,
  IAdminContentArticleListItem,
  IContentArticleDetail,
  IContentArticleListItem,
  ISaveContentArticlePayload,
} from '../../interfaces/i-content-article';
import { Backend } from '../backend/backend';

@Injectable({ providedIn: 'root' })
export class ContentArticlesService {
  private readonly backend = inject(Backend);

  getPublicArticleList(): Observable<IContentArticleListItem[]> {
    return this.backend.rpc<IContentArticleListItem[]>(
      CONTENT_ARTICLE_RPC.getPublicArticleList,
    );
  }

  getPublicArticleBySlug(
    slug: string,
  ): Observable<IContentArticleDetail | null> {
    return this.backend.rpc<IContentArticleDetail | null>(
      CONTENT_ARTICLE_RPC.getPublicArticleBySlug,
      { p_slug: slug },
    );
  }

  getAdminArticleList(): Observable<IAdminContentArticleListItem[]> {
    return this.backend.rpc<IAdminContentArticleListItem[]>(
      CONTENT_ARTICLE_RPC.getAdminArticleList,
    );
  }

  getAdminArticleDetail(
    articleId: string,
  ): Observable<IAdminContentArticleDetail | null> {
    return this.backend.rpc<IAdminContentArticleDetail | null>(
      CONTENT_ARTICLE_RPC.getAdminArticleDetail,
      { p_article_id: articleId },
    );
  }

  createAdminArticleDraft(): Observable<IAdminContentArticleDetail> {
    return this.backend.rpc<IAdminContentArticleDetail>(
      CONTENT_ARTICLE_RPC.createAdminArticleDraft,
    );
  }

  saveAdminArticle(
    payload: ISaveContentArticlePayload,
  ): Observable<IAdminContentArticleDetail> {
    return this.backend.rpc<IAdminContentArticleDetail>(
      CONTENT_ARTICLE_RPC.saveAdminArticle,
      { p_payload: payload },
    );
  }

  publishAdminArticle(articleId: string): Observable<IAdminContentArticleDetail> {
    return this.backend.rpc<IAdminContentArticleDetail>(
      CONTENT_ARTICLE_RPC.publishAdminArticle,
      { p_article_id: articleId },
    );
  }

  archiveAdminArticle(articleId: string): Observable<IAdminContentArticleDetail> {
    return this.backend.rpc<IAdminContentArticleDetail>(
      CONTENT_ARTICLE_RPC.archiveAdminArticle,
      { p_article_id: articleId },
    );
  }
}

