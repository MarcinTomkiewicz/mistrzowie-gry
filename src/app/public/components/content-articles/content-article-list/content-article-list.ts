import { Component, OnInit, computed, effect, inject, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { catchError, finalize, of } from 'rxjs';

import { ButtonModule } from 'primeng/button';

import { provideTranslocoScope } from '@jsverse/transloco';

import { buildSiteUrl } from '../../../../core/config/site';
import { IContentArticleListItem } from '../../../../core/interfaces/i-content-article';
import { ContentArticles } from '../../../../core/services/content-articles/content-articles';
import { ResponseStatus } from '../../../../core/services/response-status/response-status';
import { Seo } from '../../../../core/services/seo/seo';
import { Storage } from '../../../../core/services/storage/storage';
import type { BreadcrumbItem } from '../../../../core/types/breadcrumb';
import { resolvePublicStorageUrl } from '../../../../core/utils/storage-url';
import {
  createBreadcrumbStructuredData,
  createPageStructuredData,
} from '../../../../core/utils/structured-data';
import { Breadcrumbs } from '../../../common/breadcrumbs/breadcrumbs';
import { LoadingOverlay } from '../../../common/loading-overlay/loading-overlay';
import { createContentArticlesI18n } from '../content-articles.i18n';

@Component({
  selector: 'app-content-article-list',
  standalone: true,
  imports: [RouterModule, ButtonModule, Breadcrumbs, LoadingOverlay],
  templateUrl: './content-article-list.html',
  providers: [provideTranslocoScope('contentArticles', 'common')],
})
export class ContentArticleList implements OnInit {
  private readonly articles = inject(ContentArticles);
  private readonly responseStatus = inject(ResponseStatus);
  private readonly seo = inject(Seo);
  private readonly storage = inject(Storage);
  private readonly pageUrl = buildSiteUrl('/artykuly');

  readonly i18n = createContentArticlesI18n();

  readonly items = signal<IContentArticleListItem[]>([]);
  readonly isLoading = signal(true);
  readonly error = signal<string | null>(null);
  readonly breadcrumbs = computed<BreadcrumbItem[]>(() => [
    {
      label: this.i18n.commonCta().goHome,
      path: '/',
    },
    {
      label: this.i18n.hero().title,
    },
  ]);

  readonly vm = computed(() => ({
    hero: this.i18n.hero(),
    cta: this.i18n.cta(),
    empty: this.i18n.empty(),
    errors: this.i18n.errors(),
    status: this.i18n.status(),
    items: this.items(),
    isLoading: this.isLoading(),
    error: this.error(),
  }));

  private readonly applySeoEffect = effect(() => {
    const seo = this.i18n.seo();
    const error = this.error();

    if (this.isLoading()) {
      this.seo.apply({
        title: seo.listTitle,
        description: seo.listDescription,
        canonicalUrl: this.pageUrl,
      });
      return;
    }

    if (error) {
      this.responseStatus.set(503);
      this.seo.apply({
        title: this.i18n.errors().listTitle,
        description: error,
        canonicalUrl: this.pageUrl,
        robots: 'noindex,nofollow',
      });
      return;
    }

    this.responseStatus.set(200);

    this.seo.apply({
      title: seo.listTitle,
      description: seo.listDescription,
      canonicalUrl: this.pageUrl,
      structuredData: [
        createPageStructuredData({
          type: 'CollectionPage',
          id: `${this.pageUrl}#webpage`,
          url: this.pageUrl,
          name: seo.listTitle,
          description: seo.listDescription,
        }),
        createBreadcrumbStructuredData(this.breadcrumbs()),
      ],
    });
  });

  ngOnInit(): void {
    this.loadArticles();
  }

  resolveImageUrl(path: string): string | null {
    return resolvePublicStorageUrl(this.storage, path);
  }

  trackById = (_: number, article: IContentArticleListItem): string =>
    article.id;

  private loadArticles(): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.articles
      .getPublicArticleList()
      .pipe(
        catchError((error: unknown) => {
          console.error('[content articles] list load error', error);
          this.error.set(this.i18n.errors().listDescription);
          return of([] as IContentArticleListItem[]);
        }),
        finalize(() => this.isLoading.set(false)),
      )
      .subscribe((items) => this.items.set(items));
  }
}
