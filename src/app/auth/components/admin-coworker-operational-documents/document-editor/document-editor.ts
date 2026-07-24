import { HttpStatusCode } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { provideTranslocoScope } from '@jsverse/transloco';
import { ButtonModule } from 'primeng/button';
import { finalize, map, of, switchMap } from 'rxjs';

import {
  IAdminOperationalCatalog,
} from '../../../../core/interfaces/i-admin-operational-catalog';
import {
  IAdminOperationalDocumentDetail,
} from '../../../../core/interfaces/i-admin-operational-document';
import { AdminCoworkerOperationalDocuments } from '../../../../core/services/admin-coworker-operational-documents/admin-coworker-operational-documents';
import { UiConfirm } from '../../../../core/services/ui-confirm/ui-confirm';
import { UiToast } from '../../../../core/services/ui-toast/ui-toast';
import { ADMIN_OPERATIONAL_ERROR_CODE } from '../../../../core/types/admin-operational-document';
import type { AdminOperationalDocumentFormSubmission } from '../../../../core/types/admin-operational-forms';
import { EdgeFunctionError } from '../../../../core/types/edge-function-error';
import {
  isEdgeAccessError,
  isEdgeMutationResultUncertain,
  normalizeEdgeFunctionError,
} from '../../../../core/utils/edge-function-error-mapping';
import { LoadingOverlay } from '../../../../public/common/loading-overlay/loading-overlay';
import { resolveAdminOperationalError } from '../admin-operational-document-errors';
import {
  createAdminOperationalDocumentsI18n,
  OPERATIONAL_DOCUMENTS_ADMIN_SCOPE,
} from '../admin-operational-documents.i18n';
import { DocumentShellForm } from '../document-shell-form/document-shell-form';
import { VersionEditor } from '../version-editor/version-editor';
import { VersionHistory } from '../version-history/version-history';

@Component({
  selector: 'app-admin-operational-document-editor',
  standalone: true,
  imports: [
    RouterLink,
    ButtonModule,
    DocumentShellForm,
    LoadingOverlay,
    VersionEditor,
    VersionHistory,
  ],
  templateUrl: './document-editor.html',
  providers: [
    provideTranslocoScope(OPERATIONAL_DOCUMENTS_ADMIN_SCOPE, 'common'),
  ],
})
export class DocumentEditor {
  private readonly documents = inject(AdminCoworkerOperationalDocuments);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly confirm = inject(UiConfirm);
  private readonly toast = inject(UiToast);
  private readonly documentId = this.route.snapshot.paramMap.get('documentId');

  protected readonly i18n = createAdminOperationalDocumentsI18n();
  protected readonly catalog = signal<IAdminOperationalCatalog | null>(null);
  protected readonly document = signal<IAdminOperationalDocumentDetail | null>(null);
  protected readonly shellDocument =
    signal<IAdminOperationalDocumentDetail | null>(null);
  protected readonly shellDirty = signal(false);
  protected readonly isLoading = signal(true);
  protected readonly isSaving = signal(false);
  protected readonly isArchiving = signal(false);
  protected readonly versionBusy = signal(false);
  protected readonly detailReloadRequired = signal(false);
  protected readonly loadError = signal<EdgeFunctionError | null>(null);
  protected readonly actionError = signal<EdgeFunctionError | null>(null);
  protected readonly actionErrorFallback = signal<string | null>(null);
  protected readonly isCreate = this.documentId === null;
  protected readonly isArchived = computed(
    () => this.document()?.status === 'archived',
  );
  protected readonly isAccessBlocked = computed(
    () =>
      isEdgeAccessError(this.loadError()) ||
      isEdgeAccessError(this.actionError()),
  );
  protected readonly formDisabled = computed(
    () =>
      this.isLoading() ||
      this.isSaving() ||
      this.isArchiving() ||
      this.versionBusy() ||
      this.detailReloadRequired() ||
      this.isArchived() ||
      this.isAccessBlocked(),
  );
  protected readonly loadErrorDescription = computed(() => {
    const error = this.loadError();
    return error
      ? resolveAdminOperationalError(
          error,
          this.i18n.errors(),
          this.i18n.errors().load,
        )
      : '';
  });
  protected readonly actionErrorDescription = computed(() => {
    const error = this.actionError();
    return error
      ? resolveAdminOperationalError(
          error,
          this.i18n.errors(),
          this.actionErrorFallback() ?? this.i18n.errors().save,
        )
      : '';
  });
  protected readonly reloadSuggested = computed(
    () =>
      !this.isCreate &&
      !this.detailReloadRequired() &&
      this.actionError()?.code === ADMIN_OPERATIONAL_ERROR_CODE.conflict,
  );

  constructor() {
    this.loadInitialEditor();
  }

  protected loadInitialEditor(): void {
    const documentId = this.documentId;
    this.isLoading.set(true);
    this.detailReloadRequired.set(false);
    this.loadError.set(null);

    if (documentId === null) {
      this.documents
        .getDashboard()
        .pipe(finalize(() => this.isLoading.set(false)))
        .subscribe({
          next: (dashboard) => {
            this.catalog.set(dashboard.catalog);
            this.document.set(null);
            this.shellDocument.set(null);
            this.actionError.set(null);
          },
          error: (error) => this.handleLoadError(error),
        });
      return;
    }

    this.documents
      .getDashboard()
      .pipe(
        switchMap((dashboard) =>
          this.documents
            .getDocumentDetail(documentId, dashboard.catalog)
            .pipe(map((document) => ({ dashboard, document }))),
        ),
        finalize(() => this.isLoading.set(false)),
      )
      .subscribe({
        next: ({ dashboard, document }) => {
          this.catalog.set(dashboard.catalog);
          this.document.set(document);
          this.shellDocument.set(document);
          this.actionError.set(null);
        },
        error: (error) => this.handleLoadError(error),
      });
  }

  protected saveDocument(
    submission: AdminOperationalDocumentFormSubmission,
  ): void {
    const catalog = this.catalog();
    const currentDocument = this.document();
    if (
      this.formDisabled() ||
      catalog === null ||
      (this.documentId !== null && currentDocument === null)
    ) {
      return;
    }

    const payload = submission.document;
    this.isSaving.set(true);
    this.actionError.set(null);
    this.actionErrorFallback.set(this.i18n.errors().save);
    this.documents
      .saveDocument(payload, catalog, submission.revision)
      .pipe(finalize(() => this.isSaving.set(false)))
      .subscribe({
        next: (document) => {
          this.toast.success({
            summary: this.i18n.messages().savedSummary,
            detail: this.isCreate
              ? this.i18n.messages().created
              : this.i18n.messages().updated,
          });
          if (this.isCreate) {
            void this.router.navigate(
              [
                '/admin/coworkers/operational-documents',
                document.id,
                'edit',
              ],
              { replaceUrl: true },
            );
            return;
          }
          this.document.set(document);
          this.shellDocument.set(document);
        },
        error: (error) => {
          const normalizedError = normalizeEdgeFunctionError(
            error,
            this.i18n.errors().save,
          );
          if (
            isEdgeAccessError(normalizedError) ||
            (!this.isCreate &&
              (normalizedError.status === HttpStatusCode.NotFound ||
                normalizedError.code === ADMIN_OPERATIONAL_ERROR_CODE.notFound))
          ) {
            this.handleLoadError(normalizedError);
            return;
          }
          this.actionError.set(normalizedError);
          if (isEdgeMutationResultUncertain(normalizedError)) {
            if (payload.id === null) {
              this.recoverCreatedDocument(payload.code);
              return;
            }
            this.reloadDocumentDetail();
          }
        },
      });
  }

  protected confirmArchive(event: Event): void {
    const document = this.document();
    const catalog = this.catalog();
    if (
      document === null ||
      catalog === null ||
      this.formDisabled() ||
      document.status === 'archived'
    ) {
      return;
    }

    this.confirm.dangerDecision(event, {
      message: this.i18n.messages().archiveConfirmation,
      acceptLabel: this.i18n.actions().archiveDocument,
      rejectLabel: this.i18n.commonActions().cancel,
      accept: () => this.archiveDocument(document.id, catalog),
    });
  }

  protected reloadAfterConflict(): void {
    this.loadInitialEditor();
  }

  protected reloadDocumentDetail(): void {
    const catalog = this.catalog();
    const currentDocument = this.document();
    if (catalog === null || currentDocument === null || this.isLoading()) return;

    const preserveShell = this.shellDirty();
    this.isLoading.set(true);
    this.detailReloadRequired.set(true);
    this.loadError.set(null);
    this.documents
      .getDocumentDetail(currentDocument.id, catalog)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (document) => {
          this.document.set(document);
          this.detailReloadRequired.set(false);
          if (!preserveShell) {
            this.shellDocument.set(document);
          }
        },
        error: (error) => {
          this.loadError.set(
            normalizeEdgeFunctionError(error, this.i18n.errors().load),
          );
        },
      });
  }

  private handleLoadError(error: unknown): void {
    this.catalog.set(null);
    this.document.set(null);
    this.shellDocument.set(null);
    this.shellDirty.set(false);
    this.actionError.set(null);
    this.detailReloadRequired.set(false);
    this.loadError.set(
      normalizeEdgeFunctionError(error, this.i18n.errors().load),
    );
  }

  private archiveDocument(
    documentId: string,
    catalog: IAdminOperationalCatalog,
  ): void {
    this.isArchiving.set(true);
    this.actionError.set(null);
    this.actionErrorFallback.set(this.i18n.errors().archive);
    this.documents
      .archiveDocument(documentId, catalog)
      .pipe(finalize(() => this.isArchiving.set(false)))
      .subscribe({
        next: (document) => {
          this.document.set(document);
          this.shellDocument.set(document);
          this.toast.success({
            summary: this.i18n.messages().archivedSummary,
            detail: this.i18n.messages().archived,
          });
        },
        error: (error) => {
          const normalized = normalizeEdgeFunctionError(
            error,
            this.i18n.errors().archive,
          );
          if (
            isEdgeAccessError(normalized) ||
            normalized.status === HttpStatusCode.NotFound ||
            normalized.code === ADMIN_OPERATIONAL_ERROR_CODE.notFound
          ) {
            this.handleLoadError(normalized);
            return;
          }
          this.actionError.set(normalized);
          if (isEdgeMutationResultUncertain(normalized)) {
            this.reloadDocumentDetail();
          }
        },
      });
  }

  private recoverCreatedDocument(code: string): void {
    this.isLoading.set(true);
    this.loadError.set(null);
    this.documents
      .getDashboard()
      .pipe(
        switchMap((dashboard) => {
          const createdDocument = dashboard.documents.find(
            (document) => document.code === code,
          );
          if (createdDocument === undefined) {
            return of({ dashboard, document: null });
          }
          return this.documents
            .getDocumentDetail(createdDocument.id, dashboard.catalog)
            .pipe(map((document) => ({ dashboard, document })));
        }),
        finalize(() => this.isLoading.set(false)),
      )
      .subscribe({
        next: ({ dashboard, document }) => {
          this.catalog.set(dashboard.catalog);
          if (document === null) return;

          this.actionError.set(null);
          void this.router.navigate(
            [
              '/admin/coworkers/operational-documents',
              document.id,
              'edit',
            ],
            { replaceUrl: true },
          );
        },
        error: (error) => this.handleLoadError(error),
      });
  }
}
