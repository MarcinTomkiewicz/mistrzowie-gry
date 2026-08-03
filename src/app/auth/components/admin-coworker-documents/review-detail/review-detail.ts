import { HttpStatusCode } from '@angular/common/http';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { provideTranslocoScope } from '@jsverse/transloco';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { finalize, Observable } from 'rxjs';

import { IAdminCoworkerDocumentReviewDetail } from '../../../../core/interfaces/i-admin-coworker-document';
import { ICoworkerDocumentVersion } from '../../../../core/interfaces/i-coworker-document';
import { AdminCoworkerDocuments } from '../../../../core/services/admin-coworker-documents/admin-coworker-documents';
import { Platform } from '../../../../core/services/platform/platform';
import { UiConfirm } from '../../../../core/services/ui-confirm/ui-confirm';
import { UiToast } from '../../../../core/services/ui-toast/ui-toast';
import {
  ADMIN_COWORKER_DOCUMENT_ACTION,
  AdminCoworkerAcceptDocumentInput,
  AdminCoworkerDocumentAction,
  AdminCoworkerRejectDocumentInput,
  AdminCoworkerReviewTarget,
  AdminSignatureVerificationInput,
} from '../../../../core/types/admin-coworker-document';
import { EdgeFunctionError } from '../../../../core/types/edge-function-error';
import {
  isEdgeAccessError,
  normalizeEdgeFunctionError,
} from '../../../../core/utils/edge-function-error-mapping';
import { ContextHelp } from '../../../../public/common/context-help/context-help';
import { LoadingOverlay } from '../../../../public/common/loading-overlay/loading-overlay';
import { AdminCoworkerDocumentError } from '../admin-coworker-document-error/admin-coworker-document-error';
import {
  isAdminCoworkerDocumentStaleError,
  resolveAdminCoworkerDocumentError,
} from '../admin-coworker-document-errors';
import { createAdminCoworkerDocumentsI18n } from '../private-documents/private-documents.i18n';
import { ReviewDecisionEditor } from '../review-decision-editor/review-decision-editor';
import { ReviewDocumentSummary } from '../review-document-summary/review-document-summary';
import { ReviewDocumentVersions } from '../review-document-versions/review-document-versions';
import { ReviewHistory } from '../review-history/review-history';
import { SignatureVerificationEditor } from '../signature-verification-editor/signature-verification-editor';

@Component({
  selector: 'app-admin-coworker-review-detail',
  standalone: true,
  imports: [
    RouterLink,
    ButtonModule,
    ContextHelp,
    LoadingOverlay,
    AdminCoworkerDocumentError,
    ReviewDecisionEditor,
    ReviewDocumentSummary,
    ReviewDocumentVersions,
    ReviewHistory,
    SignatureVerificationEditor,
  ],
  templateUrl: './review-detail.html',
  providers: [provideTranslocoScope('adminCoworkerDocuments', 'common')],
})
export class ReviewDetail {
  private readonly destroyRef = inject(DestroyRef);
  private readonly route = inject(ActivatedRoute);
  private readonly documents = inject(AdminCoworkerDocuments);
  private readonly platform = inject(Platform);
  private readonly confirm = inject(UiConfirm);
  private readonly toast = inject(UiToast);
  private readonly target: AdminCoworkerReviewTarget = {
    userId: this.route.snapshot.paramMap.get('userId')!,
    documentId: this.route.snapshot.paramMap.get('documentId')!,
  };

  protected readonly i18n = createAdminCoworkerDocumentsI18n();
  protected readonly resolveError = resolveAdminCoworkerDocumentError;
  protected readonly ADMIN_COWORKER_DOCUMENT_ACTION = ADMIN_COWORKER_DOCUMENT_ACTION;
  protected readonly detail = signal<IAdminCoworkerDocumentReviewDetail | null>(null);
  protected readonly isLoading = signal(true);
  protected readonly loadError = signal<EdgeFunctionError | null>(null);
  protected readonly actionError = signal<EdgeFunctionError | null>(null);
  protected readonly actionErrorFallback = signal('');
  protected readonly activeAction = signal<AdminCoworkerDocumentAction | null>(null);
  protected readonly downloadingVersionId = signal<string | null>(null);
  protected readonly isEdgeAccessError = isEdgeAccessError;

  constructor() {
    this.loadDetail();
  }

  protected loadDetail(): void {
    this.isLoading.set(true);
    this.loadError.set(null);
    this.documents
      .getReviewDetail(this.target.userId, this.target.documentId)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isLoading.set(false)),
      )
      .subscribe({
        next: (detail) => {
          this.detail.set(detail);
          this.actionError.set(null);
          this.actionErrorFallback.set('');
        },
        error: (error) => {
          const normalized = normalizeEdgeFunctionError(
            error,
            this.i18n.review().errors.load,
          );
          this.detail.set(null);
          this.loadError.set(normalized);
        },
      });
  }

  protected confirmStartReview(event: Event): void {
    if (!this.detail()?.submittedVersion || this.isBusy()) return;
    this.confirm.decision(event, {
      message: this.i18n.review().messages.startReviewConfirmation,
      acceptLabel: this.i18n.review().actions.startReview,
      rejectLabel: this.i18n.commonActions().cancel,
      accept: () => this.runCommand(
        ADMIN_COWORKER_DOCUMENT_ACTION.startReview,
        this.documents.startReview(this.target.userId, this.target.documentId),
        this.i18n.review().messages.startReviewSuccess,
        this.i18n.review().errors.startReview,
      ),
    });
  }

  protected verifySignature(
    input: AdminSignatureVerificationInput,
  ): void {
    const version = this.detail()?.submittedVersion;
    if (!version || this.isBusy()) return;
    this.runCommand(
      ADMIN_COWORKER_DOCUMENT_ACTION.verifySignature,
      this.documents.verifySignature({
        ...this.target,
        documentVersionId: version.id,
        ...input,
      }),
      this.i18n.review().messages.signatureVerified,
      this.i18n.review().errors.verifySignature,
    );
  }

  protected acceptDocument(input: AdminCoworkerAcceptDocumentInput): void {
    if (!this.detail()?.submittedVersion || this.isBusy()) return;
    this.runCommand(
      ADMIN_COWORKER_DOCUMENT_ACTION.acceptDocument,
      this.documents.acceptDocument({ ...this.target, ...input }),
      this.i18n.review().messages.documentAccepted,
      this.i18n.review().errors.acceptDocument,
    );
  }

  protected rejectDocument(input: AdminCoworkerRejectDocumentInput): void {
    if (!this.detail()?.submittedVersion || this.isBusy()) return;
    this.runCommand(
      ADMIN_COWORKER_DOCUMENT_ACTION.rejectDocument,
      this.documents.rejectDocument({ ...this.target, ...input }),
      this.i18n.review().messages.documentRejected,
      this.i18n.review().errors.rejectDocument,
    );
  }

  protected downloadVersion(version: ICoworkerDocumentVersion): void {
    if (this.detail()?.submittedVersion?.id !== version.id || this.isBusy()) {
      return;
    }
    this.activeAction.set(ADMIN_COWORKER_DOCUMENT_ACTION.downloadDocumentVersion);
    this.downloadingVersionId.set(version.id);
    this.actionError.set(null);
    this.documents
      .downloadDocumentVersion({
        userId: this.target.userId,
        documentVersionId: version.id,
        purpose: 'admin_review',
      })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.activeAction.set(null);
          this.downloadingVersionId.set(null);
        }),
      )
      .subscribe({
        next: (response) => this.platform.openNewTab(response.download.signedUrl),
        error: (error) => this.handleCommandError(
          error,
          this.i18n.review().errors.download,
        ),
      });
  }

  protected isBusy(): boolean {
    return this.isLoading() || this.activeAction() !== null;
  }

  private runCommand<TResult>(
    action: AdminCoworkerDocumentAction,
    request: Observable<TResult>,
    success: string,
    fallback: string,
  ): void {
    this.activeAction.set(action);
    this.actionError.set(null);
    this.actionErrorFallback.set('');
    request.pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.activeAction.set(null)),
    ).subscribe({
      next: () => {
        this.toast.success({
          summary: this.i18n.messages().actionSuccessSummary,
          detail: success,
        });
        this.loadDetail();
      },
      error: (error) => this.handleCommandError(error, fallback),
    });
  }

  private handleCommandError(error: unknown, fallback: string): void {
    const normalized = normalizeEdgeFunctionError(error, fallback);
    this.actionErrorFallback.set(fallback);
    this.actionError.set(normalized);
    if (isEdgeAccessError(normalized)) {
      this.detail.set(null);
      this.loadError.set(normalized);
      return;
    }
    if (
      (
        normalized.status === HttpStatusCode.NotFound ||
        normalized.status === HttpStatusCode.Conflict
      ) &&
      isAdminCoworkerDocumentStaleError(normalized)
    ) {
      this.loadDetail();
    }
  }
}
