import { Component, OnInit, computed, effect, inject, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { catchError, finalize, of } from 'rxjs';

import { ButtonModule } from 'primeng/button';

import { provideTranslocoScope } from '@jsverse/transloco';

import { buildSiteUrl } from '../../../../core/config/site';
import { IContentArticleListItem } from '../../../../core/interfaces/i-content-article';
import { ContentArticlesService } from '../../../../core/services/content-articles/content-articles';
import { Seo } from '../../../../core/services/seo/seo';
import { Storage } from '../../../../core/services/storage/storage';
import { resolvePublicStorageUrl } from '../../../../core/utils/storage-url';
import { createPageStructuredData } from '../../../../core/utils/structured-data';
import { LoadingOverlay } from '../../../common/loading-overlay/loading-overlay';
import { createContentArticlesI18n } from '../content-articles.i18n';

@Component({
  selector: 'app-content-article-list',
  standalone: true,
  imports: [RouterModule, ButtonModule, LoadingOverlay],
  templateUrl: './content-article-list.html',
  providers: [provideTranslocoScope('contentArticles', 'common')],
})
export class ContentArticleList implements OnInit {
  private readonly articles = inject(ContentArticlesService);
  private readonly seo = inject(Seo);
  private readonly storage = inject(Storage);
  private readonly pageUrl = buildSiteUrl('/artykuly');

  readonly i18n = createContentArticlesI18n();

  readonly items = signal<IContentArticleListItem[]>([]);
  readonly isLoading = signal(true);
  readonly error = signal<string | null>(null);

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

    this.seo.apply({
      title: seo.listTitle,
      description: seo.listDescription,
      canonicalUrl: this.pageUrl,
      structuredData: createPageStructuredData({
        type: 'CollectionPage',
        id: `${this.pageUrl}#webpage`,
        url: this.pageUrl,
        name: seo.listTitle,
        description: seo.listDescription,
      }),
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
        catchError((error) => {
          console.error('[content articles] list load error', error);
          this.error.set(this.i18n.errors().listDescription);
          return of([] as IContentArticleListItem[]);
        }),
        finalize(() => this.isLoading.set(false)),
      )
      .subscribe((items) => this.items.set(items));
  }
}
