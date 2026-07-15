import { TestBed } from '@angular/core/testing';
import { firstValueFrom, of } from 'rxjs';

import { CONTENT_ARTICLE_RPC } from '../../configs/content-articles.config';
import {
  IAdminContentArticleDetail,
  ISaveContentArticlePayload,
} from '../../interfaces/i-content-article';
import { Backend } from '../backend/backend';

import { ContentArticles } from './content-articles';

describe('ContentArticles', () => {
  let service: ContentArticles;
  let backend: jasmine.SpyObj<Backend>;

  const adminArticle: IAdminContentArticleDetail = {
    id: 'article-1',
    slug: 'testowy-artykul',
    title: 'Testowy artykul',
    excerpt: 'Lead',
    heroImagePath: 'content/articles/article-1/hero.png',
    heroImageAlt: 'Hero alt',
    status: 'draft',
    publishedAt: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    seoTitle: null,
    seoDescription: null,
    blocks: [],
  };

  beforeEach(() => {
    backend = jasmine.createSpyObj<Backend>('Backend', ['rpc']);
    backend.rpc.and.returnValue(of(adminArticle));

    TestBed.configureTestingModule({
      providers: [
        {
          provide: Backend,
          useValue: backend,
        },
      ],
    });
    service = TestBed.inject(ContentArticles);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('calls the public list RPC without args', async () => {
    backend.rpc.and.returnValue(of([]));

    await firstValueFrom(service.getPublicArticleList());

    expect(backend.rpc).toHaveBeenCalledWith(
      CONTENT_ARTICLE_RPC.getPublicArticleList,
    );
  });

  it('calls the public detail RPC with p_slug', async () => {
    backend.rpc.and.returnValue(of(null));

    await firstValueFrom(service.getPublicArticleBySlug('testowy-artykul'));

    expect(backend.rpc).toHaveBeenCalledWith(
      CONTENT_ARTICLE_RPC.getPublicArticleBySlug,
      { p_slug: 'testowy-artykul' },
    );
  });

  it('calls the admin list RPC without args', async () => {
    backend.rpc.and.returnValue(of([]));

    await firstValueFrom(service.getAdminArticleList());

    expect(backend.rpc).toHaveBeenCalledWith(
      CONTENT_ARTICLE_RPC.getAdminArticleList,
    );
  });

  it('calls the admin detail RPC with p_article_id', async () => {
    await firstValueFrom(service.getAdminArticleDetail('article-1'));

    expect(backend.rpc).toHaveBeenCalledWith(
      CONTENT_ARTICLE_RPC.getAdminArticleDetail,
      { p_article_id: 'article-1' },
    );
  });

  it('calls the create draft RPC without args', async () => {
    await firstValueFrom(service.createAdminArticleDraft());

    expect(backend.rpc).toHaveBeenCalledWith(
      CONTENT_ARTICLE_RPC.createAdminArticleDraft,
    );
  });

  it('passes save payload as p_payload without changing camelCase fields', async () => {
    const payload: ISaveContentArticlePayload = {
      id: 'article-1',
      slug: 'testowy-artykul',
      title: 'Testowy artykul',
      excerpt: 'Lead',
      heroImagePath: 'content/articles/article-1/hero.png',
      heroImageAlt: 'Hero alt',
      seoTitle: 'SEO title',
      seoDescription: 'SEO description',
      blocks: [
        {
          kind: 'text_section',
          heading: null,
          body: 'Tresc',
        },
        {
          kind: 'image',
          imagePath: 'content/articles/article-1/block.png',
          imageAlt: 'Block alt',
          caption: null,
        },
      ],
    };

    await firstValueFrom(service.saveAdminArticle(payload));

    expect(backend.rpc).toHaveBeenCalledWith(
      CONTENT_ARTICLE_RPC.saveAdminArticle,
      { p_payload: payload },
    );
  });

  it('calls the publish RPC with p_article_id', async () => {
    await firstValueFrom(service.publishAdminArticle('article-1'));

    expect(backend.rpc).toHaveBeenCalledWith(
      CONTENT_ARTICLE_RPC.publishAdminArticle,
      { p_article_id: 'article-1' },
    );
  });

  it('calls the archive RPC with p_article_id', async () => {
    await firstValueFrom(service.archiveAdminArticle('article-1'));

    expect(backend.rpc).toHaveBeenCalledWith(
      CONTENT_ARTICLE_RPC.archiveAdminArticle,
      { p_article_id: 'article-1' },
    );
  });
});
