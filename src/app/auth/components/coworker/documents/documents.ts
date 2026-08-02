import { HttpStatusCode } from '@angular/common/http';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { provideTranslocoScope } from '@jsverse/transloco';
import { Observable, finalize } from 'rxjs';

import { ButtonModule } from 'primeng/button';

import { STATUS_BADGE_CLASS } from '../../../../core/configs/badge-class.config';
import {
  ICoworkerDocumentPortalSubmission,
  ICoworkerDocumentPortalResponse,
  ICoworkerDocumentVersion,
} from '../../../../core/interfaces/i-coworker-document';
import { CoworkerDocuments as CoworkerDocumentsApi } from '../../../../core/services/coworker-documents/coworker-documents';
import { Platform } from '../../../../core/services/platform/platform';
import { UiToast } from '../../../../core/services/ui-toast/ui-toast';
import { EdgeFunctionError } from '../../../../core/types/edge-function-error';
import { CoworkerNotificationCopy } from '../../../../core/types/i18n/coworker-notification';
import { ToastOptions } from '../../../../core/types/toast';
import { formatTimestampLabel } from '../../../../core/utils/date';
import {
  isEdgeAccessError,
  normalizeEdgeFunctionError,
} from '../../../../core/utils/edge-function-error-mapping';
import { LoadingOverlay } from '../../../../public/common/loading-overlay/loading-overlay';
import { CoworkerNotifications } from '../notifications/coworker-notifications';
import { DocumentDefinitionCard } from './document-definition-card/document-definition-card';
import { DocumentRequirementCard } from './document-requirement-card/document-requirement-card';
import { COWORKER_DOCUMENTS_SCOPE, createDocumentsI18n } from './documents.i18n';

@Component({
  selector: 'app-documents',
  standalone: true,
  imports: [
    ButtonModule,
    CoworkerNotifications,
    DocumentDefinitionCard,
    DocumentRequirementCard,
    LoadingOverlay,
  ],
  templateUrl: './documents.html',
  providers: [provideTranslocoScope(COWORKER_DOCUMENTS_SCOPE, 'common')],
})
export class Documents {
  private readonly coworkerDocuments = inject(CoworkerDocumentsApi);
  private readonly destroyRef = inject(DestroyRef);
  private readonly platform = inject(Platform);
  private readonly toast = inject(UiToast);

  protected readonly i18n = createDocumentsI18n();
  protected readonly STATUS_BADGE_CLASS = STATUS_BADGE_CLASS;
  protected readonly formatTimestampLabel = formatTimestampLabel;
  protected readonly portal = signal<ICoworkerDocumentPortalResponse | null>(null);
  protected readonly isLoading = signal(false);
  protected readonly downloadingVersionId = signal<string | null>(null);
  protected readonly mutationBusy = signal(false);
  protected readonly activeMutationId = signal<string | null>(null);
  protected readonly requiresReload = signal(false);
  protected readonly loadError = signal<EdgeFunctionError | null>(null);
  protected readonly downloadError = signal<EdgeFunctionError | null>(null);
  protected readonly mutationError = signal<EdgeFunctionError | null>(null);

  protected readonly activeError = computed(
    () => this.loadError() ?? this.mutationError() ?? this.downloadError(),
  );
  protected readonly notificationCopy = computed<CoworkerNotificationCopy>(
    () => ({
      title: this.i18n.sections().notificationsTitle,
      description: this.i18n.sections().notificationsDescription,
      unreadCount: this.i18n.labels().unreadNotifications,
      read: this.i18n.labels().notificationRead,
      unread: this.i18n.labels().notificationUnread,
      createdAt: this.i18n.labels().notificationCreatedAt,
      technicalCode: this.i18n.labels().notificationTechnicalCode,
      markRead: this.i18n.actions().markNotificationRead,
      emptyTitle: this.i18n.commonEmpty().title,
      emptyDescription: this.i18n.commonEmpty().description,
      severities: this.i18n.statuses().notificationSeverities,
      entities: this.i18n.statuses().notificationEntities,
    }),
  );
  protected readonly isAccessBlocked = computed(() =>
    isEdgeAccessError(this.activeError()),
  );
  protected readonly errorReloadAvailable = computed(() => {
    const error = this.activeError();
    return error !== null &&
      !this.isAccessBlocked() &&
      (
        this.loadError() !== null ||
        error.status === HttpStatusCode.NotFound ||
        this.requiresReload()
      );
  });
  protected readonly actionsBlocked = computed(() =>
    this.isLoading() ||
    this.loadError() !== null ||
    this.mutationBusy() ||
    this.downloadingVersionId() !== null ||
    this.requiresReload() ||
    this.isAccessBlocked()
  );
  protected readonly errorTitle = computed(() => {
    const error = this.activeError();
    const translations = this.i18n.errors();
    if (error?.status === HttpStatusCode.Unauthorized) return translations.sessionTitle;
    if (error?.status === HttpStatusCode.Forbidden) return translations.unauthorizedTitle;
    if (this.loadError()) return translations.loadTitle;
    return this.mutationError() ? translations.actionTitle : translations.downloadTitle;
  });
  protected readonly errorDescription = computed(() => {
    const error = this.activeError();
    const translations = this.i18n.errors();
    if (error?.status === HttpStatusCode.Unauthorized) return translations.sessionDescription;
    if (error?.status === HttpStatusCode.Forbidden) return translations.unauthorizedDescription;
    if (this.loadError()) return translations.loadDescription;
    if (this.mutationError()) {
      return error?.status === HttpStatusCode.Conflict
        ? translations.conflictDescription
        : translations.actionDescription;
    }
    if (error?.code === 'EDGE_INVALID_SUCCESS_RESPONSE') {
      return translations.invalidDownloadResponse;
    }
    if (error?.status === HttpStatusCode.NotFound) return translations.downloadNotFound;
    if (error?.status === HttpStatusCode.Conflict) return translations.downloadConflict;
    if (error?.status === HttpStatusCode.BadGateway) return translations.storageError;
    return translations.unexpectedDescription;
  });

  constructor() {
    this.load();
  }

  protected load(): void {
    if (this.isLoading()) return;
    this.isLoading.set(true);
    this.loadError.set(null);
    this.downloadError.set(null);
    this.mutationError.set(null);

    this.coworkerDocuments.getPortal().pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.isLoading.set(false)),
    ).subscribe({
      next: (portal) => {
        this.portal.set(portal);
        this.requiresReload.set(false);
      },
      error: (error: unknown) => this.loadError.set(this.normalizeError(error)),
    });
  }

  protected downloadVersion(version: ICoworkerDocumentVersion): void {
    if (this.actionsBlocked()) return;
    this.downloadError.set(null);
    this.mutationError.set(null);
    this.downloadingVersionId.set(version.id);

    this.coworkerDocuments.downloadDocumentVersion(version.id).pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.downloadingVersionId.set(null)),
    ).subscribe({
      next: (response) => this.platform.openNewTab(response.download.signedUrl),
      error: (error: unknown) => {
        const normalized = this.normalizeError(error);
        this.downloadError.set(normalized);
        this.registerBlockingError(normalized, false);
      },
    });
  }

  protected submitDocument(document: ICoworkerDocumentPortalSubmission): void {
    const version = document.currentVersion;
    if (version === null) return;
    const translations = this.i18n.toast();

    this.runMutation(
      document.id,
      this.coworkerDocuments.submitDocument(document.id, version.id),
      {
        summary: translations.submitSummary,
        detail: translations.submitDetail,
      },
    );
  }

  protected withdrawDocument(documentId: string): void {
    const translations = this.i18n.toast();

    this.runMutation(
      documentId,
      this.coworkerDocuments.withdrawDocument(documentId),
      {
        summary: translations.withdrawSummary,
        detail: translations.withdrawDetail,
      },
    );
  }

  protected markNotificationRead(notificationId: string): void {
    this.runMutation(
      notificationId,
      this.coworkerDocuments.markNotificationRead(notificationId),
      null,
    );
  }

  protected handleUploadBusy(busy: boolean): void {
    this.mutationBusy.set(busy);
    this.activeMutationId.set(null);
  }

  protected handleUploadCompleted(): void {
    this.load();
  }

  protected requestReload(): void {
    this.requiresReload.set(true);
    this.load();
  }

  protected registerBlockingError(
    error: EdgeFunctionError,
    exposeAsMutationError = true,
  ): void {
    if (error.status === HttpStatusCode.Conflict) this.requiresReload.set(true);
    if (exposeAsMutationError &&
      (isEdgeAccessError(error) || error.status === HttpStatusCode.Conflict)) {
      this.mutationError.set(error);
    }
  }

  private runMutation<TResult>(
    mutationId: string,
    request: Observable<TResult>,
    successToast: ToastOptions | null,
  ): void {
    if (this.actionsBlocked()) return;
    this.mutationError.set(null);
    this.downloadError.set(null);
    this.mutationBusy.set(true);
    this.activeMutationId.set(mutationId);

    request.pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => {
        this.mutationBusy.set(false);
        this.activeMutationId.set(null);
      }),
    ).subscribe({
      next: () => {
        if (successToast !== null) this.toast.success(successToast);
        this.load();
      },
      error: (error: unknown) => {
        const normalized = this.normalizeError(error);
        this.mutationError.set(normalized);
        this.registerBlockingError(normalized);
      },
    });
  }

  private normalizeError(error: unknown): EdgeFunctionError {
    return normalizeEdgeFunctionError(
      error,
      this.i18n.errors().unexpectedDescription,
    );
  }
}
