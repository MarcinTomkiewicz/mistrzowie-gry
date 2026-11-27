import { afterNextRender, computed, DestroyRef, inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, defer, EMPTY, finalize, forkJoin, map, type Observable, tap } from 'rxjs';

import type { IPdfPreview } from '../../../core/interfaces/i-pdf';
import { AdminContractTemplates } from '../../../core/services/admin-contract-templates/admin-contract-templates';
import type { ContractConfiguration, ContractFamily, ContractTemplate, ContractTemplateUpload } from '../../../core/services/admin-contract-templates/admin-contract-templates.contract';
import { Platform } from '../../../core/services/platform/platform';
import { UiToast } from '../../../core/services/ui-toast/ui-toast';
import { EdgeFunctionError } from '../../../core/types/edge-function-error';
import { isEdgeMutationResultUncertain } from '../../../core/utils/edge-function-error-mapping';
import { createAdminContractTemplatesI18n } from './admin-contract-templates.i18n';

type CatalogStatus = 'initial' | 'loading' | 'ready' | 'error';
type MutationReview = 'conflict' | 'unknown';
type TemplateChange = 'upload' | 'family';
type TemplateDeletion = {
  templateId: string;
  filename: string;
  confirmActive: boolean;
};
type TemplateMutation =
  | { kind: TemplateChange }
  | { kind: 'renameFamily' }
  | { kind: 'reassignTemplate'; template: ContractTemplate }
  | { kind: 'delete'; deletion: TemplateDeletion };
type PendingTemplateDeletion = TemplateDeletion & { outcome: 'unknown' | 'cleanupFailed' };
type ReassignmentReview = MutationReview | 'changed';
type TemplateReassignment = { template: ContractTemplate; review: ReassignmentReview | null } & (
  { state: 'loading' } | { state: 'error'; message: string } | { state: 'ready'; snapshot: ContractConfiguration }
);

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
  private readonly familyRenameFailure = signal<MutationReview | null>(null);
  private readonly reassignmentState = signal<TemplateReassignment | null>(null);

  readonly templates = this.rows.asReadonly();
  readonly familiesByKey = computed(() => new Map(this.familyRows().map((family) => [family.family, family])));
  readonly familyOptions = computed(() => this.familyRows().map(({ family, label }) => ({ value: family, label })));
  readonly renameIssue = this.familyRenameFailure.asReadonly();
  readonly saving = this.mutating.asReadonly();
  readonly loading = computed(() => this.status() === 'initial' || this.status() === 'loading');
  readonly loadFailed = computed(() => this.status() === 'error');
  readonly busy = computed(() => this.loading() || this.saving() || this.fileLoading());
  readonly canAct = computed(() => this.status() === 'ready' && !this.busy());
  readonly reassignment = this.reassignmentState.asReadonly();
  readonly reassignmentMatchesCatalog = computed(() => {
    const change = this.reassignment();
    if (change?.state !== 'ready') return false;
    const { snapshot } = change;
    const row = this.findTemplate(snapshot.template_id);
    return row?.family === snapshot.family && row.status === snapshot.status &&
      row.pdf_sha256 === snapshot.pdf_sha256 && this.familiesByKey().has(snapshot.family);
  });
  readonly canChooseReassignment = computed(() => {
    const change = this.reassignment();
    return change?.state === 'ready' && change.snapshot.status === 'staged' && change.review === null &&
      this.canAct() && this.reassignmentMatchesCatalog();
  });
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

  openReassignment(template: ContractTemplate): void {
    if (this.canAct() && template.status === 'staged') this.readReassignment(template, null);
  }

  closeReassignment(): void {
    if (!this.saving()) this.reassignmentState.set(null);
  }

  refreshReassignment(): void {
    const change = this.reassignment();
    if (!change || change.state === 'loading' || this.busy()) return;
    this.readReassignment(change.template, change.review ?? (change.state === 'ready' ? 'changed' : null));
    this.refresh();
  }

  confirmReassignmentContext(): void {
    const change = this.reassignment();
    if (change?.state === 'ready' && change.review && change.snapshot.status === 'staged' &&
        this.canAct() && this.reassignmentMatchesCatalog()) {
      this.reassignmentState.set({ ...change, review: null });
    }
  }

  reassignTemplate(target: string | null): void {
    const change = this.reassignment();
    if (change?.state !== 'ready' || !this.canChooseReassignment() || target === null ||
        target === change.snapshot.family || !this.familiesByKey().has(target)) return;
    this.mutate({ kind: 'reassignTemplate', template: change.template }, () =>
      this.api.reassignTemplate(change.snapshot, target)).pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.closePreview();
        this.reassignmentState.set(null);
      });
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

  private readReassignment(template: ContractTemplate, review: ReassignmentReview | null): void {
    const reading = { template, review, state: 'loading' } as const;
    this.reassignmentState.set(reading);
    const fail = (message: string) => this.reassignmentState.set({ ...reading, state: 'error', message });
    this.api.getConfiguration(template.template_id, 'catalog').pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (snapshot) => {
        if (this.reassignment() !== reading) return;
        if (snapshot.pdf_sha256 !== template.pdf_sha256) {
          fail(this.i18n.reassignment().readFailed);
          return;
        }
        const changed = snapshot.family !== template.family || snapshot.status !== template.status;
        this.reassignmentState.set({ template, snapshot, state: 'ready', review: review ?? (changed ? 'changed' : null) });
        if (!review && changed) this.refresh();
      },
      error: (error: unknown) => {
        if (this.reassignment() !== reading) return;
        fail(error instanceof EdgeFunctionError && error.status === 404 ? this.i18n.errors().notFound :
          this.errorMessage(error, this.i18n.reassignment().readFailed));
      },
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
            reassignTemplate: this.i18n.status().changesSaved,
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
    const status = error instanceof EdgeFunctionError ? error.status : null;
    const review = uncertain ? 'unknown' : status === 409 ? 'conflict' : null;
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
    } else if (kind === 'renameFamily' || kind === 'reassignTemplate') {
      if (review) {
        if (kind === 'renameFamily') this.familyRenameFailure.set(review);
        else this.readReassignment(mutation.template, review);
        return;
      }
      if (kind === 'reassignTemplate' && status === 404) this.readReassignment(mutation.template, null);
    } else if (uncertain) {
      this.uncertainMutation.set(kind);
      return;
    }

    const { uploadFailed, deleteFailed } = this.i18n.copy();
    const { familyFailed, renameFamilyFailed } = this.i18n.editor();
    const fallback = {
      upload: uploadFailed, family: familyFailed, renameFamily: renameFamilyFailed,
      reassignTemplate: this.i18n.reassignment().failed, delete: deleteFailed,
    }[kind];
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
