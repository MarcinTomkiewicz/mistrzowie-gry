import { AbstractControl, ReactiveFormsModule } from '@angular/forms';
import { HttpStatusCode } from '@angular/common/http';
import { Component, computed, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { provideTranslocoScope } from '@jsverse/transloco';
import { ButtonModule } from 'primeng/button';
import { IftaLabelModule } from 'primeng/iftalabel';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { finalize, map, of, switchMap } from 'rxjs';

import { STATUS_BADGE_CLASS } from '../../../../core/configs/badge-class.config';
import { COWORKER_DOCUMENT_SHELL_LIMITS } from '../../../../core/configs/coworker-documents.config';
import {
  IAdminOperationalCatalog,
} from '../../../../core/interfaces/i-admin-operational-catalog';
import {
  IAdminOperationalDocumentDetail,
} from '../../../../core/interfaces/i-admin-operational-document';
import { AdminCoworkerOperationalDocuments } from '../../../../core/services/admin-coworker-operational-documents/admin-coworker-operational-documents';
import { UiToast } from '../../../../core/services/ui-toast/ui-toast';
import { ADMIN_OPERATIONAL_ERROR_CODE } from '../../../../core/types/admin-operational-document';
import { EdgeFunctionError } from '../../../../core/types/edge-function-error';
import { formatTimestampLabel } from '../../../../core/utils/date';
import {
  isEdgeAccessError,
  isEdgeMutationResultUncertain,
  normalizeEdgeFunctionError,
} from '../../../../core/utils/edge-function-error-mapping';
import {
  resolveEdgeFormFieldError,
  setControlEnabled,
} from '../../../../core/utils/form-controls';
import { CharacterCounter } from '../../../../public/common/character-counter/character-counter';
import { ContextHelp } from '../../../../public/common/context-help/context-help';
import { LoadingOverlay } from '../../../../public/common/loading-overlay/loading-overlay';
import { resolveAdminOperationalError } from '../admin-operational-document-errors';
import { createAdminOperationalDocumentsI18n } from '../admin-operational-documents.i18n';
import { VersionEditor } from '../version-editor/version-editor';
import { VersionHistory } from '../version-history/version-history';
import {
  createAdminOperationalDocumentForm,
  mapAdminOperationalDocumentForm,
  populateAdminOperationalDocumentForm,
} from './document-form';

@Component({
  selector: 'app-admin-operational-document-editor',
  standalone: true,
  imports: [
    RouterLink,
    ReactiveFormsModule,
    ButtonModule,
    IftaLabelModule,
    InputTextModule,
    TextareaModule,
    CharacterCounter,
    ContextHelp,
    LoadingOverlay,
    VersionEditor,
    VersionHistory,
  ],
  templateUrl: './document-editor.html',
  providers: [
    provideTranslocoScope('adminCoworkerOperationalDocuments', 'common'),
  ],
})
export class DocumentEditor {
  private readonly documents = inject(AdminCoworkerOperationalDocuments);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly toast = inject(UiToast);
  private readonly documentId = this.route.snapshot.paramMap.get('documentId');
  private formRevision: number | null = null;

  protected readonly i18n = createAdminOperationalDocumentsI18n();
  protected readonly limits = COWORKER_DOCUMENT_SHELL_LIMITS;
  protected readonly STATUS_BADGE_CLASS = STATUS_BADGE_CLASS;
  protected readonly formatTimestampLabel = formatTimestampLabel;
  protected readonly form = createAdminOperationalDocumentForm();
  protected readonly catalog = signal<IAdminOperationalCatalog | null>(null);
  protected readonly document = signal<IAdminOperationalDocumentDetail | null>(null);
  protected readonly isLoading = signal(true);
  protected readonly isSaving = signal(false);
  protected readonly versionBusy = signal(false);
  protected readonly detailReloadRequired = signal(false);
  protected readonly loadError = signal<EdgeFunctionError | null>(null);
  protected readonly actionError = signal<EdgeFunctionError | null>(null);
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
          this.i18n.errors().save,
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
    effect(() => setControlEnabled(this.form, !this.formDisabled()));
    this.form.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.actionError.set(null));
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
            this.actionError.set(null);
            this.populateShellForm(null);
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
          this.actionError.set(null);
          this.populateShellForm(document);
        },
        error: (error) => this.handleLoadError(error),
      });
  }

  protected saveDocument(): void {
    const catalog = this.catalog();
    const currentDocument = this.document();
    if (
      this.form.invalid ||
      this.formDisabled() ||
      catalog === null ||
      (this.documentId !== null && currentDocument === null)
    ) {
      this.form.markAllAsTouched();
      return;
    }

    const payload = mapAdminOperationalDocumentForm(
      this.form,
      this.documentId,
    );
    this.isSaving.set(true);
    this.actionError.set(null);
    this.documents
      .saveDocument(payload, catalog, this.formRevision)
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
          this.populateShellForm(document);
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

  protected reloadAfterConflict(): void {
    this.loadInitialEditor();
  }

  protected reloadDocumentDetail(): void {
    const catalog = this.catalog();
    const currentDocument = this.document();
    if (catalog === null || currentDocument === null || this.isLoading()) return;

    const preserveShell = this.form.dirty;
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
            this.populateShellForm(document);
          }
        },
        error: (error) => {
          this.loadError.set(
            normalizeEdgeFunctionError(error, this.i18n.errors().load),
          );
        },
      });
  }

  protected fieldError(
    control: AbstractControl<unknown>,
    fieldPath: string,
  ): string | null {
    const serverError = resolveEdgeFormFieldError(
      control,
      fieldPath,
      this.actionError(),
      this.i18n.commonForm(),
    );
    if (
      fieldPath === 'document.code' &&
      control.touched &&
      control.hasError('pattern') &&
      !this.actionError()?.fieldErrors[fieldPath]
    ) {
      return this.i18n.validation().codePattern;
    }
    return serverError;
  }

  private handleLoadError(error: unknown): void {
    this.catalog.set(null);
    this.document.set(null);
    this.actionError.set(null);
    this.detailReloadRequired.set(false);
    this.formRevision = null;
    this.loadError.set(
      normalizeEdgeFunctionError(error, this.i18n.errors().load),
    );
  }

  private populateShellForm(
    document: IAdminOperationalDocumentDetail | null,
  ): void {
    populateAdminOperationalDocumentForm(this.form, document);
    this.formRevision = document?.revision ?? null;
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
