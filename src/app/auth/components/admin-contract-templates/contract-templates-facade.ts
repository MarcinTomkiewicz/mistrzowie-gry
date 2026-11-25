import { afterNextRender, computed, DestroyRef, inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, defer, EMPTY, finalize, map, type Observable, tap } from 'rxjs';

import type { IPdfPreview } from '../../../core/interfaces/i-pdf';
import { AdminContractTemplates } from '../../../core/services/admin-contract-templates/admin-contract-templates';
import type { ContractTemplate, ContractTemplateUpload } from '../../../core/services/admin-contract-templates/admin-contract-templates.contract';
import { Platform } from '../../../core/services/platform/platform';
import { UiToast } from '../../../core/services/ui-toast/ui-toast';
import { EdgeFunctionError } from '../../../core/types/edge-function-error';
import { isEdgeMutationResultUncertain } from '../../../core/utils/edge-function-error-mapping';
import { createAdminContractTemplatesI18n } from './admin-contract-templates.i18n';

type CatalogStatus = 'initial' | 'loading' | 'ready' | 'error';
type TemplateMutation = 'upload' | 'activation';

@Injectable()
export class ContractTemplatesFacade {
  private readonly api = inject(AdminContractTemplates);
  private readonly platform = inject(Platform);
  private readonly toast = inject(UiToast);
  private readonly destroyRef = inject(DestroyRef);
  private readonly i18n = createAdminContractTemplatesI18n();

  private readonly status = signal<CatalogStatus>('initial');
  private readonly rows = signal<ContractTemplate[]>([]);
  private readonly mutation = signal<TemplateMutation | null>(null);
  private readonly fileLoading = signal(false);
  private readonly currentPreview = signal<IPdfPreview | null>(null);
  private readonly uncertainMutation = signal<TemplateMutation | null>(null);

  readonly templates = this.rows.asReadonly();
  readonly saving = computed(() => this.mutation() !== null);
  readonly loading = computed(() => this.status() === 'initial' || this.status() === 'loading');
  readonly loadFailed = computed(() => this.status() === 'error');
  readonly busy = computed(() => this.loading() || this.saving() || this.fileLoading());
  readonly canAct = computed(() => this.status() === 'ready' && !this.busy());
  readonly preview = this.currentPreview.asReadonly();
  readonly notice = computed(() => {
    const copy = this.i18n.copy();
    const outcome = this.uncertainMutation();
    return outcome === 'upload' ? copy.uploadUncertain : outcome === 'activation' ? copy.activationUncertain : null;
  });

  constructor() {
    afterNextRender(() => this.refresh());
  }

  refresh(): void {
    if (this.status() === 'loading' || this.saving() || this.fileLoading()) return;
    this.readCatalog();
  }

  upload(upload: ContractTemplateUpload): Observable<void> {
    return this.mutate('upload', () => this.api.upload(upload));
  }

  activate(templateId: string, approvalReference: string): Observable<void> {
    return defer(() => {
      if (!this.hasStatus(templateId, 'staged')) return EMPTY;
      return this.mutate('activation', () => this.api.approve(templateId, approvalReference));
    });
  }

  openFile(templateId: string, preview: boolean): void {
    if (!this.canAct() || !this.hasStatus(templateId, 'active')) return;
    this.fileLoading.set(true);
    const request: Observable<unknown> = preview
      ? this.api.getDownloadUrl(templateId).pipe(tap(({ url, filename }) =>
        this.currentPreview.set({ url, title: filename })))
      : this.api.downloadPdf(templateId).pipe(tap(({ blob, filename }) =>
        this.platform.downloadBlob(blob, filename)));
    request.pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.fileLoading.set(false)),
    ).subscribe({
      error: (error: unknown) => this.toast.danger({ summary: this.errorMessage(error, this.i18n.copy().fileFailed) }),
    });
  }

  closePreview(): void {
    this.currentPreview.set(null);
  }

  private readCatalog(): void {
    this.status.set('loading');
    this.api.list().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (templates) => {
        this.rows.set(templates);
        this.status.set('ready');
      },
      error: () => this.status.set('error'),
    });
  }

  private mutate(kind: TemplateMutation, request: () => Observable<unknown>): Observable<void> {
    return defer(() => {
      if (!this.canAct()) return EMPTY;
      this.mutation.set(kind);
      this.uncertainMutation.set(null);
      return defer(request).pipe(
        map(() => {
          const copy = this.i18n.copy();
          this.toast.success({ summary: kind === 'upload' ? copy.uploaded : copy.activated });
          this.readCatalog();
        }),
        catchError((error: unknown) => {
          const copy = this.i18n.copy();
          if (!(error instanceof EdgeFunctionError) ||
              (error.code !== 'UPLOAD_FAILED' && isEdgeMutationResultUncertain(error))) {
            this.uncertainMutation.set(kind);
          } else {
            const fallback = kind === 'upload' ? copy.uploadFailed : copy.activationFailed;
            this.toast.danger({ summary: this.errorMessage(error, fallback) });
          }
          this.readCatalog();
          return EMPTY;
        }),
        finalize(() => this.mutation.set(null)),
      );
    });
  }

  private hasStatus(templateId: string, status: ContractTemplate['status']): boolean {
    return this.rows().some((template) => template.template_id === templateId && template.status === status);
  }

  private errorMessage(error: unknown, fallback: string): string {
    if (error instanceof EdgeFunctionError) {
      const common = this.i18n.errors();
      if (error.status === 401) return common.sessionExpired;
      if (error.status === 403) return common.accessDenied;
    }
    return fallback;
  }
}
