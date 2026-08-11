import { Component, computed, inject, signal } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { provideTranslocoScope } from '@jsverse/transloco';
import { ButtonModule } from 'primeng/button';
import { finalize, forkJoin } from 'rxjs';

import {
  createCommercialPageEditorForm,
  mapCommercialPageEditorFormToDocument,
  resetCommercialPageEditorForm,
  syncCommercialPageEditorOptionalControls,
} from '../../../../core/factories/commercial-page-editor-form.factory';
import { CommercialConstantAdmin } from '../../../../core/services/commercial-constant-admin/commercial-constant-admin';
import { CommercialPageAdmin } from '../../../../core/services/commercial-page-admin/commercial-page-admin';
import { UiToast } from '../../../../core/services/ui-toast/ui-toast';
import type { CommercialPageAdminDetail } from '../../../../core/types/commercial-page-admin';
import type {
  CommercialPageBuilderDocument,
  CommercialPageEditorDocument,
} from '../../../../core/types/commercial-page-builder';
import {
  formatDateLabel,
  formatTimestampLabel,
} from '../../../../core/utils/date';
import { LoadingOverlay } from '../../../../public/common/loading-overlay/loading-overlay';
import { CommercialPageRenderer } from '../../../../public/components/commercial-page/commercial-page-renderer';
import { createAdminCommercialPagesI18n } from '../admin-commercial-pages.i18n';
import { CommercialPageMetadataEditor } from './commercial-page-metadata-editor';
import { CommercialPageSectionsEditor } from './commercial-page-sections-editor';
import { CommercialPageSeoEditor } from './commercial-page-seo-editor';
import { CommercialProductsEditor } from './commercial-products-editor';

@Component({
  selector: 'app-commercial-page-editor',
  imports: [
    ReactiveFormsModule,
    ButtonModule,
    LoadingOverlay,
    CommercialPageRenderer,
    CommercialPageMetadataEditor,
    CommercialPageSectionsEditor,
    CommercialPageSeoEditor,
    CommercialProductsEditor,
  ],
  templateUrl: './commercial-page-editor.html',
  providers: [provideTranslocoScope('adminCommercialPages', 'common')],
})
export class CommercialPageEditor {
  private readonly constants = inject(CommercialConstantAdmin);
  private readonly pages = inject(CommercialPageAdmin);
  private readonly router = inject(Router);
  private readonly toast = inject(UiToast);

  protected readonly pageId =
    inject(ActivatedRoute).snapshot.paramMap.get('id') ?? '';
  protected readonly i18n = createAdminCommercialPagesI18n();
  protected readonly form = createCommercialPageEditorForm();
  protected readonly detail = signal<CommercialPageAdminDetail | null>(null);
  protected readonly constantTokens = signal<readonly string[]>([]);
  protected readonly isLoading = signal(true);
  protected readonly isSaving = signal(false);
  protected readonly isPreviewing = signal(false);
  protected readonly hasLoadError = signal(false);
  protected readonly previewDocument = signal<CommercialPageBuilderDocument | null>(
    null,
  );

  protected readonly draftStatusLabel = computed(() => {
    const status = this.i18n.draftStatus();

    return this.detail()?.hasDraftChanges ? status.dirty : status.clean;
  });

  protected readonly draftStatusClass = computed(() =>
    this.detail()?.hasDraftChanges
      ? 'tag-badge tag-badge--warn'
      : 'tag-badge tag-badge--success',
  );

  protected readonly publicationMetadata = computed(() => {
    const detail = this.detail();
    if (!detail) return null;

    const values = this.i18n.commonValues();

    return {
      draftRevision: String(detail.draftRevision),
      previewedRevision:
        detail.previewedRevision?.toString() ?? values.notAvailable,
      draftUpdatedAt:
        formatTimestampLabel(detail.draftUpdatedAt, detail.page.locale) ??
        values.notAvailable,
      draftUpdatedBy: detail.draftUpdatedBy ?? values.notAvailable,
      publishedAt:
        formatTimestampLabel(detail.publishedAt, detail.page.locale) ??
        values.notAvailable,
      publishedBy: detail.publishedBy ?? values.notAvailable,
      effectiveFrom: detail.effectiveFrom
        ? formatDateLabel(detail.effectiveFrom, detail.page.locale)
        : values.notAvailable,
    };
  });

  constructor() {
    this.loadPage();
  }

  protected loadPage(): void {
    this.detail.set(null);
    this.isLoading.set(true);
    this.hasLoadError.set(false);

    forkJoin({
      detail: this.pages.getDetail(this.pageId),
      constants: this.constants.getList(),
    })
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: ({ detail, constants }) => {
          this.constantTokens.set(constants.map((constant) => constant.syntax));
          this.applyDetail(detail);
        },
        error: () => {
          const toast = this.i18n.editorToast();

          this.hasLoadError.set(true);
          this.toast.danger({
            summary: toast.loadFailedSummary,
            detail: toast.loadFailedDetail,
          });
        },
      });
  }

  protected saveDraft(): void {
    const document = this.getValidDocument();
    if (!document) return;
    const detail = this.detail();
    if (!detail) return;

    const toast = this.i18n.editorToast();

    this.isSaving.set(true);
    this.form.disable({ emitEvent: false });

    this.pages
      .saveDraft(detail.page.id, document, detail.page.locale)
      .pipe(
        finalize(() => {
          this.form.enable({ emitEvent: false });
          syncCommercialPageEditorOptionalControls(this.form);
          this.isSaving.set(false);
        }),
      )
      .subscribe({
        next: (savedDetail) => {
          this.applyDetail(savedDetail);
          this.toast.success({
            summary: toast.saveSuccessSummary,
            detail: toast.saveSuccessDetail,
          });
        },
        error: () => {
          this.toast.danger({
            summary: toast.saveFailedSummary,
            detail: toast.saveFailedDetail,
          });
        },
      });
  }

  protected goBack(): void {
    if (this.isSaving() || this.isPreviewing()) return;

    void this.router.navigate(['/admin/offers']);
  }

  protected previewDraft(): void {
    if (this.isSaving() || this.isPreviewing()) return;

    if (this.form.pristine) {
      void this.router.navigate(['/admin/offers', this.pageId, 'preview']);
      return;
    }

    const document = this.getValidDocument();
    const detail = this.detail();
    if (!document || !detail) return;

    this.isPreviewing.set(true);

    this.pages
      .getUnsavedPreview(detail.page.id, document, detail.page.locale)
      .pipe(finalize(() => this.isPreviewing.set(false)))
      .subscribe({
        next: (previewDocument) => this.previewDocument.set(previewDocument),
        error: () => {
          const preview = this.i18n.previewPage();

          this.toast.danger({
            summary: preview.loadErrorTitle,
            detail: preview.loadErrorDescription,
          });
        },
      });
  }

  protected closePreview(): void {
    this.previewDocument.set(null);
  }

  private applyDetail(detail: CommercialPageAdminDetail): void {
    this.detail.set(detail);
    resetCommercialPageEditorForm(this.form, detail.draft);
  }

  private getValidDocument(): CommercialPageEditorDocument | null {
    this.form.markAllAsTouched();

    if (this.form.invalid) {
      const formCopy = this.i18n.commonForm();

      this.toast.danger({
        summary: formCopy.invalidSummary,
        detail: formCopy.invalid,
      });
      return null;
    }

    return mapCommercialPageEditorFormToDocument(this.form);
  }
}
