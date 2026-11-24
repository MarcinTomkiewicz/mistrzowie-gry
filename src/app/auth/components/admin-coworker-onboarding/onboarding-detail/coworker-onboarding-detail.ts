import { Component, computed, DestroyRef, inject, signal, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, NavigationEnd, NavigationStart, Router } from '@angular/router';
import { provideTranslocoScope } from '@jsverse/transloco';
import { AccordionModule } from 'primeng/accordion';
import { ButtonModule } from 'primeng/button';
import { finalize, Observable, Subscription } from 'rxjs';

import { STATUS_BADGE_CLASS } from '../../../../core/configs/badge-class.config';
import type {
  IAdminCoworkerDocumentCategory,
  IAdminCoworkerOnboardingDetail,
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
import { formatTimestampLabel } from '../../../../core/utils/date';
import { getUserDisplayName } from '../../../../core/utils/user-display';
import { LoadingOverlay } from '../../../../common/loading-overlay/loading-overlay';
import { PdfViewerDialog } from '../../../../common/pdf-viewer-dialog/pdf-viewer-dialog';
import { OnboardingDetailTab } from '../../admin-coworkers/admin-coworker-shell/onboarding-detail-tab';
import { getDocumentVersionId } from '../document-version';
import { getOnboardingErrorMessage, getOnboardingMutationErrorToast } from '../../../common/onboarding-error';
import { createAdminOnboardingProgress } from '../onboarding-progress';
import type { PrivateDocumentDownloadBatch } from '../private-document-list/private-document-list';
import { PrivateDocumentZip } from '../private-document-zip';
import {
  PrivateDocuments,
  type PrivateDocumentFileOperation,
  type PrivateDocumentMutation,
} from '../private-documents/private-documents';

@Component({
  selector: 'app-coworker-onboarding-detail',
  standalone: true,
  imports: [
    AccordionModule,
    ButtonModule,
    LoadingOverlay,
    PdfViewerDialog,
    PrivateDocuments,
  ],
  templateUrl: './coworker-onboarding-detail.html',
  providers: [provideTranslocoScope(COWORKER_ONBOARDING_SCOPE, 'common')],
})
export class CoworkerOnboardingDetail {
  private readonly api = inject(AdminCoworkerOnboarding);
  private readonly confirm = inject(UiConfirm);
  private readonly platform = inject(Platform);
  private readonly documentZip = new PrivateDocumentZip(this.platform);
  private readonly toast = inject(UiToast);
  private readonly destroyRef = inject(DestroyRef);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly detailTab = inject(OnboardingDetailTab);
  private readonly privateDocuments = viewChild(PrivateDocuments);
  private readonly onboardingId = signal<string | null>(null);
  private readonly pendingMutationIds = signal<readonly string[]>([]);
  private loadSubscription: Subscription | null = null;

  protected readonly i18n = createCoworkerOnboardingI18n();
  protected readonly STATUS_BADGE_CLASS = STATUS_BADGE_CLASS;
  protected readonly formatTimestampLabel = formatTimestampLabel;
  protected readonly detail = signal<IAdminCoworkerOnboardingDetail | null>(null);
  protected readonly coworkerName = computed(() => {
    const person = this.detail()?.onboarding;
    return person ? getUserDisplayName({
      firstName: person.first_name,
      nickname: person.nickname,
      useNickname: person.use_nickname,
    }) || person.email || '' : '';
  });
  protected readonly onboardingInProgress = computed(() =>
    this.detail()?.onboarding.status === 'in_progress',
  );
  protected readonly loading = signal(true);
  protected readonly zipProgress = this.documentZip.progress;
  protected readonly busy = computed(() => {
    const onboardingId = this.onboardingId();
    return onboardingId !== null && this.pendingMutationIds().includes(onboardingId);
  });
  protected readonly loadFailed = signal(false);
  protected readonly preview = signal<IPdfPreview | null>(null);
  protected readonly categories = signal<readonly IAdminCoworkerDocumentCategory[]>([]);
  protected readonly categoriesLoading = signal(false);
  protected readonly categoriesLoadFailed = signal(false);
  protected readonly progress = computed(() => {
    const onboarding = this.detail()?.onboarding;
    const { accepted, rejected } = this.i18n.commonEntityStatuses();
    return onboarding && accepted && rejected
      ? createAdminOnboardingProgress(
          onboarding, this.i18n.fields(), { accepted, rejected },
          this.i18n.commonValues(),
        )
      : null;
  });

  constructor() {
    this.destroyRef.onDestroy(() => {
      this.documentZip.cancel();
      this.detailTab.current.set(null);
    });
    this.loadCategories();
    this.route.paramMap.pipe(takeUntilDestroyed()).subscribe((params) => {
      const routeId = params.get('onboarding_id');
      const onboardingId = routeId?.toLowerCase() ?? null;
      this.detailTab.current.set(routeId ? { id: routeId } : null);
      if (this.onboardingId() !== onboardingId) {
        this.documentZip.cancel();
        this.onboardingId.set(onboardingId);
        this.detail.set(null);
        this.preview.set(null);
      }
      this.load();
    });

    let sameUrlNavigationId: number | null = null;
    this.router.events.pipe(takeUntilDestroyed()).subscribe((event) => {
      if (event instanceof NavigationStart) {
        sameUrlNavigationId = event.url === this.router.url ? event.id : null;
      } else if (event instanceof NavigationEnd && event.id === sameUrlNavigationId) {
        sameUrlNavigationId = null;
        this.loadCategories();
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
    this.loadSubscription = this.api.getOnboarding(onboardingId).pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.loading.set(false)),
    ).subscribe({
      next: (detail) => {
        if (this.onboardingId() !== onboardingId) return;
        this.detail.set(detail);
        this.detailTab.setName(this.coworkerName());
      },
      error: (error: unknown) => this.showLoadError(error),
    });
  }

  protected loadCategories(): void {
    if (this.categoriesLoading()) return;
    this.categoriesLoading.set(true);
    this.categoriesLoadFailed.set(false);
    this.api.getDocumentCategories().pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.categoriesLoading.set(false)),
    ).subscribe({
      next: (categories) => this.categories.set(categories),
      error: () => this.categoriesLoadFailed.set(true),
    });
  }

  protected mutatePrivateDocuments(mutation: PrivateDocumentMutation, onboardingId: string): void {
    const status = this.detail()?.onboarding.status;
    const allowed = mutation.kind === 'review' || mutation.kind === 'reclassify' ||
      status === 'in_progress' || (mutation.kind === 'upload' && status === 'completed');
    if (!this.canMutateOnboarding(onboardingId, allowed)) return;

    let request: Observable<unknown>;
    switch (mutation.kind) {
      case 'upload':
        request = this.api.uploadPrivateDocuments(onboardingId, mutation.documents);
        break;
      case 'remove':
        request = this.api.removePrivateDocument(mutation.documentId);
        break;
      case 'review':
        request = this.api.reviewSignedDocument(mutation.assignmentId, mutation.decision, mutation.reason);
        break;
      case 'reclassify':
        this.runMutation(
          this.api.setDocumentCategory(onboardingId, mutation.documentIds, mutation.categoryKey),
          ({ changed_count, unchanged_count }) => {
            this.privateDocuments()?.mutationSucceeded(mutation.kind);
            return this.i18n.adminDetail().bulk.categoryResult
              .replace('{{changed}}', String(changed_count))
              .replace('{{unchanged}}', String(unchanged_count));
          },
        );
        return;
    }
    this.runMutation(request, () => this.privateDocuments()?.mutationSucceeded(mutation.kind));
  }

  protected openDocument(operation: PrivateDocumentFileOperation, expectedId: string): void {
    const onboardingId = this.onboardingId();
    const { document, target, kind } = operation;
    const targetId = target === 'source'
      ? getDocumentVersionId(document)
      : document.assignment_id;
    if (onboardingId !== expectedId || !targetId) return;

    this.getDocumentDownload(target, targetId, onboardingId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: ({ url, filename }) => {
        if (this.onboardingId() !== onboardingId) return;
        if (kind === 'preview') {
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
            error, this.i18n, this.i18n.toast().downloadFailedDetail,
          ),
        });
      },
    });
  }

  protected async downloadPrivateDocuments(batch: PrivateDocumentDownloadBatch, onboardingId: string): Promise<void> {
    if (!this.platform.isBrowser || !this.canMutateOnboarding(onboardingId, true)) return;

    const { documents, target } = batch;
    const ids = documents.map((document) => target === 'source'
      ? getDocumentVersionId(document)
      : document.signed_original_filename ? document.assignment_id : null,
    ).filter((id): id is string => !!id);

    try {
      if (target === 'source' && ids.length !== documents.length) {
        throw new Error('A source version is missing from the ZIP selection.');
      }
      const filename = target === 'source' ? 'dokumenty-prywatne.zip' : 'podpisane-dokumenty-prywatne.zip';
      await this.documentZip.download(ids, (id) => this.getDocumentDownload(target, id, onboardingId), filename);
    } catch (error) {
      if (this.destroyRef.destroyed || this.onboardingId() !== onboardingId) return;
      const fallback = this.i18n.adminDetail().bulk.zipFailed;
      this.toast.danger({
        summary: getOnboardingErrorMessage(error, this.i18n, fallback),
      });
    }
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

  private canMutateOnboarding(
    onboardingId: string,
    statusAllowsMutation = this.onboardingInProgress(),
  ): boolean {
    return (
      !this.destroyRef.destroyed &&
      !this.loading() &&
      !this.loadFailed() &&
      !this.busy() &&
      this.zipProgress() === null &&
      this.onboardingId() === onboardingId &&
      this.detail()?.onboarding.onboarding_id === onboardingId &&
      statusAllowsMutation
    );
  }

  private getDocumentDownload(
    target: PrivateDocumentFileOperation['target'],
    id: string,
    onboardingId: string,
  ): Observable<ICoworkerDocumentDownload> {
    return target === 'source'
      ? this.api.getPrivateSourceDownload(id, onboardingId)
      : this.api.getSignedDownload(id, onboardingId);
  }

  private showLoadError(error?: unknown): void {
    this.loadFailed.set(true);
    this.detailTab.setName('');
    const fallback = this.i18n.commonErrors().generic;
    this.toast.danger({
      summary: this.i18n.loadErrors().onboardingDetail ?? fallback,
      detail: getOnboardingErrorMessage(error, this.i18n, fallback),
    });
  }

  private runMutation<T>(request: Observable<T>, after?: (result: T) => string | void): void {
    const onboardingId = this.onboardingId();
    if (!onboardingId || this.busy()) return;

    this.pendingMutationIds.update((ids) => [...ids, onboardingId]);
    request.pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => {
        this.pendingMutationIds.update((ids) => ids.filter((id) => id !== onboardingId));
      }),
    ).subscribe({
      next: (result) => {
        if (this.onboardingId() !== onboardingId) return;
        this.toast.success({
          summary: this.i18n.toast().mutationSuccessSummary,
          detail: after?.(result) ?? this.i18n.commonStatus().changesSaved,
        });
        this.load();
      },
      error: (error: unknown) => {
        if (this.onboardingId() !== onboardingId) return;
        this.toast.danger(getOnboardingMutationErrorToast(error, this.i18n));
      },
    });
  }
}
