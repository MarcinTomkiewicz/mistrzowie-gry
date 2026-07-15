import {
  Component,
  DestroyRef,
  OnInit,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { catchError, finalize, of } from 'rxjs';
import { distinctUntilChanged, map, switchMap, tap } from 'rxjs/operators';

import { ButtonModule } from 'primeng/button';

import { provideTranslocoScope } from '@jsverse/transloco';

import { buildSiteUrl } from '../../../../core/config/site';
import {
  IContentArticleDetail,
  IContentArticleImageBlock,
  IContentArticleTextSectionBlock,
} from '../../../../core/interfaces/i-content-article';
import { ResponseStatus } from '../../../../core/services/response-status/response-status';
import { ContentArticles } from '../../../../core/services/content-articles/content-articles';
import { Seo } from '../../../../core/services/seo/seo';
import { Storage } from '../../../../core/services/storage/storage';
import { resolvePublicStorageUrl } from '../../../../core/utils/storage-url';
import { createArticleStructuredData } from '../../../../core/utils/structured-data';
import { LoadingOverlay } from '../../../common/loading-overlay/loading-overlay';
import { createContentArticlesI18n } from '../content-articles.i18n';

@Component({
  selector: 'app-content-article-detail',
  standalone: true,
  imports: [RouterModule, ButtonModule, LoadingOverlay],
  templateUrl: './content-article-detail.html',
  providers: [provideTranslocoScope('contentArticles', 'common')],
})
export class ContentArticleDetail implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly route = inject(ActivatedRoute);
  private readonly articles = inject(ContentArticles);
  private readonly seo = inject(Seo);
  private readonly storage = inject(Storage);
  private readonly responseStatus = inject(ResponseStatus);

  readonly i18n = createContentArticlesI18n();

  readonly article = signal<IContentArticleDetail | null>(null);
  readonly slug = signal('');
  readonly isLoading = signal(true);
  readonly error = signal<string | null>(null);
  readonly isNotFound = signal(false);

  readonly heroImageUrl = computed(() =>
    resolvePublicStorageUrl(this.storage, this.article()?.heroImagePath),
  );

  readonly vm = computed(() => ({
    article: this.article(),
    heroImageUrl: this.heroImageUrl(),
    cta: this.i18n.cta(),
    errors: this.i18n.errors(),
    status: this.i18n.status(),
    isLoading: this.isLoading(),
    error: this.error(),
    isNotFound: this.isNotFound(),
  }));

  private readonly applySeoEffect = effect(() => {
    const article = this.article();

    if (article) {
      const canonicalUrl = buildSiteUrl(`/artykuly/${article.slug}`);
      const title = article.seoTitle?.trim() || article.title;
      const description = article.seoDescription?.trim() || article.excerpt;
      const imageUrl = this.heroImageUrl();

      this.seo.apply({
        title,
        description,
        canonicalUrl,
        og: {
          type: 'article',
          title,
          description,
          url: canonicalUrl,
          images: imageUrl
            ? [
                {
                  url: imageUrl,
                  alt: article.heroImageAlt,
                },
              ]
            : undefined,
        },
        twitter: {
          card: imageUrl ? 'summary_large_image' : 'summary',
          title,
          description,
          image: imageUrl ?? undefined,
        },
        structuredData: createArticleStructuredData({
          id: `${canonicalUrl}#article`,
          url: canonicalUrl,
          headline: title,
          description,
          image: imageUrl ?? undefined,
          datePublished: article.publishedAt,
          dateModified: article.updatedAt,
        }),
      });
      return;
    }

    if (!this.isNotFound() && !this.error()) {
      return;
    }

    const errors = this.i18n.errors();
    const isLoadError = !!this.error();

    this.seo.apply({
      title: isLoadError ? errors.detailLoadTitle : errors.detailNotFoundTitle,
      description: isLoadError
        ? errors.detailLoadDescription
        : errors.detailNotFoundDescription,
      canonicalUrl: buildSiteUrl(`/artykuly/${this.slug()}`),
      robots: 'noindex,nofollow',
    });
  });

  ngOnInit(): void {
    this.route.paramMap
      .pipe(
        map((params) => params.get('slug') ?? ''),
        distinctUntilChanged(),
        tap((slug) => this.slug.set(slug)),
        switchMap((slug) => this.loadArticle(slug)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((article) => {
        this.article.set(article);
        this.isNotFound.set(!article && !this.error());

        if (article) {
          this.responseStatus.set(200);
        } else if (!this.error()) {
          this.responseStatus.set(404);
        }
      });
  }

  resolveImageUrl(path: string): string | null {
    return resolvePublicStorageUrl(this.storage, path);
  }

  isTextSectionBlock(
    block: IContentArticleDetail['blocks'][number],
  ): block is IContentArticleTextSectionBlock {
    return block.kind === 'text_section';
  }

  isImageBlock(
    block: IContentArticleDetail['blocks'][number],
  ): block is IContentArticleImageBlock {
    return block.kind === 'image';
  }

  trackByBlockId = (
    _: number,
    block: IContentArticleDetail['blocks'][number],
  ): string => block.id;

  private loadArticle(slug: string) {
    this.isLoading.set(true);
    this.error.set(null);
    this.isNotFound.set(false);
    this.article.set(null);

    return this.articles.getPublicArticleBySlug(slug).pipe(
      catchError((error) => {
        console.error('[content articles] detail load error', error);
        this.error.set(this.i18n.errors().detailLoadDescription);
        return of(null);
      }),
      finalize(() => this.isLoading.set(false)),
    );
  }
}
