import {
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { provideTranslocoScope } from '@jsverse/transloco';
import { catchError, distinctUntilChanged, finalize, map, of, switchMap } from 'rxjs';

import { buildSiteUrl } from '../../../core/config/site';
import { createCommercialPageStructuredData } from '../../../core/domain/commercial-pages/commercial-page-structured-data';
import { CommercialPageRead } from '../../../core/services/commercial-page-read/commercial-page-read';
import { ResponseStatus } from '../../../core/services/response-status/response-status';
import { Seo } from '../../../core/services/seo/seo';
import {
  createCommonCtaI18n,
  createCommonErrorsI18n,
  createCommonSeoI18n,
  createCommonStatusI18n,
} from '../../../core/translations/common.i18n';
import type { BreadcrumbItem } from '../../../core/types/breadcrumb';
import type {
  CommercialPageBuilderDocument,
} from '../../../core/types/commercial-page-builder';
import { createBreadcrumbStructuredData } from '../../../core/utils/structured-data';
import { CommercialPageRenderer } from '../../../common/commercial-page/commercial-page-renderer';
import { LoadingOverlay } from '../../../common/loading-overlay/loading-overlay';

@Component({
  selector: 'app-commercial-page',
  imports: [LoadingOverlay, CommercialPageRenderer],
  templateUrl: './commercial-page.html',
  providers: [provideTranslocoScope('common')],
})
export class CommercialPage implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly route = inject(ActivatedRoute);
  private readonly read = inject(CommercialPageRead);
  private readonly responseStatus = inject(ResponseStatus);
  private readonly seo = inject(Seo);

  protected readonly status = createCommonStatusI18n();
  protected readonly errors = createCommonErrorsI18n();
  private readonly commonCta = createCommonCtaI18n();
  private readonly defaultSeo = createCommonSeoI18n();

  private readonly slug$ = this.route.paramMap.pipe(
    map((params) => params.get('slug') ?? ''),
    distinctUntilChanged(),
  );

  protected readonly slug = signal(
    this.route.snapshot.paramMap.get('slug') ?? '',
  );
  protected readonly document = signal<CommercialPageBuilderDocument | null>(
    null,
  );
  protected readonly isLoading = signal(true);
  protected readonly hasLoadError = signal(false);
  protected readonly isNotFound = signal(false);

  private readonly breadcrumbs = computed<BreadcrumbItem[]>(() => {
    const document = this.document();

    return document
      ? [
          { label: this.commonCta().goHome, path: '/' },
          { label: document.page.heading },
        ]
      : [];
  });

  private readonly applySeoEffect = effect(() => {
    const requestedCanonicalUrl = buildSiteUrl(`/offer/${this.slug()}`);

    if (this.isLoading()) {
      const fallback = this.defaultSeo();

      this.seo.apply({
        title: fallback.defaultTitle,
        description: fallback.defaultDescription,
        canonicalUrl: requestedCanonicalUrl,
      });
      return;
    }

    if (this.hasLoadError()) {
      this.seo.apply({
        title: this.errors().server,
        canonicalUrl: requestedCanonicalUrl,
        robots: 'noindex,nofollow',
      });
      return;
    }

    if (this.isNotFound()) {
      this.seo.apply({
        title: this.errors().notFound,
        canonicalUrl: requestedCanonicalUrl,
        robots: 'noindex,nofollow',
      });
      return;
    }

    const document = this.document();
    if (!document) return;

    const pageSeo = document.page.seo;
    const canonicalUrl =
      pageSeo.canonicalUrl ?? buildSiteUrl(`/offer/${document.page.slug}`);

    this.seo.apply({
      title: pageSeo.title,
      description: pageSeo.description,
      canonicalUrl,
      og: {
        title: pageSeo.ogTitle ?? pageSeo.title,
        description: pageSeo.ogDescription ?? pageSeo.description,
      },
      structuredData: [
        createCommercialPageStructuredData(document, canonicalUrl),
        createBreadcrumbStructuredData(this.breadcrumbs()),
      ],
    });
  });

  ngOnInit(): void {
    this.slug$
      .pipe(
        switchMap((slug) => {
          this.startLoading(slug);

          return this.read.getBySlug(slug).pipe(
            catchError((error: unknown) => {
              console.error(
                '[commercial-page] Failed to load public commercial page.',
                error,
              );
              this.hasLoadError.set(true);
              this.responseStatus.set(503);

              return of(null);
            }),
            finalize(() => this.isLoading.set(false)),
          );
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((document) => {
        this.document.set(document);

        if (this.hasLoadError()) return;

        this.isNotFound.set(!document);
        this.responseStatus.set(document ? 200 : 404);
      });
  }

  private startLoading(slug: string): void {
    this.slug.set(slug);
    this.document.set(null);
    this.isLoading.set(true);
    this.hasLoadError.set(false);
    this.isNotFound.set(false);
  }
}
