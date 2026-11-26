import { afterNextRender, computed, DestroyRef, inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, defer, EMPTY, finalize, forkJoin, map, type Observable, tap } from 'rxjs';

import type { IPdfPreview } from '../../../core/interfaces/i-pdf';
import { AdminContractTemplates } from '../../../core/services/admin-contract-templates/admin-contract-templates';
import type { ContractFamily, ContractTemplate, ContractTemplateUpload } from '../../../core/services/admin-contract-templates/admin-contract-templates.contract';
import { Platform } from '../../../core/services/platform/platform';
import { UiToast } from '../../../core/services/ui-toast/ui-toast';
import { EdgeFunctionError } from '../../../core/types/edge-function-error';
import { isEdgeMutationResultUncertain } from '../../../core/utils/edge-function-error-mapping';
import { createAdminContractTemplatesI18n } from './admin-contract-templates.i18n';

type CatalogStatus = 'initial' | 'loading' | 'ready' | 'error';
type TemplateChange = 'upload' | 'family';
type TemplateDeletion = {
  templateId: string;
  filename: string;
  confirmActive: boolean;
};
type TemplateMutation =
  | { kind: TemplateChange }
  | { kind: 'renameFamily' }
  | { kind: 'delete'; deletion: TemplateDeletion };
type PendingTemplateDeletion = TemplateDeletion & { outcome: 'unknown' | 'cleanupFailed' };

@Injectable()
export class ContractTemplatesFacade {
  private readonly api = inject(AdminContractTemplates);
  private readonly platform = inject(Platform);
  private readonly toast = inject(UiToast);
  private readonly destroyRef = inject(DestroyRef);
  private readonly i18n = createAdminContractTemplatesI18n();

  private readonly status = signal<CatalogStatus>('initial');
  private readonly rows = signal<ContractTemplate[]>([]);
  private readonly familyRows = signal<ContractFamily[]>([]);
  private readonly mutating = signal(false);
  private readonly fileLoading = signal(false);
  private readonly currentPreview = signal<IPdfPreview | null>(null);
  private readonly uncertainMutation = signal<TemplateChange | null>(null);
  private readonly incompleteDeletions = signal<PendingTemplateDeletion[]>([]);
  private readonly familyRenameFailure = signal<'conflict' | 'unknown' | null>(null);

  readonly templates = this.rows.asReadonly();
  readonly familiesByKey = computed(() => new Map(this.familyRows().map((family) => [family.family, family])));
  readonly familyOptions = computed(() => this.familyRows().map(({ family, label }) => ({ value: family, label })));
  readonly renameIssue = this.familyRenameFailure.asReadonly();
  readonly saving = this.mutating.asReadonly();
  readonly loading = computed(() => this.status() === 'initial' || this.status() === 'loading');
  readonly loadFailed = computed(() => this.status() === 'error');
  readonly busy = computed(() => this.loading() || this.saving() || this.fileLoading());
  readonly canAct = computed(() => this.status() === 'ready' && !this.busy());
  readonly pendingDeletions = this.incompleteDeletions.asReadonly();
  readonly preview = this.currentPreview.asReadonly();
  readonly notice = computed(() => {
    const copy = this.i18n.copy();
    const outcome = this.uncertainMutation();
    return outcome === 'upload' ? copy.uploadUncertain : outcome === 'family' ? this.i18n.editor().familyUncertain : null;
  });

  constructor() {
    afterNextRender(() => this.refresh());
  }

  refresh(): void {
    if (this.status() === 'loading' || this.saving() || this.fileLoading()) return;
    this.readCatalog();
  }

  upload(upload: ContractTemplateUpload): Observable<void> {
    return this.mutate({ kind: 'upload' }, () => this.api.upload(upload));
  }

  createFamily(family: string, label: string): Observable<void> {
    return this.mutate({ kind: 'family' }, () => this.api.createFamily(family, label));
  }

  renameFamily(current: ContractFamily, label: string): Observable<void> {
    return this.mutate({ kind: 'renameFamily' }, () => this.api.renameFamily(current, label));
  }

  clearRenameIssue(): void {
    this.familyRenameFailure.set(null);
  }

  deleteTemplate(template: ContractTemplate): Observable<void> {
    if (!this.findTemplate(template.template_id)?.can_delete) return EMPTY;
    return this.runDeletion({
      templateId: template.template_id,
      filename: template.original_filename,
      confirmActive: template.status === 'active',
    });
  }

  retryDeletion(deletion: PendingTemplateDeletion): void {
    this.runDeletion(deletion).pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
  }

  openFile(templateId: string, preview: boolean): void {
    const status = this.findTemplate(templateId)?.status;
    if (!this.canAct() || (status !== 'staged' && status !== 'active')) return;
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
    forkJoin({ templates: this.api.list(), families: this.api.listFamilies() })
      .pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: ({ templates, families }) => {
        const keys = new Set(families.map(({ family }) => family));
        if (keys.size !== families.length || templates.some(({ family }) => !keys.has(family))) {
          this.status.set('error');
          return;
        }
        this.familyRows.set(families);
        this.rows.set(templates);
        this.status.set('ready');
      },
      error: () => this.status.set('error'),
    });
  }

  private runDeletion(deletion: TemplateDeletion): Observable<void> {
    return this.mutate({ kind: 'delete', deletion }, () =>
      this.api.deleteTemplate(deletion.templateId, deletion.confirmActive));
  }

  private mutate(mutation: TemplateMutation, request: () => Observable<unknown>): Observable<void> {
    return defer(() => {
      const { kind } = mutation;
      if (kind === 'delete' ? this.busy() : !this.canAct()) return EMPTY;
      this.mutating.set(true);
      if (kind !== 'delete') this.uncertainMutation.set(null);
      return defer(request).pipe(
        map(() => {
          const { uploaded, deleted } = this.i18n.copy();
          if (kind === 'delete') {
            this.incompleteDeletions.update((deletions) =>
              deletions.filter(({ templateId }) => templateId !== mutation.deletion.templateId));
          }
          const message = {
            upload: uploaded,
            family: this.i18n.editor().familyCreated,
            renameFamily: this.i18n.status().changesSaved,
            delete: deleted,
          }[kind];
          this.toast.success({ summary: message });
          this.readCatalog();
        }),
        catchError((error: unknown) => {
          this.handleMutationFailure(mutation, error);
          this.readCatalog();
          return EMPTY;
        }),
        finalize(() => this.mutating.set(false)),
      );
    });
  }

  private handleMutationFailure(mutation: TemplateMutation, error: unknown): void {
    const { kind } = mutation;
    const uncertain = !(error instanceof EdgeFunctionError) ||
      (error.code !== 'UPLOAD_FAILED' && isEdgeMutationResultUncertain(error));
    if (kind === 'delete') {
      const cleanupFailed = error instanceof EdgeFunctionError && error.code === 'POST_COMMIT_STORAGE_CLEANUP_FAILED';
      if (cleanupFailed || uncertain) {
        const { deletion } = mutation;
        this.incompleteDeletions.update((deletions) => {
          const previous = deletions.find(({ templateId }) => templateId === deletion.templateId);
          const outcome = cleanupFailed || previous?.outcome === 'cleanupFailed' ? 'cleanupFailed' : 'unknown';
          return [...deletions.filter(({ templateId }) => templateId !== deletion.templateId), { ...deletion, outcome }];
        });
        return;
      }
    } else if (kind === 'renameFamily') {
      if (uncertain) {
        this.familyRenameFailure.set('unknown');
        return;
      }
      if (error instanceof EdgeFunctionError && error.status === 409) {
        this.familyRenameFailure.set('conflict');
        return;
      }
    } else if (uncertain) {
      this.uncertainMutation.set(kind);
      return;
    }

    const { uploadFailed, deleteFailed } = this.i18n.copy();
    const { familyFailed, renameFamilyFailed } = this.i18n.editor();
    const fallback = { upload: uploadFailed, family: familyFailed, renameFamily: renameFamilyFailed, delete: deleteFailed }[kind];
    this.toast.danger({ summary: this.errorMessage(error, fallback) });
  }

  private findTemplate(templateId: string): ContractTemplate | undefined {
    return this.rows().find((template) => template.template_id === templateId);
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
