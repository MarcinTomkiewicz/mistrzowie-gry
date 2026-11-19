import { Component, computed, DestroyRef, inject, signal, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, NavigationEnd, NavigationStart, Router } from '@angular/router';
import { provideTranslocoScope } from '@jsverse/transloco';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { IftaLabelModule } from 'primeng/iftalabel';
import { TextareaModule } from 'primeng/textarea';
import { finalize, Observable, Subscription } from 'rxjs';

import { STATUS_BADGE_CLASS } from '../../../../core/configs/badge-class.config';
import type {
  IAdminCoworkerOnboardingDocument,
  IAdminCoworkerOnboardingDetail,
  IAdminPrivateDocumentUpload,
} from '../../../../core/interfaces/i-admin-coworker-onboarding';
import type { ICoworkerDocumentDownload } from '../../../../core/interfaces/i-coworker-onboarding';
import type { IPdfPreview } from '../../../../core/interfaces/i-pdf';
import { AdminCoworkerOnboarding } from '../../../../core/services/admin-coworker-onboarding/admin-coworker-onboarding';
import { Platform } from '../../../../core/services/platform/platform';
import { UiConfirm } from '../../../../core/services/ui-confirm/ui-confirm';
import { UiToast } from '../../../../core/services/ui-toast/ui-toast';
import {
  COWORKER_ONBOARDING_SCOPE,
  createCoworkerOnboardingI18n,
} from '../../../../core/translations/coworker-onboarding.i18n';
import type {
  CoworkerDocumentDownloadTarget,
  CoworkerDocumentReviewDecision,
} from '../../../../core/types/coworker-onboarding';
import { formatTimestampLabel } from '../../../../core/utils/date';
import { stablePartition } from '../../../../core/utils/stable-partition';
import { getUserDisplayName } from '../../../../core/utils/user-display';
import { requiredTrimmedValidator } from '../../../../core/validators/required-trimmed.validator';
import { LoadingOverlay } from '../../../../common/loading-overlay/loading-overlay';
import { PdfViewerDialog } from '../../../../common/pdf-viewer-dialog/pdf-viewer-dialog';
import { getOnboardingErrorMessage, getOnboardingMutationErrorToast } from '../onboarding-error';
import { createAdminOnboardingProgress } from '../onboarding-progress';
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
  templateUrl: './coworker-onboarding-detail.html',
  providers: [provideTranslocoScope(COWORKER_ONBOARDING_SCOPE, 'common')],
})
export class CoworkerOnboardingDetail {
  private readonly api = inject(AdminCoworkerOnboarding);
  private readonly confirm = inject(UiConfirm);
  private readonly platform = inject(Platform);
  private readonly toast = inject(UiToast);
  private readonly destroyRef = inject(DestroyRef);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly batch = viewChild(PrivateDocumentBatch);
  private readonly onboardingId = signal<string | null>(null);
  private readonly pendingMutationIds = signal<readonly string[]>([]);
  private loadSubscription: Subscription | null = null;

  protected readonly i18n = createCoworkerOnboardingI18n();
  protected readonly STATUS_BADGE_CLASS = STATUS_BADGE_CLASS;
  protected readonly formatTimestampLabel = formatTimestampLabel;
  protected readonly getUserDisplayName = getUserDisplayName;
  protected readonly detail = signal<IAdminCoworkerOnboardingDetail | null>(null);
  protected readonly loading = signal(true);
  protected readonly busy = computed(() => {
    const onboardingId = this.onboardingId();
    return onboardingId !== null && this.pendingMutationIds().includes(onboardingId);
  });
  protected readonly loadFailed = signal(false);
  protected readonly preview = signal<IPdfPreview | null>(null);
  protected readonly rejectionAssignmentId = signal<string | null>(null);
  protected readonly rejectionReason = new FormControl('', {
    nonNullable: true,
    validators: [requiredTrimmedValidator(), Validators.maxLength(1000)],
  });
  protected readonly documents = computed(() =>
    stablePartition(
      this.detail()?.documents ?? [],
      (document) => this.isCurrentDocumentVersion(document),
    ),
  );
  protected readonly progress = computed(() => {
    const onboarding = this.detail()?.onboarding;
    return onboarding
      ? createAdminOnboardingProgress(
          onboarding, this.i18n.fields(), this.i18n.statuses().assignment,
          this.i18n.commonValues(),
        )
      : null;
  });

  constructor() {
    this.route.paramMap.pipe(takeUntilDestroyed()).subscribe((params) => {
      const onboardingId = params.get('onboarding_id');
      if (this.onboardingId() !== onboardingId) {
        this.onboardingId.set(onboardingId);
        this.detail.set(null);
        this.preview.set(null);
        this.closeRejection();
        this.batch()?.reset();
      }
      this.load();
    });

    let sameUrlNavigationId: number | null = null;
    this.router.events.pipe(takeUntilDestroyed()).subscribe((event) => {
      if (event instanceof NavigationStart) {
        sameUrlNavigationId = event.url === this.router.url ? event.id : null;
      } else if (event instanceof NavigationEnd && event.id === sameUrlNavigationId) {
        sameUrlNavigationId = null;
        this.load();
      }
    });
  }

  protected load(): void {
    this.loadSubscription?.unsubscribe();
    const onboardingId = this.onboardingId();
    if (!onboardingId) {
      this.loading.set(false);
      this.showLoadError();
      return;
    }

    this.loading.set(true);
    this.loadFailed.set(false);
    this.loadSubscription = this.api
      .getOnboarding(onboardingId)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.loading.set(false)),
      )
      .subscribe({
        next: (detail) => this.detail.set(detail),
        error: (error: unknown) => this.showLoadError(error),
      });
  }

  protected openDocument(
    document: IAdminCoworkerOnboardingDocument,
    target: CoworkerDocumentDownloadTarget,
    showPreview: boolean,
  ): void {
    const onboardingId = this.onboardingId();
    const targetId = target === 'source'
      ? this.getDocumentVersionId(document)
      : document.assignment_id;
    if (!onboardingId || !targetId) return;

    const request: Observable<ICoworkerDocumentDownload> = target === 'source'
      ? this.api.getPrivateSourceDownload(targetId, onboardingId)
      : this.api.getSignedDownload(targetId, onboardingId);
    request.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: ({ url, filename }) => {
        if (this.onboardingId() !== onboardingId) return;
        if (showPreview) {
          this.preview.set({ url, title: filename });
        } else {
          this.platform.openNewTab(url);
        }
      },
      error: (error: unknown) => {
        if (this.onboardingId() !== onboardingId) return;
        this.toast.danger({
          summary: this.i18n.toast().downloadFailedSummary,
          detail: getOnboardingErrorMessage(
            error, this.i18n.toast().errors, this.i18n.toast().downloadFailedDetail,
          ),
        });
      },
    });
  }

  protected accept(document: IAdminCoworkerOnboardingDocument): void {
    if (!document.assignment_id || !this.isCurrentDocumentVersion(document)) {
      return;
    }
    this.review(document.assignment_id, 'accepted', null);
  }

  protected openRejection(document: IAdminCoworkerOnboardingDocument): void {
    if (!document.assignment_id || !this.isCurrentDocumentVersion(document)) {
      return;
    }
    this.rejectionReason.reset();
    this.rejectionAssignmentId.set(document.assignment_id);
  }

  protected isCurrentDocumentVersion(
    document: IAdminCoworkerOnboardingDocument,
  ): boolean {
    const versionId = this.getDocumentVersionId(document);
    return versionId !== null && versionId === document.current_version_id;
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

  protected confirmRemove(event: Event, onboardingId: string, documentId: string): void {
    this.confirm.dangerDecision(event, {
      message: this.i18n.dialogs().removeMessage,
      acceptLabel: this.i18n.commonActions().delete,
      rejectLabel: this.i18n.commonActions().cancel,
      accept: () => {
        if (this.canMutateOnboarding(onboardingId)) {
          this.runMutation(this.api.removePrivateDocument(documentId));
        }
      },
    });
  }

  protected confirmComplete(event: Event, onboardingId: string): void {
    this.confirm.decision(event, {
      message: this.i18n.dialogs().completeMessage,
      acceptLabel: this.i18n.actions().complete,
      rejectLabel: this.i18n.commonActions().cancel,
      accept: () => {
        if (this.canMutateOnboarding(onboardingId)) {
          this.runMutation(this.api.completeOnboarding(onboardingId));
        }
      },
    });
  }

  protected confirmCancel(event: Event, onboardingId: string): void {
    this.confirm.dangerDecision(event, {
      message: this.i18n.dialogs().cancelOnboardingMessage,
      acceptLabel: this.i18n.actions().cancelOnboarding,
      acceptIcon: 'pi pi-interdiction',
      rejectLabel: this.i18n.commonActions().close,
      accept: () => {
        if (this.canMutateOnboarding(onboardingId)) {
          this.runMutation(this.api.cancelOnboarding(onboardingId));
        }
      },
    });
  }

  protected upload(documents: readonly IAdminPrivateDocumentUpload[]): void {
    const onboardingId = this.onboardingId();
    if (!onboardingId) return;
    this.runMutation(
      this.api.uploadPrivateDocuments(onboardingId, documents),
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

  private canMutateOnboarding(onboardingId: string): boolean {
    const onboarding = this.detail()?.onboarding;
    return (
      !this.destroyRef.destroyed &&
      !this.loading() &&
      !this.loadFailed() &&
      !this.busy() &&
      this.onboardingId() === onboardingId &&
      onboarding?.onboarding_id === onboardingId &&
      onboarding.status === 'in_progress'
    );
  }

  private getDocumentVersionId(
    document: IAdminCoworkerOnboardingDocument,
  ): string | null {
    return document.source_version_id ?? document.current_version_id;
  }

  private showLoadError(error?: unknown): void {
    this.loadFailed.set(true);
    const fallback = this.i18n.commonErrors().generic;
    this.toast.danger({
      summary: this.i18n.adminDetail().loadError ?? fallback,
      detail: getOnboardingErrorMessage(error, this.i18n.toast().errors, fallback),
    });
  }

  private runMutation(request: Observable<unknown>, after?: () => void): void {
    const onboardingId = this.onboardingId();
    if (!onboardingId || this.busy()) return;

    this.pendingMutationIds.update((ids) => [...ids, onboardingId]);
    request.pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => {
        this.pendingMutationIds.update((ids) => ids.filter((id) => id !== onboardingId));
      }),
    ).subscribe({
      next: () => {
        if (this.onboardingId() !== onboardingId) return;
        after?.();
        this.toast.success({
          summary: this.i18n.toast().mutationSuccessSummary,
          detail: this.i18n.commonStatus().changesSaved,
        });
        this.load();
      },
      error: (error: unknown) => {
        if (this.onboardingId() !== onboardingId) return;
        this.toast.danger(getOnboardingMutationErrorToast(error, this.i18n.toast()));
      },
    });
  }
}
