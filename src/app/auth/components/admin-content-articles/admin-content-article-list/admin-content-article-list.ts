import { Component, computed, inject, signal } from '@angular/core';

import { provideTranslocoScope } from '@jsverse/transloco';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { finalize, Observable } from 'rxjs';

import {
  IAdminContentArticleDetail,
  IAdminContentArticleListItem,
} from '../../../../core/interfaces/i-content-article';
import { ContentArticlesService } from '../../../../core/services/content-articles/content-articles';
import { Storage } from '../../../../core/services/storage/storage';
import { UiToast } from '../../../../core/services/ui-toast/ui-toast';
import { formatTimestampLabel } from '../../../../core/utils/date';
import { resolvePublicStorageUrl } from '../../../../core/utils/storage-url';
import { getContentArticleStatusBadgeClass } from '../../../../core/utils/content-articles';
import { LoadingOverlay } from '../../../../public/common/loading-overlay/loading-overlay';
import { createAdminContentArticleListI18n } from './admin-content-article-list.i18n';

@Component({
  selector: 'app-admin-content-article-list',
  standalone: true,
  imports: [ButtonModule, TableModule, LoadingOverlay],
  templateUrl: './admin-content-article-list.html',
  providers: [provideTranslocoScope('adminContentArticles', 'common')],
})
export class AdminContentArticleList {
  private readonly articles = inject(ContentArticlesService);
  private readonly storage = inject(Storage);
  private readonly toast = inject(UiToast);

  protected readonly i18n = createAdminContentArticleListI18n();

  protected readonly rows = signal<IAdminContentArticleListItem[]>([]);
  protected readonly isLoading = signal(true);
  protected readonly hasLoadError = signal(false);
  protected readonly isCreating = signal(false);
  protected readonly activeActionKey = signal<string | null>(null);

  protected readonly isBusy = computed(
    () => this.isLoading() || this.isCreating() || !!this.activeActionKey(),
  );
  protected readonly rowVms = computed(() => {
    const table = this.i18n.table();
    const statusLabels = this.i18n.statusLabels();

    return this.rows().map((article) => {
      const thumbnailUrl = resolvePublicStorageUrl(
        this.storage,
        article.heroImagePath,
      );

      return {
        article,
        titleLabel: article.title || table.untitledDraft,
        slugLabel: article.slug || table.notAvailable,
        thumbnailUrl,
        thumbnailAlt:
          article.heroImageAlt || article.title || table.thumbnailAlt,
        statusBadgeClass: getContentArticleStatusBadgeClass(article.status),
        statusLabel: statusLabels[article.status],
        publishedAtLabel:
          formatTimestampLabel(article.publishedAt, 'pl-PL') ??
          table.notAvailable,
        updatedAtLabel:
          formatTimestampLabel(article.updatedAt, 'pl-PL') ??
          table.notAvailable,
      };
    });
  });

  constructor() {
    this.loadArticles();
  }

  protected loadArticles(): void {
    this.isLoading.set(true);
    this.hasLoadError.set(false);

    this.articles
      .getAdminArticleList()
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (rows) => {
          this.rows.set(rows);
        },
        error: () => {
          this.rows.set([]);
          this.hasLoadError.set(true);
          this.toast.danger({
            summary: this.i18n.toast().loadFailedSummary,
            detail: this.i18n.toast().loadFailedDetail,
          });
        },
      });
  }

  protected createArticle(): void {
    this.isCreating.set(true);

    this.articles
      .createAdminArticleDraft()
      .pipe(finalize(() => this.isCreating.set(false)))
      .subscribe({
        next: () => {
          this.loadArticles();
        },
        error: () => {
          this.toast.danger({
            summary: this.i18n.toast().createFailedSummary,
            detail: this.i18n.toast().createFailedDetail,
          });
        },
      });
  }

  protected publishArticle(article: IAdminContentArticleListItem): void {
    this.runArticleAction(
      article,
      'publish',
      () => this.articles.publishAdminArticle(article.id),
      this.i18n.toast().publishSuccessSummary,
      this.i18n.toast().publishSuccessDetail,
      this.i18n.toast().publishFailedSummary,
      this.i18n.toast().publishFailedDetail,
    );
  }

  protected archiveArticle(article: IAdminContentArticleListItem): void {
    this.runArticleAction(
      article,
      'archive',
      () => this.articles.archiveAdminArticle(article.id),
      this.i18n.toast().archiveSuccessSummary,
      this.i18n.toast().archiveSuccessDetail,
      this.i18n.toast().archiveFailedSummary,
      this.i18n.toast().archiveFailedDetail,
    );
  }

  protected isActionLoading(articleId: string, action: string): boolean {
    return this.activeActionKey() === this.buildActionKey(articleId, action);
  }

  private runArticleAction(
    article: IAdminContentArticleListItem,
    action: string,
    request: () => Observable<IAdminContentArticleDetail>,
    successSummary: string,
    successDetail: string,
    failedSummary: string,
    failedDetail: string,
  ): void {
    this.activeActionKey.set(this.buildActionKey(article.id, action));

    request()
      .pipe(finalize(() => this.activeActionKey.set(null)))
      .subscribe({
        next: () => {
          this.toast.success({
            summary: successSummary,
            detail: successDetail,
          });
          this.loadArticles();
        },
        error: () => {
          this.toast.danger({
            summary: failedSummary,
            detail: failedDetail,
          });
        },
      });
  }

  private buildActionKey(articleId: string, action: string): string {
    return `${articleId}:${action}`;
  }
}
