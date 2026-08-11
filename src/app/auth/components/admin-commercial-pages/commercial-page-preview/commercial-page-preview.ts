import { Component, effect, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { provideTranslocoScope } from '@jsverse/transloco';
import { ButtonModule } from 'primeng/button';
import { finalize } from 'rxjs';

import { CommercialPageAdmin } from '../../../../core/services/commercial-page-admin/commercial-page-admin';
import { Seo } from '../../../../core/services/seo/seo';
import { UiToast } from '../../../../core/services/ui-toast/ui-toast';
import type {
  CommercialPageBuilderDocument,
} from '../../../../core/types/commercial-page-builder';
import { LoadingOverlay } from '../../../../public/common/loading-overlay/loading-overlay';
import { CommercialPageRenderer } from '../../../../public/components/commercial-page/commercial-page-renderer';
import { createAdminCommercialPagesI18n } from '../admin-commercial-pages.i18n';
import { CommercialPagePublication } from '../commercial-page-publication/commercial-page-publication';

@Component({
  selector: 'app-commercial-page-preview',
  imports: [
    ButtonModule,
    LoadingOverlay,
    CommercialPageRenderer,
    CommercialPagePublication,
  ],
  templateUrl: './commercial-page-preview.html',
  providers: [provideTranslocoScope('adminCommercialPages', 'common')],
})
export class CommercialPagePreview {
  private readonly pages = inject(CommercialPageAdmin);
  private readonly router = inject(Router);
  private readonly seo = inject(Seo);
  private readonly toast = inject(UiToast);

  protected readonly pageId =
    inject(ActivatedRoute).snapshot.paramMap.get('id') ?? '';
  protected readonly i18n = createAdminCommercialPagesI18n();
  protected readonly document = signal<CommercialPageBuilderDocument | null>(
    null,
  );
  protected readonly isLoading = signal(true);
  protected readonly hasLoadError = signal(false);

  private readonly applySeo = effect(() => {
    this.seo.apply({
      title: this.i18n.previewPage().seoTitle,
      robots: 'noindex,nofollow',
    });
  });

  constructor() {
    this.loadPreview();
  }

  protected loadPreview(): void {
    if (!this.pageId) {
      this.isLoading.set(false);
      this.hasLoadError.set(true);
      return;
    }

    this.document.set(null);
    this.isLoading.set(true);
    this.hasLoadError.set(false);

    this.pages
      .getPreview(this.pageId)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (document) => this.document.set(document),
        error: () => {
          const preview = this.i18n.previewPage();

          this.hasLoadError.set(true);
          this.toast.danger({
            summary: preview.loadErrorTitle,
            detail: preview.loadErrorDescription,
          });
        },
      });
  }

  protected goToEditor(): void {
    void this.router.navigate(['/admin/offers', this.pageId, 'edit']);
  }

  protected onPublished(): void {
    this.goToEditor();
  }
}
