import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';

import { provideTranslocoScope } from '@jsverse/transloco';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { finalize } from 'rxjs';

import { CommercialPageAdmin } from '../../../../core/services/commercial-page-admin/commercial-page-admin';
import { UiToast } from '../../../../core/services/ui-toast/ui-toast';
import type { CommercialPageAdminListItem } from '../../../../core/types/commercial-page-admin';
import {
  formatDateLabel,
  formatTimestampLabel,
} from '../../../../core/utils/date';
import { LoadingOverlay } from '../../../../public/common/loading-overlay/loading-overlay';
import { createAdminCommercialPagesI18n } from '../admin-commercial-pages.i18n';

@Component({
  selector: 'app-commercial-page-list',
  imports: [ButtonModule, TableModule, LoadingOverlay],
  templateUrl: './commercial-page-list.html',
  providers: [provideTranslocoScope('adminCommercialPages', 'common')],
})
export class CommercialPageList {
  private readonly pages = inject(CommercialPageAdmin);
  private readonly router = inject(Router);
  private readonly toast = inject(UiToast);

  protected readonly i18n = createAdminCommercialPagesI18n();
  protected readonly rows = signal<CommercialPageAdminListItem[]>([]);
  protected readonly isLoading = signal(true);
  protected readonly hasLoadError = signal(false);

  protected readonly rowVms = computed(() => {
    const draftStatus = this.i18n.draftStatus();
    const values = this.i18n.commonValues();

    return this.rows().map((page) => ({
      page,
      draftStatusLabel: page.hasDraftChanges
        ? draftStatus.dirty
        : draftStatus.clean,
      draftStatusClass: page.hasDraftChanges
        ? 'tag-badge tag-badge--warn'
        : 'tag-badge tag-badge--success',
      draftUpdatedAtLabel:
        formatTimestampLabel(page.draftUpdatedAt, page.locale) ??
        values.notAvailable,
      publishedAtLabel:
        formatTimestampLabel(page.publishedAt, page.locale) ??
        values.notAvailable,
      effectiveFromLabel: page.effectiveFrom
        ? formatDateLabel(page.effectiveFrom, page.locale)
        : values.notAvailable,
    }));
  });

  constructor() {
    this.loadPages();
  }

  protected loadPages(): void {
    this.isLoading.set(true);
    this.hasLoadError.set(false);

    this.pages
      .getList()
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (pages) => this.rows.set(pages),
        error: () => {
          const toast = this.i18n.listToast();

          this.rows.set([]);
          this.hasLoadError.set(true);
          this.toast.danger({
            summary: toast.loadFailedSummary,
            detail: toast.loadFailedDetail,
          });
        },
      });
  }

  protected editPage(page: CommercialPageAdminListItem): void {
    void this.router.navigate(['/admin/offers', page.id, 'edit']);
  }
}
