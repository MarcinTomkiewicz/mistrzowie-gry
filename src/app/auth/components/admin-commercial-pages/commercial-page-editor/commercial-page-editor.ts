import { Component, computed, inject, signal } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { provideTranslocoScope } from '@jsverse/transloco';
import { ButtonModule } from 'primeng/button';
import { finalize } from 'rxjs';

import {
  createCommercialPageEditorForm,
  mapCommercialPageEditorFormToDocument,
  resetCommercialPageEditorForm,
  syncCommercialPageEditorOptionalControls,
} from '../../../../core/factories/commercial-page-editor-form.factory';
import { CommercialPageAdmin } from '../../../../core/services/commercial-page-admin/commercial-page-admin';
import { UiToast } from '../../../../core/services/ui-toast/ui-toast';
import type { CommercialPageAdminDetail } from '../../../../core/types/commercial-page-admin';
import { LoadingOverlay } from '../../../../public/common/loading-overlay/loading-overlay';
import { createAdminCommercialPagesI18n } from '../admin-commercial-pages.i18n';
import { CommercialPageMetadataEditor } from './commercial-page-metadata-editor';
import { CommercialPageSectionsEditor } from './commercial-page-sections-editor';
import { CommercialPageSeoEditor } from './commercial-page-seo-editor';

@Component({
  selector: 'app-commercial-page-editor',
  imports: [
    ReactiveFormsModule,
    ButtonModule,
    LoadingOverlay,
    CommercialPageMetadataEditor,
    CommercialPageSectionsEditor,
    CommercialPageSeoEditor,
  ],
  templateUrl: './commercial-page-editor.html',
  providers: [provideTranslocoScope('adminCommercialPages', 'common')],
})
export class CommercialPageEditor {
  private readonly pages = inject(CommercialPageAdmin);
  private readonly router = inject(Router);
  private readonly toast = inject(UiToast);

  protected readonly pageId =
    inject(ActivatedRoute).snapshot.paramMap.get('id') ?? '';
  protected readonly i18n = createAdminCommercialPagesI18n();
  protected readonly form = createCommercialPageEditorForm();
  protected readonly detail = signal<CommercialPageAdminDetail | null>(null);
  protected readonly isLoading = signal(true);
  protected readonly isSaving = signal(false);
  protected readonly hasLoadError = signal(false);

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

    this.pages
      .getDetail(this.pageId)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (detail) => this.applyDetail(detail),
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
    this.form.markAllAsTouched();

    if (this.form.invalid) {
      const formCopy = this.i18n.commonForm();

      this.toast.danger({
        summary: formCopy.invalidSummary,
        detail: formCopy.invalid,
      });
      return;
    }

    const detail = this.detail();
    if (!detail) return;

    const document = mapCommercialPageEditorFormToDocument(
      this.form,
      detail.draft,
    );
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
    if (this.isSaving()) return;

    void this.router.navigate(['/admin/offers']);
  }

  private applyDetail(detail: CommercialPageAdminDetail): void {
    this.detail.set(detail);
    resetCommercialPageEditorForm(this.form, detail.draft);
  }
}
