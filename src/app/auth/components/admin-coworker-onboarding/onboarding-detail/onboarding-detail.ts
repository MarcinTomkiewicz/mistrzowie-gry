import { Component, inject, signal, viewChild } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { provideTranslocoScope } from '@jsverse/transloco';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { IftaLabelModule } from 'primeng/iftalabel';
import { TextareaModule } from 'primeng/textarea';
import { finalize, Observable } from 'rxjs';

import { STATUS_BADGE_CLASS } from '../../../../core/configs/badge-class.config';
import type {
  IAdminCoworkerOnboardingDocument,
  IAdminCoworkerOnboardingDetail,
  IAdminPrivateDocumentUpload,
} from '../../../../core/interfaces/i-admin-coworker-onboarding';
import type { IPdfPreview } from '../../../../core/interfaces/i-pdf';
import { AdminCoworkerOnboarding } from '../../../../core/services/admin-coworker-onboarding/admin-coworker-onboarding';
import { Platform } from '../../../../core/services/platform/platform';
import { UiConfirm } from '../../../../core/services/ui-confirm/ui-confirm';
import { UiToast } from '../../../../core/services/ui-toast/ui-toast';
import {
  COWORKER_ONBOARDING_SCOPE,
  createCoworkerOnboardingI18n,
} from '../../../../core/translations/coworker-onboarding.i18n';
import type { CoworkerDocumentReviewDecision } from '../../../../core/types/coworker-onboarding';
import { formatTimestampLabel } from '../../../../core/utils/date';
import { getUserDisplayName } from '../../../../core/utils/user-display';
import { LoadingOverlay } from '../../../../common/loading-overlay/loading-overlay';
import { PdfViewerDialog } from '../../../../common/pdf-viewer-dialog/pdf-viewer-dialog';
import { PrivateDocumentBatch } from '../private-document-batch/private-document-batch';

@Component({
  selector: 'app-coworker-onboarding-detail',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    ButtonModule,
    DialogModule,
    IftaLabelModule,
    TextareaModule,
    LoadingOverlay,
    PdfViewerDialog,
    PrivateDocumentBatch,
  ],
  templateUrl: './onboarding-detail.html',
  providers: [provideTranslocoScope(COWORKER_ONBOARDING_SCOPE, 'common')],
})
export class CoworkerOnboardingDetail {
  private readonly api = inject(AdminCoworkerOnboarding);
  private readonly confirm = inject(UiConfirm);
  private readonly platform = inject(Platform);
  private readonly toast = inject(UiToast);
  private readonly onboardingId = inject(ActivatedRoute).snapshot.paramMap.get('onboarding_id');
  private readonly batch = viewChild(PrivateDocumentBatch);

  protected readonly i18n = createCoworkerOnboardingI18n();
  protected readonly STATUS_BADGE_CLASS = STATUS_BADGE_CLASS;
  protected readonly formatTimestampLabel = formatTimestampLabel;
  protected readonly getUserDisplayName = getUserDisplayName;
  protected readonly detail = signal<IAdminCoworkerOnboardingDetail | null>(null);
  protected readonly loading = signal(true);
  protected readonly busy = signal(false);
  protected readonly loadFailed = signal(false);
  protected readonly preview = signal<IPdfPreview | null>(null);
  protected readonly rejectionAssignmentId = signal<string | null>(null);
  protected readonly rejectionReason = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, Validators.maxLength(1000)],
  });

  constructor() {
    this.load();
  }

  protected load(): void {
    if (!this.onboardingId) {
      this.loading.set(false);
      this.loadFailed.set(true);
      return;
    }

    this.loading.set(true);
    this.loadFailed.set(false);
    this.api
      .getOnboarding(this.onboardingId)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (detail) => this.detail.set(detail),
        error: () => this.loadFailed.set(true),
      });
  }

  protected previewSource(document: IAdminCoworkerOnboardingDocument): void {
    if (!this.onboardingId) return;
    this.prepareDownload(
      this.api.getSourceDownload(document.document_id, this.onboardingId),
      true,
    );
  }

  protected downloadSource(document: IAdminCoworkerOnboardingDocument): void {
    if (!this.onboardingId) return;
    this.prepareDownload(
      this.api.getSourceDownload(document.document_id, this.onboardingId),
      false,
    );
  }

  protected previewSigned(document: IAdminCoworkerOnboardingDocument): void {
    if (!document.assignment_id || !this.onboardingId) return;
    this.prepareDownload(
      this.api.getSignedDownload(document.assignment_id, this.onboardingId),
      true,
    );
  }

  protected downloadSigned(document: IAdminCoworkerOnboardingDocument): void {
    if (!document.assignment_id || !this.onboardingId) return;
    this.prepareDownload(
      this.api.getSignedDownload(document.assignment_id, this.onboardingId),
      false,
    );
  }

  protected accept(document: IAdminCoworkerOnboardingDocument): void {
    if (!document.assignment_id) return;
    this.review(document.assignment_id, 'accepted', null);
  }

  protected openRejection(document: IAdminCoworkerOnboardingDocument): void {
    if (!document.assignment_id) return;
    this.rejectionReason.reset();
    this.rejectionAssignmentId.set(document.assignment_id);
  }

  protected closeRejection(): void {
    this.rejectionAssignmentId.set(null);
    this.rejectionReason.reset();
  }

  protected reject(): void {
    const assignmentId = this.rejectionAssignmentId();
    this.rejectionReason.markAsTouched();

    if (!assignmentId || this.rejectionReason.invalid) return;
    this.review(assignmentId, 'rejected', this.rejectionReason.value.trim());
  }

  protected confirmRemove(event: Event, documentId: string): void {
    this.confirm.dangerDecision(event, {
      message: this.i18n.dialogs().removeMessage,
      acceptLabel: this.i18n.commonActions().remove,
      rejectLabel: this.i18n.commonActions().cancel,
      accept: () => this.remove(documentId),
    });
  }

  protected confirmComplete(event: Event): void {
    this.confirm.decision(event, {
      message: this.i18n.dialogs().completeMessage,
      acceptLabel: this.i18n.actions().complete,
      rejectLabel: this.i18n.commonActions().cancel,
      accept: () => this.complete(),
    });
  }

  protected upload(documents: readonly IAdminPrivateDocumentUpload[]): void {
    if (!this.onboardingId) return;
    this.runMutation(
      this.api.uploadPrivateDocuments(this.onboardingId, documents),
      () => this.batch()?.reset(),
    );
  }

  private review(
    assignmentId: string,
    decision: CoworkerDocumentReviewDecision,
    rejectionReason: string | null,
  ): void {
    this.runMutation(
      this.api.reviewSignedDocument(assignmentId, decision, rejectionReason),
      () => this.closeRejection(),
    );
  }

  private remove(documentId: string): void {
    this.runMutation(this.api.removePrivateDocument(documentId));
  }

  private complete(): void {
    if (!this.onboardingId) return;
    this.runMutation(this.api.completeOnboarding(this.onboardingId));
  }

  private runMutation(request: Observable<unknown>, after?: () => void): void {
    this.busy.set(true);
    request.pipe(finalize(() => this.busy.set(false))).subscribe({
      next: () => {
        after?.();
        this.showMutationSuccess();
        this.load();
      },
      error: () => this.showMutationError(),
    });
  }

  private prepareDownload(
    request: ReturnType<AdminCoworkerOnboarding['getSourceDownload']>,
    showPreview: boolean,
  ): void {
    request.subscribe({
      next: ({ url, filename }) => {
        if (showPreview) {
          this.preview.set({ url, title: filename });
        } else {
          this.platform.openNewTab(url);
        }
      },
      error: () => this.toast.danger({
        summary: this.i18n.toast().downloadFailedSummary,
        detail: this.i18n.toast().downloadFailedDetail,
      }),
    });
  }

  private showMutationSuccess(): void {
    this.toast.success({
      summary: this.i18n.toast().mutationSuccessSummary,
      detail: this.i18n.toast().mutationSuccessDetail,
    });
  }

  private showMutationError(): void {
    this.toast.danger({
      summary: this.i18n.toast().mutationFailedSummary,
      detail: this.i18n.toast().mutationFailedDetail,
    });
  }
}
