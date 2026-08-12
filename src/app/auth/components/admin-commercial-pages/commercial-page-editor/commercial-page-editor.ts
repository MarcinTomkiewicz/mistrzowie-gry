import { NgTemplateOutlet } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import {
  provideTranslocoScope,
  TranslocoService,
} from '@jsverse/transloco';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { StepperModule } from 'primeng/stepper';
import { finalize, forkJoin, tap } from 'rxjs';

import {
  COMMERCIAL_PAGE_DEFAULT_LOCALE,
} from '../../../../core/configs/commercial-pages.config';
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
import type { CommercialConstantAdminItem } from '../../../../core/types/commercial-constant-admin';
import type {
  CommercialPageBuilderDocument,
  CommercialPageEditorDocument,
} from '../../../../core/types/commercial-page-builder';
import { assertCommercialPricingTranslations } from '../../../../core/utils/commercial-pricing';
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
    NgTemplateOutlet,
    ReactiveFormsModule,
    ButtonModule,
    DialogModule,
    StepperModule,
    LoadingOverlay,
    CommercialPageRenderer,
    CommercialPageMetadataEditor,
    CommercialPageSectionsEditor,
    CommercialPageSeoEditor,
    CommercialProductsEditor,
  ],
  templateUrl: './commercial-page-editor.html',
  providers: [
    provideTranslocoScope(
      'adminCommercialPages',
      'commercialPages',
      'common',
    ),
  ],
})
export class CommercialPageEditor {
  private readonly constants = inject(CommercialConstantAdmin);
  private readonly pages = inject(CommercialPageAdmin);
  private readonly router = inject(Router);
  private readonly toast = inject(UiToast);
  private readonly transloco = inject(TranslocoService);

  protected readonly pageId =
    inject(ActivatedRoute).snapshot.paramMap.get('id') ?? '';
  protected readonly i18n = createAdminCommercialPagesI18n();
  protected readonly form = createCommercialPageEditorForm();
  protected readonly detail = signal<CommercialPageAdminDetail | null>(null);
  protected readonly commercialConstants = signal<
    readonly CommercialConstantAdminItem[]
  >([]);
  protected readonly constantTokens = computed(() =>
    this.commercialConstants().map((constant) => constant.syntax),
  );
  protected readonly activeStep = signal(1);
  protected readonly activeSectionId = signal<string | null>(null);
  protected readonly activeBlockId = signal<string | null>(null);
  protected readonly isLoading = signal(true);
  protected readonly isSaving = signal(false);
  protected readonly isPreviewing = signal(false);
  protected readonly isQuickPreviewOpen = signal(false);
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
      commercialPages: this.transloco
        .load(`commercialPages/${COMMERCIAL_PAGE_DEFAULT_LOCALE}`)
        .pipe(
          tap((translations) =>
            assertCommercialPricingTranslations(translations['pricing']),
          ),
        ),
    })
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: ({ detail, constants }) => {
          this.commercialConstants.set(constants);
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
    if (this.isSaving() || this.isPreviewing()) return;

    const detail = this.detail();
    if (!detail) return;
    const document = this.mapCurrentDocument(() => this.showSaveError());
    if (!document) return;

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
        error: () => this.showSaveError(),
      });
  }

  protected goBack(): void {
    if (this.isSaving()) return;

    void this.router.navigate(['/admin/offers']);
  }

  protected openQuickPreview(): void {
    if (this.isSaving() || this.isPreviewing()) return;

    this.isQuickPreviewOpen.set(true);
    this.loadWorkingPreview();
  }

  protected closeQuickPreview(): void {
    this.isQuickPreviewOpen.set(false);
  }

  protected handleQuickPreviewVisibleChange(visible: boolean): void {
    if (!visible) this.closeQuickPreview();
  }

  protected handleStepActivation(step: number | undefined): void {
    if (step === 4) this.loadWorkingPreview();
  }

  protected refreshWorkingPreview(): void {
    this.loadWorkingPreview();
  }

  private loadWorkingPreview(): void {
    if (this.isSaving() || this.isPreviewing()) return;

    const detail = this.detail();
    if (!detail) return;

    const document = this.mapCurrentDocument(() => this.showPreviewError());
    if (!document) return;

    this.isPreviewing.set(true);

    this.pages
      .getUnsavedPreview(detail.page.id, document, detail.page.locale)
      .pipe(finalize(() => this.isPreviewing.set(false)))
      .subscribe({
        next: (previewDocument) => this.previewDocument.set(previewDocument),
        error: () => this.showPreviewError(),
      });
  }

  private applyDetail(detail: CommercialPageAdminDetail): void {
    this.detail.set(detail);
    resetCommercialPageEditorForm(this.form, detail.draft);
  }

  private mapCurrentDocument(
    handleError: () => void,
  ): CommercialPageEditorDocument | null {
    try {
      return mapCommercialPageEditorFormToDocument(this.form);
    } catch {
      handleError();
      return null;
    }
  }

  private showSaveError(): void {
    const toast = this.i18n.editorToast();

    this.toast.danger({
      summary: toast.saveFailedSummary,
      detail: toast.saveFailedDetail,
    });
  }

  private showPreviewError(): void {
    const preview = this.i18n.previewPage();

    this.toast.danger({
      summary: preview.loadErrorTitle,
      detail: preview.loadErrorDescription,
    });
  }
}
